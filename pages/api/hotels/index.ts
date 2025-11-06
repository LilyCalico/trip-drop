import { createClient } from "@supabase/supabase-js";
import type { NextApiRequest, NextApiResponse } from "next";
import createDateRangeArray from "@/lib/functions/createDateRangeArray";
import { createUtcDateTimeForDB } from "@/lib/functions/createUtcDateTime";
import type { Database } from "@/types/supabasetype";
import getTripDayId from "../lib/getTripDayId";

type ErrorBody = { error: string; details?: string; code?: string };

type CreateHotelStayResponse = {
  stay: Database["public"]["Tables"]["hotel_stays"]["Row"];
  stayDays: Database["public"]["Tables"]["hotel_stay_days"]["Row"][];
};

interface HotelRequestBody {
  name: string;
  address?: string | null;
  phone?: string | null;
  notes?: string | null;
  bookingReference?: string | null;
  googlePlaceId?: string | null;
  googleData?: unknown;
  checkin: string; // YYYY-MM-DDTHH:MM:00
  checkout: string; // YYYY-MM-DDTHH:MM:00
  tripId: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CreateHotelStayResponse | ErrorBody>,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ error: "Missing Authorization Bearer token" });
    }
    const accessToken = authHeader.replace("Bearer ", "");

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
    if (!supabaseUrl || !supabaseAnonKey) {
      return res.status(500).json({ error: "Supabase env not configured" });
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 認証
    const { data: userRes, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userRes?.user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    const userId = userRes.user.id;

    // 入力取得
    const {
      name,
      address,
      phone,
      notes,
      bookingReference,
      googlePlaceId,
      googleData,
      checkin,
      checkout,
      tripId,
    }: HotelRequestBody = req.body;

    // バリデーション
    if (!name || !tripId || !checkin || !checkout) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      return res.status(400).json({ error: "Hotel name is required" });
    }

    // DBからtripIdを使用してtimezoneを取得
    const { data: trip, error: tripError } = await supabase
      .from("trips")
      .select("timezone")
      .eq("id", tripId)
      .single();
    if (tripError || !trip) {
      return res.status(404).json({ error: "Trip not found" });
    }
    const timezone = trip.timezone;

    const [startDate, startTimeArray] = checkin.split("T");
    const [endDate, endTimeArray] = checkout.split("T");

    if (!startDate || !startTimeArray || !endDate || !endTimeArray) {
      return res.status(400).json({ error: "Invalid datetime format" });
    }

    const [startHour, startMinute] = startTimeArray.split(":");
    const [endHour, endMinute] = endTimeArray.split(":");

    if (!startHour || !startMinute || !endHour || !endMinute) {
      return res.status(400).json({ error: "Invalid time format" });
    }

    const startTimeHHMM = `${startHour}:${startMinute}`;
    const endTimeHHMM = `${endHour}:${endMinute}`;

    const checkinUTC = createUtcDateTimeForDB({
      selectedDate: startDate,
      selectedTime: startTimeHHMM,
      selectedTimezone: timezone,
    });
    const checkoutUTC = createUtcDateTimeForDB({
      selectedDate: endDate,
      selectedTime: endTimeHHMM,
      selectedTimezone: timezone,
    });

    if (!checkinUTC || !checkoutUTC) {
      return res.status(400).json({ error: "Invalid date conversion" });
    }

    const dateList = createDateRangeArray(startDate, endDate);
    console.log("dateList", dateList);

    let tripDayIds: string[];
    try {
      tripDayIds = await Promise.all(
        dateList.map((date) =>
          getTripDayId({
            supabase,
            tripId,
            date: date,
          }),
        ),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return res.status(400).json({
        error: "Trip day not found",
        details: `tripId=${tripId}, date range ${startDate} - ${endDate} (${message})`,
      });
    }

    // 位置情報（Google候補から）
    // 型不確定のためランタイムで安全に読む
    let pointWkt: string | null = null;
    try {
      const g = googleData as {
        geometry?: { location?: { lat?: number; lng?: number } };
      };
      const lat = g?.geometry?.location?.lat;
      const lng = g?.geometry?.location?.lng;
      if (typeof lat === "number" && typeof lng === "number") {
        pointWkt = `POINT(${lng} ${lat})`;
      }
    } catch {
      pointWkt = null;
    }

    const toTrimmedOrNull = (value?: string | null) => {
      if (typeof value !== "string") {
        return null;
      }
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    };

    const hotelStayInsert: Database["public"]["Tables"]["hotel_stays"]["Insert"] =
      {
        name: trimmedName,
        address: toTrimmedOrNull(address),
        notes: toTrimmedOrNull(notes),
        booking_reference: toTrimmedOrNull(bookingReference),
        google_place_id: toTrimmedOrNull(googlePlaceId),
        google_data: (googleData ??
          null) as Database["public"]["Tables"]["hotel_stays"]["Insert"]["google_data"],
        location: pointWkt,
        created_by: userId,
        phone: toTrimmedOrNull(phone),
        trip_id: tripId,
        check_in_at: checkinUTC,
        check_out_at: checkoutUTC,
        timezone,
      };

    const { data: stay, error: stayError } = await supabase
      .from("hotel_stays")
      .insert(hotelStayInsert)
      .select()
      .single();

    if (stayError || !stay) {
      return res.status(400).json({
        error: "Failed to create hotel stay",
        details: stayError?.message,
        code: stayError?.code,
      });
    }

    const stayDayInsertPayload: Database["public"]["Tables"]["hotel_stay_days"]["Insert"][] =
      tripDayIds.map((tripDayId, index) => ({
        stay_id: stay.id,
        trip_day_id: tripDayId,
        stay_date: dateList[index] ?? startDate,
      }));

    let stayDays: Database["public"]["Tables"]["hotel_stay_days"]["Row"][] = [];

    if (stayDayInsertPayload.length > 0) {
      const { data: insertedStayDays, error: stayDaysError } = await supabase
        .from("hotel_stay_days")
        .insert(stayDayInsertPayload)
        .select();

      if (stayDaysError) {
        return res.status(400).json({
          error: "Failed to link hotel stay days",
          details: stayDaysError.message,
          code: stayDaysError.code,
        });
      }

      stayDays = insertedStayDays ?? [];
    }

    return res.status(201).json({ stay, stayDays });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal server error";
    return res.status(500).json({ error: message });
  }
}
