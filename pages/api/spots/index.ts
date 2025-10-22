import { createClient } from "@supabase/supabase-js";
import type { NextApiRequest, NextApiResponse } from "next";
import type { Database } from "@/types/supabasetype";

interface SpotRequestBody {
  name: string;
  address?: string;
  visitDateTime?: string; // ISO string from frontend
  timezone?: string;
  notes?: string;
  googlePlaceId?: string;
  location?: {
    lat: number;
    lng: number;
  };
  googleData?: any; // Google Places APIの全データ
  tripId: string;
  selectedDate: string;
}

type ErrorBody = { error: string; details?: string; code?: string };

// trip_day_idを取得する関数（存在しない場合は自動作成）
async function getOrCreateTripDay(
  supabase: ReturnType<typeof createClient<Database>>,
  tripId: string,
  date: string,
): Promise<string> {
  // 1. 既存のtrip_dayを検索
  const { data: existingTripDay, error: selectError } = await supabase
    .from("trip_days")
    .select("id")
    .eq("trip_id", tripId)
    .eq("date", date)
    .single();

  if (existingTripDay) {
    return existingTripDay.id;
  }

  // 2. 存在しない場合は作成
  if (selectError && selectError.code === "PGRST116") {
    // 行が見つからないエラーの場合のみ作成を試行
    const { data: newTripDay, error: insertError } = await supabase
      .from("trip_days")
      .insert({
        trip_id: tripId,
        date: date,
        title: null,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Error creating trip_day:", insertError);
      throw new Error(`Failed to create trip_day: ${insertError.message}`);
    }

    if (!newTripDay) {
      throw new Error(
        `Failed to create trip_day for trip ${tripId} on date ${date}`,
      );
    }

    return newTripDay.id;
  }

  // 3. その他のエラーの場合
  console.error("Error selecting trip_day:", selectError);
  throw new Error(
    `Failed to select trip_day: ${selectError?.message || "Unknown error"}`,
  );
}

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
      visitDateTime,
      notes,
      googlePlaceId,
      location,
      googleData,
      tripId,
      selectedDate,
    }: SpotRequestBody = req.body;

    // バリデーション
    if (!name || name.trim() === "") {
      return res.status(400).json({ error: "Name is required" });
    }

    if (!tripId || !selectedDate) {
      return res
        .status(400)
        .json({ error: "TripId and selectedDate are required" });
    }

    // trip_day_idを取得（存在しない場合は自動作成）
    const tripDayId = await getOrCreateTripDay(supabase, tripId, selectedDate);

    console.log("visitDateTime", visitDateTime);

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
      google_data: googleData || null, // Google Places APIの全データを保存
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

    console.log("New spot created:", data);

    // 成功レスポンス
    res.status(201).json(data);
  } catch (error) {
    console.error("Error creating spot:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
