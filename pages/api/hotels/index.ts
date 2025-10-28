import { createClient } from "@supabase/supabase-js";
import type { NextApiRequest, NextApiResponse } from "next";
import { createUtcDateTimeForDB } from "@/lib/functions/createUtcDateTime";
import type { Database } from "@/types/supabasetype";
import getTripDayId from "../lib/getTripDayId";
import { createDateRange } from "@/lib/functions/createDateRange";

type ErrorBody = { error: string; details?: string; code?: string };

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
  res: NextApiResponse<
    Database["public"]["Tables"]["hotels"]["Row"][] | ErrorBody
  >,
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

    console.log("startDate", startDate);
    console.log("startTimeArray", startTimeArray);
    console.log("endDate", endDate);
    console.log("endTimeArray", endTimeArray);

    // HH:MMにする
    const startTimeHHMM = `${startTimeArray.split(":")[0]}:${startTimeArray.split(":")[1]}`;
    const endTimeHHMM = `${endTimeArray.split(":")[0]}:${endTimeArray.split(":")[1]}`;

    console.log(checkin);
    console.log(checkout);

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

    console.log("checkinUTC", checkinUTC);
    console.log("checkoutUTC", checkoutUTC);

    if (!checkinUTC || !checkoutUTC) {
      return res.status(400).json({ error: "Invalid date conversion" });
    }

    const dateList = createDateRange(startDate, endDate);

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

    // 挿入データ作成（単一レコード）
    const baseData = {
      name: name.trim(),
      address: address?.trim() ?? null,
      notes: notes?.trim() ?? null,
      booking_reference: bookingReference ?? null,
      google_place_id: googlePlaceId ?? null,
      google_data: (googleData ??
        null) as Database["public"]["Tables"]["hotels"]["Insert"]["google_data"],
      location: pointWkt,
      created_by: userId,
    } satisfies Partial<Database["public"]["Tables"]["hotels"]["Insert"]>;

    const rows: Database["public"]["Tables"]["hotels"]["Insert"][] = tripDayIds.map((tripDayId, index) => {
      const isFirstDay = index === 0;
      const isLastDay = index === tripDayIds.length - 1;

      const checkInDatetime = isFirstDay ? checkin : null;
      const checkOutDatetime = isLastDay ? checkout : null;

      return {
        ...baseData,
        phone: phone ?? null,
        trip_day_id: tripDayId,
        check_in_datetime: checkInDatetime,
        check_out_datetime: checkOutDatetime,
      } satisfies Database["public"]["Tables"]["hotels"]["Insert"];
    });

    const { data, error } = await supabase
      .from("hotels")
      .insert(rows)
      .select();

    if (error) {
      return res.status(400).json({
        error: "Failed to create hotels",
        details: error.message,
        code: error.code,
      });
    }

    return res.status(201).json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal server error";
    return res.status(500).json({ error: message });
  }
}
