import { createClient } from "@supabase/supabase-js";
import type { NextApiRequest, NextApiResponse } from "next";
import { type Camelize, convertKeysToCamelCase } from "@/types/camelize";
import type { Database, Tables } from "@/types/supabasetype";

type ErrorBody = { error: string };

type HotelStayRow = Tables<"hotel_stays">;

type HotelsResponse = {
  hotels: Camelize<HotelStayRow>[];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HotelsResponse | ErrorBody>,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { tripId } = req.query;
  const resolvedTripId = typeof tripId === "string" ? tripId : "";

  if (!resolvedTripId) {
    return res.status(400).json({ error: "Parameter 'tripId' is required" });
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
      .from("hotel_stays")
      .select("*")
      .eq("trip_id", resolvedTripId)
      .order("check_in_at", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Failed to fetch hotels:", error);
      return res.status(400).json({ error: "Failed to fetch hotels" });
    }

    const hotels = Array.isArray(data) ? data : [];

    return res.status(200).json({
      hotels: convertKeysToCamelCase(hotels),
    });
  } catch (e) {
    console.error("Unexpected error fetching hotels:", e);
    const message = e instanceof Error ? e.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
}
