import { createClient } from "@supabase/supabase-js";
import type { NextApiRequest, NextApiResponse } from "next";
import {
  type Camelize,
  convertKeysToCamelCase,
} from "@/pages/api/lib/camelize";
import { getDateInTimezone } from "@/pages/api/lib/getDateInTimezone";
import type { Database, Json, Tables } from "@/types/supabasetype";

type ErrorBody = { error: string };

type SpotRow = Tables<"spots">;
type TransportRow = Tables<"transports">;
type HotelStayRow = Tables<"hotel_stays">;
type HotelStayWithCheck = HotelStayRow & {
  check: "in" | "out" | "staying";
};

interface TripDayScheduleRow {
  trip_id: string;
  date: string;
  spots: Json | null;
  transports: Json | null;
  hotels: Json | null;
}

type TripDaySchedulePayload = {
  date: string;
  spots: SpotRow[];
  transports: TransportRow[];
  hotels: HotelStayWithCheck[];
};

type TripDayScheduleResponse = Camelize<TripDaySchedulePayload>;

const parseJsonArray = <T>(value: Json | null): T[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value as T[];
};

const deriveHotelCheckStatus = (
  scheduleDate: string,
  hotelStay: HotelStayRow,
): HotelStayWithCheck["check"] => {
  const timezone = hotelStay.timezone || "UTC";

  const checkInDate = getDateInTimezone(hotelStay.check_in_at, timezone);
  if (checkInDate === scheduleDate) {
    return "in";
  }

  const checkOutDate = getDateInTimezone(hotelStay.check_out_at, timezone);
  if (checkOutDate === scheduleDate) {
    return "out";
  }

  return "staying";
};

const isValidIsoDate = (value: string): boolean =>
  /^\d{4}-\d{2}-\d{2}$/.test(value);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TripDayScheduleResponse | ErrorBody>,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { tripId } = req.query as { tripId?: string };
  const dateParam = req.query.date;

  const date = Array.isArray(dateParam)
    ? dateParam[0]
    : typeof dateParam === "string"
      ? dateParam
      : undefined;

  if (!tripId) {
    return res.status(400).json({ error: "Parameter 'tripId' is required" });
  }

  if (!date || !isValidIsoDate(date)) {
    return res
      .status(400)
      .json({ error: "Parameter 'date' must be YYYY-MM-DD" });
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

    const { data: userRes, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userRes?.user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const { data, error } = await supabase
      .from("trip_day_schedule_v")
      .select("trip_id, date, spots, transports, hotels")
      .eq("trip_id", tripId)
      .eq("date", date)
      .maybeSingle();

    if (error) {
      console.error("Failed to fetch trip schedule:", error);
      return res.status(400).json({ error: "Failed to fetch schedule" });
    }

    const scheduleRow = data as TripDayScheduleRow | null;

    if (!scheduleRow) {
      return res.status(404).json({ error: "Trip day not found" });
    }

    const scheduleDate = scheduleRow.date;

    const payload: TripDaySchedulePayload = {
      date: scheduleDate,
      spots: parseJsonArray<SpotRow>(scheduleRow.spots),
      transports: parseJsonArray<TransportRow>(scheduleRow.transports),
      hotels: parseJsonArray<HotelStayRow>(scheduleRow.hotels).map(
        (hotel): HotelStayWithCheck => ({
          ...hotel,
          check: deriveHotelCheckStatus(scheduleDate, hotel),
        }),
      ),
    };

    const response = convertKeysToCamelCase(payload);

    return res.status(200).json(response);
  } catch (e) {
    console.error("Unexpected error fetching trip schedule:", e);
    const message = e instanceof Error ? e.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
}
