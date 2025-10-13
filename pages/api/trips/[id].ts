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
    const { id } = req.query;
    const tripId = typeof id === "string" ? id : Array.isArray(id) ? id[0] : "";
    if (!tripId) return res.status(400).json({ error: "Missing trip id" });

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

    // 権限チェック: tripの作成者 または trip_membersでowner
    const { data: tripData, error: tripErr } = await supabase
      .from("trips")
      .select("id, created_by")
      .eq("id", tripId)
      .single();
    if (tripErr || !tripData) {
      return res.status(404).json({ error: "Trip not found" });
    }

    let isOwner = tripData.created_by === userId;
    if (!isOwner) {
      const { data: memberRows, error: memberErr } = await supabase
        .from("trip_members")
        .select("role")
        .eq("trip_id", tripId)
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

    // 先にtrip_membersを削除（外部キーのCASCADEがあれば不要）
    const { error: delMembersErr } = await supabase
      .from("trip_members")
      .delete()
      .eq("trip_id", tripId);
    if (delMembersErr) {
      return res
        .status(400)
        .json({ error: `Failed to delete members: ${delMembersErr.message}` });
    }

    // tripsを削除
    const { error: delTripErr } = await supabase
      .from("trips")
      .delete()
      .eq("id", tripId);
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
