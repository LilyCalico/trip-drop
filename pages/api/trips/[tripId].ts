import { createClient } from "@supabase/supabase-js";
import type { NextApiRequest, NextApiResponse } from "next";

interface ErrorBody {
  error: string;
}

interface DeleteTripResponse {
  success: true;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DeleteTripResponse | ErrorBody>,
) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { tripId } = req.query;
    const resolvedTripId = typeof tripId === "string" ? tripId : "";

    // string以外はエラーを返す（空文字含む）
    if (!resolvedTripId) {
      return res.status(400).json({ error: "Missing trip id" });
    }

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

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userRes, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userRes?.user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    const userId = userRes.user.id;

    const { data: tripData, error: tripErr } = await supabase
      .from("trips")
      .select("id, created_by")
      .eq("id", resolvedTripId)
      .single();
    if (tripErr || !tripData) {
      return res.status(404).json({ error: "Trip not found" });
    }

    let isOwner = tripData.created_by === userId;
    if (!isOwner) {
      const { data: memberRows, error: memberErr } = await supabase
        .from("trip_members")
        .select("role")
        .eq("trip_id", resolvedTripId)
        .eq("user_id", userId)
        .limit(1);
      if (memberErr) {
        return res
          .status(400)
          .json({ error: `Failed to verify membership: ${memberErr.message}` });
      }
      isOwner = (memberRows?.[0]?.role ?? null) === "owner";
    }

    if (!isOwner) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { data: tripDays, error: tripDaysErr } = await supabase
      .from("trip_days")
      .select("id")
      .eq("trip_id", resolvedTripId);
    if (tripDaysErr) {
      return res
        .status(400)
        .json({ error: `Failed to load trip days: ${tripDaysErr.message}` });
    }
    const tripDayIds =
      tripDays
        ?.map((day) => day.id)
        .filter(
          (value): value is string =>
            typeof value === "string" && value.length > 0,
        ) ?? [];

    const { data: hotelStays, error: hotelStaysErr } = await supabase
      .from("hotel_stays")
      .select("id")
      .eq("trip_id", resolvedTripId);
    if (hotelStaysErr) {
      return res.status(400).json({
        error: `Failed to load hotel stays: ${hotelStaysErr.message}`,
      });
    }
    const hotelStayIds =
      hotelStays
        ?.map((stay) => stay.id)
        .filter(
          (value): value is string =>
            typeof value === "string" && value.length > 0,
        ) ?? [];

    if (tripDayIds.length > 0) {
      const { error: delTripDayNotesErr } = await supabase
        .from("trip_day_notes")
        .delete()
        .in("trip_day_id", tripDayIds);
      if (delTripDayNotesErr) {
        return res.status(400).json({
          error: `Failed to delete trip day notes: ${delTripDayNotesErr.message}`,
        });
      }

      const { error: delTodosErr } = await supabase
        .from("todos")
        .delete()
        .in("trip_day_id", tripDayIds);
      if (delTodosErr) {
        return res.status(400).json({
          error: `Failed to delete todos: ${delTodosErr.message}`,
        });
      }

      const { error: delMemosErr } = await supabase
        .from("memos")
        .delete()
        .in("trip_day_id", tripDayIds);
      if (delMemosErr) {
        return res.status(400).json({
          error: `Failed to delete memos: ${delMemosErr.message}`,
        });
      }

      const { error: delSpotsErr } = await supabase
        .from("spots")
        .delete()
        .in("trip_day_id", tripDayIds);
      if (delSpotsErr) {
        return res
          .status(400)
          .json({ error: `Failed to delete spots: ${delSpotsErr.message}` });
      }

      const { error: delHotelsErr } = await supabase
        .from("hotels")
        .delete()
        .in("trip_day_id", tripDayIds);
      if (delHotelsErr) {
        return res
          .status(400)
          .json({ error: `Failed to delete hotels: ${delHotelsErr.message}` });
      }

      const { error: delHotelsCheckinErr } = await supabase
        .from("hotels")
        .delete()
        .in("checkin_trip_day_id", tripDayIds);
      if (delHotelsCheckinErr) {
        return res.status(400).json({
          error: `Failed to delete hotels: ${delHotelsCheckinErr.message}`,
        });
      }

      const { error: delHotelsCheckoutErr } = await supabase
        .from("hotels")
        .delete()
        .in("checkout_trip_day_id", tripDayIds);
      if (delHotelsCheckoutErr) {
        return res.status(400).json({
          error: `Failed to delete hotels: ${delHotelsCheckoutErr.message}`,
        });
      }

      const { error: delHotelStayDaysErr } = await supabase
        .from("hotel_stay_days")
        .delete()
        .in("trip_day_id", tripDayIds);
      if (delHotelStayDaysErr) {
        return res.status(400).json({
          error: `Failed to delete hotel stay days: ${delHotelStayDaysErr.message}`,
        });
      }
    }

    if (hotelStayIds.length > 0) {
      const { error: delHotelStayDaysByStayErr } = await supabase
        .from("hotel_stay_days")
        .delete()
        .in("stay_id", hotelStayIds);
      if (delHotelStayDaysByStayErr) {
        return res.status(400).json({
          error: `Failed to delete hotel stay days: ${delHotelStayDaysByStayErr.message}`,
        });
      }
    }

    const { error: delHotelStaysErr } = await supabase
      .from("hotel_stays")
      .delete()
      .eq("trip_id", resolvedTripId);
    if (delHotelStaysErr) {
      return res.status(400).json({
        error: `Failed to delete hotel stays: ${delHotelStaysErr.message}`,
      });
    }

    const { error: delTransportsErr } = await supabase
      .from("transports")
      .delete()
      .eq("trip_id", resolvedTripId);
    if (delTransportsErr) {
      return res.status(400).json({
        error: `Failed to delete transports: ${delTransportsErr.message}`,
      });
    }

    if (tripDayIds.length > 0) {
      const { error: delTripDaysErr } = await supabase
        .from("trip_days")
        .delete()
        .in("id", tripDayIds);
      if (delTripDaysErr) {
        return res.status(400).json({
          error: `Failed to delete trip days: ${delTripDaysErr.message}`,
        });
      }
    }

    const { error: delMembersErr } = await supabase
      .from("trip_members")
      .delete()
      .eq("trip_id", resolvedTripId);
    if (delMembersErr) {
      return res
        .status(400)
        .json({ error: `Failed to delete members: ${delMembersErr.message}` });
    }

    const { error: delTripErr } = await supabase
      .from("trips")
      .delete()
      .eq("id", resolvedTripId);
    if (delTripErr) {
      return res
        .status(400)
        .json({ error: `Failed to delete trip: ${delTripErr.message}` });
    }

    return res.status(200).json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
}
