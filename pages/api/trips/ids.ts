import { createClient } from "@supabase/supabase-js";
import type { NextApiRequest, NextApiResponse } from "next";

interface ErrorBody {
  error: string;
}
interface TripsIdsResponse {
  tripIds: string[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TripsIdsResponse | ErrorBody>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
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
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { persistSession: false, autoRefreshToken: false }
    });

    // ユーザー情報を取得
    const { data: userRes, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userRes?.user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const userId = userRes.user.id;

    // 自分がメンバーになっているtripのIDのみ取得（最小レスポンス）
    const { data, error } = await supabase
      .from("trip_members")
      .select("trip_id")
      .eq("user_id", userId);

    if (error) {
      return res.status(400).json({ error: "Failed to fetch trip ids" });
    }

    const tripIds = (data ?? []).map((row) => row.trip_id as string);
    return res.status(200).json({ tripIds });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
}
