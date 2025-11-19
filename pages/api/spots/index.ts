import { createClient } from "@supabase/supabase-js";
import type { NextApiRequest, NextApiResponse } from "next";
import { createUtcDateTimeForDB } from "@/lib/functions/createUtcDateTime";
import type { Database } from "@/types/supabasetype";
import getTripDayId from "../lib/getTripDayId";

interface SpotRequestBody {
  name: string;
  address?: string;
  notes?: string;
  googlePlaceId?: string;
  location?: {
    lat: number;
    lng: number;
  };
  googleData?: any; // Google Places API data
  tripId: string;
  selectedDate: string; // YYYY-MM-DD
  selectedTime: string; // HH:MM
  selectedTimezone: string; // timezone(Europe/Stockholm etc.)
}

type ErrorBody = { error: string; details?: string; code?: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<
    Database["public"]["Tables"]["spots"]["Row"] | ErrorBody
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

    // Anon Key + ユーザー認証でRLSを正しく適用
    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // ユーザー情報を取得
    const { data: userRes, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userRes?.user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const userId = userRes.user.id;

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
    }: SpotRequestBody = req.body;

    // バリデーション
    if (!name || name.trim() === "") {
      return res.status(400).json({ error: "Name is required" });
    }

    if (!tripId) {
      return res
        .status(400)
        .json({ error: "TripId and visitDateTime are required" });
    }

    if (!selectedDate || !selectedTime || !selectedTimezone) {
      return res
        .status(400)
        .json({ error: "Selected date, time, and timezone are required" });
    }

    // trip_day_idを取得（存在しない場合は自動作成）
    const tripDayId = await getTripDayId({
      supabase,
      tripId: tripId,
      date: selectedDate,
    });

    // ISO文字列をYYYY-MM-DD形式に変換
    const dateOnly = new Date(selectedDate).toISOString().split("T")[0];

    const visitDateTime = createUtcDateTimeForDB({
      selectedDate: dateOnly,
      selectedTime: selectedTime,
      selectedTimezone: selectedTimezone,
    });

    if (!visitDateTime) {
      return res.status(400).json({
        error: "Failed to create visit datetime",
        details: "Invalid date/time/timezone combination",
      });
    }

    // Supabaseに保存するデータを準備
    const spotData: Database["public"]["Tables"]["spots"]["Insert"] = {
      name: name.trim(),
      address: address?.trim() || null,
      visit_datetime: visitDateTime,
      notes: notes?.trim() || null,
      google_place_id: googlePlaceId || null,
      location: location ? `POINT(${location.lng} ${location.lat})` : null,
      created_by: userId,
      trip_day_id: tripDayId,
      google_data: googleData || null,
      description: null,
    };

    // Supabaseに保存
    const { data, error } = await supabase
      .from("spots")
      .insert(spotData)
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      console.error("Spot data that failed to insert:", spotData);
      return res.status(400).json({
        error: "Failed to create spot",
        details: error.message,
        code: error.code,
      });
    }

    res.status(201).json(data);
  } catch (error) {
    console.error("Error creating spot:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
