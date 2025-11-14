import { createClient } from "@supabase/supabase-js";
import type { NextApiRequest, NextApiResponse } from "next";
import { createUtcDateTimeForDB } from "@/lib/functions/createUtcDateTime";
import type { Database } from "@/types/supabasetype";
import getTripDayId from "../lib/getTripDayId";

type ErrorBody = { error: string; details?: string; code?: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<
    Database["public"]["Tables"]["spots"]["Row"] | ErrorBody
  >,
) {
  const queryId = req.query.spotId;
  const spotId = Array.isArray(queryId) ? queryId[0] : queryId;

  if (!spotId) {
    return res.status(400).json({ error: "Spot ID is required" });
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
        .from("spots")
        .select()
        .eq("id", spotId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return res.status(404).json({ error: "Spot not found" });
        }
        console.error("Supabase error fetching spot:", error);
        return res.status(400).json({
          error: "Failed to fetch spot",
          details: error.message,
          code: error.code,
        });
      }

      if (!data) {
        return res.status(404).json({ error: "Spot not found" });
      }

      return res.status(200).json(data);
    }

    if (req.method === "PATCH") {
      const {
        name,
        address,
        notes,
        googlePlaceId,
        location,
        googleData,
        tripId,
        selectedDate,
        selectedTime,
        selectedTimezone,
      } = req.body as Partial<{
        name: string;
        address?: string | null;
        notes?: string | null;
        googlePlaceId?: string | null;
        location?: { lat: number; lng: number } | null;
        googleData?: unknown;
        tripId: string;
        selectedDate: string;
        selectedTime: string;
        selectedTimezone: string;
      }>;

      // どのフィールドが提供されているかをチェック
      const hasName = name !== undefined;
      const hasAddress = address !== undefined;
      const hasNotes = notes !== undefined;
      const hasVisitDateTime =
        selectedDate !== undefined &&
        selectedTime !== undefined &&
        selectedTimezone !== undefined;

      // 少なくとも1つのフィールドが提供されている必要がある
      if (!hasName && !hasAddress && !hasNotes && !hasVisitDateTime) {
        return res.status(400).json({
          error: "At least one field must be provided for update",
        });
      }

      const toTrimmedOrNull = (value?: string | null) => {
        if (typeof value !== "string") {
          return null;
        }
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
      };

      const updatePayload: Database["public"]["Tables"]["spots"]["Update"] = {};

      // nameのみの更新
      if (hasName) {
        const trimmedName = name.trim();
        if (!trimmedName) {
          return res.status(400).json({ error: "Name cannot be empty" });
        }
        updatePayload.name = trimmedName;
      }

      // addressのみの更新（他のフィールドが未提供の場合、Google関連をnullにする）
      if (hasAddress) {
        const isAddressOnlyUpdate = !hasName;

        updatePayload.address = toTrimmedOrNull(address);

        if (isAddressOnlyUpdate) {
          // addressのみが変更された場合、Google関連をnullにする
          updatePayload.google_place_id = null;
          updatePayload.google_data = null;
          updatePayload.location = null;
        } else {
          // 他のフィールドも更新される場合、Google関連も更新
          if (googlePlaceId !== undefined) {
            updatePayload.google_place_id = toTrimmedOrNull(googlePlaceId);
          }
          if (googleData !== undefined) {
            updatePayload.google_data =
              googleData as Database["public"]["Tables"]["spots"]["Update"]["google_data"];
          }
          if (location !== undefined) {
            const point =
              location &&
              typeof location.lat === "number" &&
              typeof location.lng === "number"
                ? `POINT(${location.lng} ${location.lat})`
                : null;
            updatePayload.location = point;
          }
        }
      }

      // notesのみの更新
      if (hasNotes) {
        updatePayload.notes = toTrimmedOrNull(notes);
      }

      // visit_datetimeの更新（selectedDate, selectedTime, selectedTimezoneが必要）
      if (hasVisitDateTime) {
        if (!tripId) {
          return res.status(400).json({
            error: "tripId is required when updating visit datetime",
          });
        }

        const dateOnly = new Date(selectedDate).toISOString().split("T")[0];

        const visitDateTime = createUtcDateTimeForDB({
          selectedDate: dateOnly,
          selectedTime,
          selectedTimezone,
        });

        if (!visitDateTime) {
          return res.status(400).json({
            error: "Failed to create visit datetime",
            details: "Invalid date/time/timezone combination",
          });
        }

        let tripDayId: string;
        try {
          tripDayId = await getTripDayId({
            supabase,
            tripId,
            date: dateOnly,
          });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          return res.status(400).json({
            error: "Trip day not found",
            details: message,
          });
        }

        updatePayload.visit_datetime = visitDateTime;
        updatePayload.trip_day_id = tripDayId;
      }

      const { data, error } = await supabase
        .from("spots")
        .update(updatePayload)
        .eq("id", spotId)
        .select()
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return res.status(404).json({ error: "Spot not found" });
        }
        console.error("Supabase error updating spot:", error);
        return res.status(400).json({
          error: "Failed to update spot",
          details: error.message,
          code: error.code,
        });
      }

      if (!data) {
        return res.status(404).json({ error: "Spot not found" });
      }

      return res.status(200).json(data);
    }

    if (req.method === "DELETE") {
      const { data, error } = await supabase
        .from("spots")
        .delete()
        .eq("id", spotId)
        .select()
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return res.status(404).json({ error: "Spot not found" });
        }

        console.error("Supabase error deleting spot:", error);
        return res.status(400).json({
          error: "Failed to delete spot",
          details: error.message,
          code: error.code,
        });
      }

      if (!data) {
        return res.status(404).json({ error: "Spot not found" });
      }

      return res.status(200).json(data);
    }
  } catch (error) {
    console.error("Error handling spot request:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
