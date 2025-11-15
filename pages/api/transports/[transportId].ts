import { createClient } from "@supabase/supabase-js";
import type { NextApiRequest, NextApiResponse } from "next";
import { createUtcDateTimeForDB } from "@/lib/functions/createUtcDateTime";
import type { Database, Json } from "@/types/supabasetype";

type ErrorBody = { error: string; details?: string; code?: string };

type TransportRow = Database["public"]["Tables"]["transports"]["Row"];
type TransportUpdate = Database["public"]["Tables"]["transports"]["Update"];

type UpdateTransportBody = Partial<{
  carrierName: string;
  description: string | null;
  departureLocation: string | null;
  arrivalLocation: string | null;
  departureMemo: string | null;
  arrivalMemo: string | null;
  bookingReference: string | null;
  departureDate: string;
  departureTime: string;
  arrivalDate: string;
  arrivalTime: string;
  departureTimezone: string | null;
  arrivalTimezone: string | null;
  departureGooglePlaceId: string | null;
  departureGoogleData: Json | string | null;
  arrivalGooglePlaceId: string | null;
  arrivalGoogleData: Json | string | null;
}>;

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
  res: NextApiResponse<TransportRow | ErrorBody>,
) {
  const queryId = req.query.transportId;
  const transportId = Array.isArray(queryId) ? queryId[0] : queryId;

  if (!transportId) {
    return res.status(400).json({ error: "Transport ID is required" });
  }

  if (!["GET", "PATCH", "DELETE"].includes(req.method ?? "")) {
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

    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("transports")
        .select()
        .eq("id", transportId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return res.status(404).json({ error: "Transport not found" });
        }

        console.error("Supabase error fetching transport:", error);
        return res.status(400).json({
          error: "Failed to fetch transport",
          details: error.message,
          code: error.code,
        });
      }

      if (!data) {
        return res.status(404).json({ error: "Transport not found" });
      }

      return res.status(200).json(data);
    }

    if (req.method === "PATCH") {
      const body = req.body as UpdateTransportBody;
      const hasCarrierName = body.carrierName !== undefined;
      const hasDescription = body.description !== undefined;
      const hasDepartureLocation = body.departureLocation !== undefined;
      const hasArrivalLocation = body.arrivalLocation !== undefined;
      const hasDepartureMemo = body.departureMemo !== undefined;
      const hasArrivalMemo = body.arrivalMemo !== undefined;
      const hasBookingReference = body.bookingReference !== undefined;
      const hasDepartureDateTime =
        body.departureDate !== undefined || body.departureTime !== undefined;
      const hasArrivalDateTime =
        body.arrivalDate !== undefined || body.arrivalTime !== undefined;
      const hasDepartureTimezone = body.departureTimezone !== undefined;
      const hasArrivalTimezone = body.arrivalTimezone !== undefined;
      const hasDepartureGooglePlaceId =
        body.departureGooglePlaceId !== undefined;
      const hasArrivalGooglePlaceId = body.arrivalGooglePlaceId !== undefined;
      const hasDepartureGoogleData = body.departureGoogleData !== undefined;
      const hasArrivalGoogleData = body.arrivalGoogleData !== undefined;

      if (
        !hasCarrierName &&
        !hasDescription &&
        !hasDepartureLocation &&
        !hasArrivalLocation &&
        !hasDepartureMemo &&
        !hasArrivalMemo &&
        !hasBookingReference &&
        !hasDepartureDateTime &&
        !hasArrivalDateTime &&
        !hasDepartureTimezone &&
        !hasArrivalTimezone &&
        !hasDepartureGooglePlaceId &&
        !hasArrivalGooglePlaceId &&
        !hasDepartureGoogleData &&
        !hasArrivalGoogleData
      ) {
        return res.status(400).json({ error: "No fields to update" });
      }

      const { data: currentTransport, error: currentError } = await supabase
        .from("transports")
        .select("*")
        .eq("id", transportId)
        .single();

      if (currentError || !currentTransport) {
        if (currentError?.code === "PGRST116") {
          return res.status(404).json({ error: "Transport not found" });
        }
        console.error(
          "Supabase error fetching current transport:",
          currentError,
        );
        return res.status(400).json({
          error: "Failed to fetch transport",
          details: currentError?.message,
          code: currentError?.code,
        });
      }

      const updatePayload: TransportUpdate = {};

      if (hasCarrierName) {
        const trimmedName = toTrimmedOrNull(body.carrierName) ?? "";
        if (!trimmedName) {
          return res.status(400).json({ error: "carrierName is required" });
        }
        updatePayload.name = trimmedName;
      }

      if (hasDescription) {
        updatePayload.description = toTrimmedOrNull(body.description);
      }

      if (hasDepartureLocation) {
        const trimmed = toTrimmedOrNull(body.departureLocation);
        if (!trimmed) {
          return res
            .status(400)
            .json({ error: "departureLocation is required" });
        }
        updatePayload.departure_location = trimmed;
      }

      if (hasArrivalLocation) {
        const trimmed = toTrimmedOrNull(body.arrivalLocation);
        if (!trimmed) {
          return res.status(400).json({ error: "arrivalLocation is required" });
        }
        updatePayload.arrival_location = trimmed;
      }

      if (hasDepartureMemo) {
        updatePayload.departure_memo = toTrimmedOrNull(body.departureMemo);
      }

      if (hasArrivalMemo) {
        updatePayload.arrival_memo = toTrimmedOrNull(body.arrivalMemo);
      }

      if (hasBookingReference) {
        updatePayload.booking_reference = toTrimmedOrNull(
          body.bookingReference,
        );
      }

      if (hasDepartureGooglePlaceId) {
        updatePayload.departure_google_place_id = toTrimmedOrNull(
          body.departureGooglePlaceId,
        );
      }

      if (hasArrivalGooglePlaceId) {
        updatePayload.arrival_google_place_id = toTrimmedOrNull(
          body.arrivalGooglePlaceId,
        );
      }

      if (hasDepartureGoogleData) {
        updatePayload.departure_google_data = toJsonOrNull(
          body.departureGoogleData,
        );
      }

      if (hasArrivalGoogleData) {
        updatePayload.arrival_google_data = toJsonOrNull(
          body.arrivalGoogleData,
        );
      }

      const nextDepartureTimezone =
        (hasDepartureTimezone
          ? toTrimmedOrNull(body.departureTimezone)
          : null) ?? currentTransport.departure_timezone;

      const nextArrivalTimezone =
        (hasArrivalTimezone ? toTrimmedOrNull(body.arrivalTimezone) : null) ??
        currentTransport.arrival_timezone;

      if (hasDepartureTimezone && !hasDepartureDateTime) {
        return res.status(400).json({
          error:
            "Updating departure timezone requires departureDate and departureTime",
        });
      }

      if (hasArrivalTimezone && !hasArrivalDateTime) {
        return res.status(400).json({
          error:
            "Updating arrival timezone requires arrivalDate and arrivalTime",
        });
      }

      if (hasDepartureDateTime) {
        if (!body.departureDate || !body.departureTime) {
          return res.status(400).json({
            error: "departureDate and departureTime are required",
          });
        }

        const departureUtc = createUtcDateTimeForDB({
          selectedDate: body.departureDate,
          selectedTime: body.departureTime,
          selectedTimezone: nextDepartureTimezone,
        });

        if (!departureUtc) {
          return res.status(400).json({ error: "Invalid departure datetime" });
        }

        updatePayload.departure_datetime = departureUtc;
        updatePayload.departure_timezone = nextDepartureTimezone;
      }

      if (hasArrivalDateTime) {
        if (!body.arrivalDate || !body.arrivalTime) {
          return res.status(400).json({
            error: "arrivalDate and arrivalTime are required",
          });
        }

        const arrivalUtc = createUtcDateTimeForDB({
          selectedDate: body.arrivalDate,
          selectedTime: body.arrivalTime,
          selectedTimezone: nextArrivalTimezone,
        });

        if (!arrivalUtc) {
          return res.status(400).json({ error: "Invalid arrival datetime" });
        }

        updatePayload.arrival_datetime = arrivalUtc;
        updatePayload.arrival_timezone = nextArrivalTimezone;
      }

      const resultingDepartureUtc =
        updatePayload.departure_datetime ?? currentTransport.departure_datetime;
      const resultingArrivalUtc =
        updatePayload.arrival_datetime ?? currentTransport.arrival_datetime;

      if (
        resultingDepartureUtc &&
        resultingArrivalUtc &&
        new Date(resultingArrivalUtc) <= new Date(resultingDepartureUtc)
      ) {
        return res.status(400).json({
          error: "Arrival must be after departure",
        });
      }

      if (Object.keys(updatePayload).length === 0) {
        return res.status(400).json({ error: "No fields to update" });
      }

      const { data: updatedTransport, error: updateError } = await supabase
        .from("transports")
        .update(updatePayload)
        .eq("id", transportId)
        .select()
        .single();

      if (updateError) {
        if (updateError.code === "PGRST116") {
          return res.status(404).json({ error: "Transport not found" });
        }

        console.error("Supabase error updating transport:", updateError);
        return res.status(400).json({
          error: "Failed to update transport",
          details: updateError.message,
          code: updateError.code,
        });
      }

      if (!updatedTransport) {
        return res.status(404).json({ error: "Transport not found" });
      }

      return res.status(200).json(updatedTransport);
    }

    const { data, error } = await supabase
      .from("transports")
      .delete()
      .eq("id", transportId)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ error: "Transport not found" });
      }

      console.error("Supabase error deleting transport:", error);
      return res.status(400).json({
        error: "Failed to delete transport",
        details: error.message,
        code: error.code,
      });
    }

    if (!data) {
      return res.status(404).json({ error: "Transport not found" });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error("Error handling transport request:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
