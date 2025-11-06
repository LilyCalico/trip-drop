import { createClient } from "@supabase/supabase-js";
import type { NextApiRequest, NextApiResponse } from "next";
import { getDateInTimezone } from "@/pages/api/lib/getDateInTimezone";
import { type Camelize, convertKeysToCamelCase } from "@/types/camelize";
import type { Database, Json, Tables } from "@/types/supabasetype";

type ErrorBody = { error: string };

type SpotRow = Tables<"spots">;
type TransportRow = Tables<"transports">;
type HotelStayRow = Tables<"hotel_stays">;
type HotelStayWithCheck = HotelStayRow & {
  check: "in" | "out" | "staying";
};

type TripDayScheduleItem =
  | {
      type: "spot";
      spot: SpotRow;
    }
  | {
      type: "transport";
      transport: TransportRow;
    }
  | {
      type: "hotel";
      hotel: HotelStayWithCheck;
      datetime_utc: string | null;
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
  items: TripDayScheduleItem[];
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

    const parseTimestamp = (value?: string | null): number | null => {
      if (!value) {
        return null;
      }
      const time = Date.parse(value);
      return Number.isNaN(time) ? null : time;
    };

    const spots = parseJsonArray<SpotRow>(scheduleRow.spots);

    const transports = parseJsonArray<TransportRow>(scheduleRow.transports);

    const hotels = parseJsonArray<HotelStayRow>(scheduleRow.hotels).map(
      (hotel): HotelStayWithCheck => ({
        ...hotel,
        check: deriveHotelCheckStatus(scheduleDate, hotel),
      }),
    );

    type DecoratedItem =
      | {
          priority: number;
          sortTime: number | null;
          payload: Extract<TripDayScheduleItem, { type: "spot" }>;
        }
      | {
          priority: number;
          sortTime: number | null;
          payload: Extract<TripDayScheduleItem, { type: "transport" }>;
        }
      | {
          priority: number;
          sortTime: number | null;
          payload: Extract<TripDayScheduleItem, { type: "hotel" }>;
        };

    const decoratedItems: DecoratedItem[] = [];

    spots.forEach((spot) => {
      decoratedItems.push({
        priority: 0,
        sortTime: parseTimestamp(spot.visit_datetime),
        payload: {
          type: "spot",
          spot,
        },
      });
    });

    transports.forEach((transport) => {
      decoratedItems.push({
        priority: 0,
        sortTime:
          parseTimestamp(transport.departure_datetime) ??
          parseTimestamp(transport.arrival_datetime),
        payload: {
          type: "transport",
          transport,
        },
      });
    });

    hotels.forEach((hotel) => {
      const datetimeUtc =
        hotel.check === "in"
          ? hotel.check_in_at
          : hotel.check === "out"
            ? hotel.check_out_at
            : null;

      const fallbackTime =
        parseTimestamp(datetimeUtc) ??
        parseTimestamp(hotel.check_in_at) ??
        parseTimestamp(hotel.check_out_at) ??
        parseTimestamp(hotel.created_at);

      decoratedItems.push({
        priority: hotel.check === "staying" ? 1 : 0,
        sortTime: fallbackTime,
        payload: {
          type: "hotel",
          hotel,
          datetime_utc: datetimeUtc,
        },
      });
    });

    decoratedItems.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }

      if (a.sortTime === null && b.sortTime === null) {
        return 0;
      }
      if (a.sortTime === null) {
        return 1;
      }
      if (b.sortTime === null) {
        return -1;
      }

      return a.sortTime - b.sortTime;
    });

    const items = decoratedItems.map((item) => item.payload);

    const sortedSpots = items
      .filter(
        (item): item is Extract<TripDayScheduleItem, { type: "spot" }> => {
          return item.type === "spot";
        },
      )
      .map((item) => item.spot);

    const sortedTransports = items
      .filter(
        (item): item is Extract<TripDayScheduleItem, { type: "transport" }> =>
          item.type === "transport",
      )
      .map((item) => item.transport);

    const sortedHotels = items
      .filter(
        (item): item is Extract<TripDayScheduleItem, { type: "hotel" }> =>
          item.type === "hotel",
      )
      .map((item) => item.hotel);

    const payload: TripDaySchedulePayload = {
      date: scheduleDate,
      spots: sortedSpots,
      transports: sortedTransports,
      hotels: sortedHotels,
      items,
    };

    const response = convertKeysToCamelCase(payload);

    return res.status(200).json(response);
  } catch (e) {
    console.error("Unexpected error fetching trip schedule:", e);
    const message = e instanceof Error ? e.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
}
