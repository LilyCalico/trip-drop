import { createClient } from "@supabase/supabase-js";
import type { NextApiRequest, NextApiResponse } from "next";
import type { Database } from "../../../types/supabasetype";

interface ErrorBody {
  error: string;
}

interface MemberDto {
  id: string;
  userId: string | null;
  tripId: string | null;
  role: string | null;
  joinedAt: string | null;
  permissions: any | null;
  name: string | null;
}

interface MembersResponse {
  members: MemberDto[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MembersResponse | ErrorBody>,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const tripIdsParam = req.query.tripIds;

  // tripIds=comma,separated or tripIds[]=a&tripIds[]=b 両対応
  const tripIdsArray: string[] = Array.isArray(tripIdsParam)
    ? tripIdsParam.flatMap((v) => v.split(",").filter(Boolean))
    : typeof tripIdsParam === "string"
      ? tripIdsParam.split(",").filter(Boolean)
      : [];

  if (tripIdsArray.length === 0) {
    return res.status(400).json({ error: "Parameter 'tripIds' is required" });
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

    // trip_membersを取得（profilesは別途取得）
    const { data, error } = await supabase
      .from("trip_members")
      .select(`
        id, user_id, trip_id, role, joined_at, permissions
      `)
      .in("trip_id", tripIdsArray);

    if (error) {
      console.error("Supabase error:", error);
      return res.status(400).json({ error: "Failed to fetch members" });
    }

    // user_idのリストを取得
    const userIds = (data ?? [])
      .map((member) => member.user_id)
      .filter((id): id is string => id !== null);

    // profilesを別途取得
    let profilesData: { id: string; name: string | null }[] = [];
    if (userIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, name")
        .in("id", userIds);

      if (profilesError) {
        console.error("Profiles error:", profilesError);
        return res.status(400).json({ error: "Failed to fetch profiles" });
      }

      profilesData = profiles ?? [];
    }

    // membersとprofilesを統合
    const members: MemberDto[] = (data ?? []).map((row) => {
      const profile = profilesData.find((p) => p.id === row.user_id);
      return {
        id: row.id,
        userId: row.user_id,
        tripId: row.trip_id,
        role: row.role,
        joinedAt: row.joined_at,
        permissions: row.permissions,
        name: profile?.name ?? null,
      };
    });

    return res.status(200).json({ members });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("API error:", message);
    return res.status(500).json({ error: message });
  }
}
