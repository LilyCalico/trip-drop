import { createClient } from "@supabase/supabase-js";
import type { NextApiRequest, NextApiResponse } from "next";

import { createUtcDateTimeForDB } from "@/lib/functions/createUtcDateTime";
import type { Database, Json } from "@/types/supabasetype";

type ErrorBody = { error: string; details?: string; code?: string };

type TransportInsert = Database["public"]["Tables"]["transports"]["Insert"];

type TransportRow = Database["public"]["Tables"]["transports"]["Row"];

interface CreateTransportBody {
  tripId: string;
  carrierName: string;
  description?: string | null;
  departureLocation?: string | null;
  arrivalLocation?: string | null;
  departureDate: string;
  departureTime: string;
  arrivalDate: string;
  arrivalTime: string;
  bookingReference?: string | null;
  departureMemo?: string | null;
  arrivalMemo?: string | null;
  departureTimezone?: string | null;
  arrivalTimezone?: string | null;
  departureGooglePlaceId?: string | null;
  departureGoogleData?: Json | string | null;
  arrivalGooglePlaceId?: string | null;
  arrivalGoogleData?: Json | string | null;
}

const toTrimmedOrNull = (value?: string | null) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const toJsonOrNull = (value: unknown): Json | null => {
  if (value == null) {
    return null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    try {
      return JSON.parse(trimmed) as Json;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn("Invalid JSON string for Google data", { error, value });
      return null;
    }
  }

  if (typeof value === "object") {
    return value as Json;
  }

  return null;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ transport: TransportRow } | ErrorBody>,
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

    const { data: userRes, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userRes?.user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    const userId = userRes.user.id;

    const {
      tripId,
      carrierName,
      description,
      departureLocation,
      arrivalLocation,
      departureDate,
      departureTime,
      arrivalDate,
      arrivalTime,
      departureMemo,
      arrivalMemo,
      bookingReference,
      departureTimezone,
      arrivalTimezone,
      departureGooglePlaceId,
      departureGoogleData,
      arrivalGooglePlaceId,
      arrivalGoogleData,
    } = req.body as CreateTransportBody;

    if (
      !tripId ||
      !carrierName ||
      !departureDate ||
      !departureTime ||
      !arrivalDate ||
      !arrivalTime
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const trimmedName = carrierName.trim();
    if (!trimmedName) {
      return res.status(400).json({ error: "Transport name is required" });
    }

    const { data: trip, error: tripError } = await supabase
      .from("trips")
      .select("timezone")
      .eq("id", tripId)
      .single();
    if (tripError || !trip) {
      return res.status(404).json({ error: "Trip not found" });
    }

    const resolvedDepartureTimezone =
      toTrimmedOrNull(departureTimezone) ?? trip.timezone;
    const resolvedArrivalTimezone =
      toTrimmedOrNull(arrivalTimezone) ?? trip.timezone;

    const departureUtc = createUtcDateTimeForDB({
      selectedDate: departureDate,
      selectedTime: departureTime,
      selectedTimezone: resolvedDepartureTimezone,
    });
    const arrivalUtc = createUtcDateTimeForDB({
      selectedDate: arrivalDate,
      selectedTime: arrivalTime,
      selectedTimezone: resolvedArrivalTimezone,
    });

    if (!departureUtc || !arrivalUtc) {
      return res.status(400).json({ error: "Invalid datetime conversion" });
    }

    if (new Date(arrivalUtc) < new Date(departureUtc)) {
      return res.status(400).json({ error: "Arrival must be after departure" });
    }

    const resolvedDepartureLocation = toTrimmedOrNull(departureLocation);
    const resolvedArrivalLocation = toTrimmedOrNull(arrivalLocation);

    if (!resolvedDepartureLocation || !resolvedArrivalLocation) {
      return res
        .status(400)
        .json({ error: "Departure and arrival location are required" });
    }

    const transportInsertBase: TransportInsert = {
      trip_id: tripId,
      name: trimmedName,
      description: toTrimmedOrNull(description),
      departure_location: resolvedDepartureLocation,
      arrival_location: resolvedArrivalLocation,
      departure_datetime: departureUtc,
      arrival_datetime: arrivalUtc,
      departure_timezone: resolvedDepartureTimezone,
      arrival_timezone: resolvedArrivalTimezone,
      booking_reference: toTrimmedOrNull(bookingReference),
      created_by: userId,
      departure_memo: toTrimmedOrNull(departureMemo),
      arrival_memo: toTrimmedOrNull(arrivalMemo),
    };

    const transportInsert = {
      ...transportInsertBase,
      departure_google_place_id: toTrimmedOrNull(departureGooglePlaceId),
      departure_google_data: toJsonOrNull(departureGoogleData ?? null),
      arrival_google_place_id: toTrimmedOrNull(arrivalGooglePlaceId),
      arrival_google_data: toJsonOrNull(arrivalGoogleData ?? null),
    } as TransportInsert;

    const { data: transport, error: transportError } = await supabase
      .from("transports")
      .insert(transportInsert)
      .select()
      .single();

    if (transportError || !transport) {
      return res.status(400).json({
        error: "Failed to create transport",
        details: transportError?.message,
        code: transportError?.code,
      });
    }

    return res.status(201).json({ transport: transport as TransportRow });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return res.status(500).json({ error: message });
  }
}
