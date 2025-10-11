import { createClient } from "@supabase/supabase-js";
import type { NextApiRequest, NextApiResponse } from "next";
import type { Database, Json, Tables } from "../../../types/supabasetype";

interface ErrorBody {
  error: string;
}

interface MemberDto {
  id: string;
  userId: string | null;
  tripId: string | null;
  role: string | null;
  joinedAt: string | null;
  permissions: Json | null;
}

interface TripDto {
  id: string;
  title: string;
  description: string | null;
  startAt: string; // ISO string
  endAt: string; // ISO string
  timeZone: string;
  numberOfMembers: number | null;
  createdBy: string | null;
  createdAt: string | null; // ISO string
  members: MemberDto[];
}

interface TripsResponse {
  trips: TripDto[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TripsResponse | ErrorBody>,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const idsParam = req.query.ids;

  // ids=comma,separated or ids[]=a&ids[]=b 両対応
  const idsArray: string[] = Array.isArray(idsParam)
    ? idsParam.flatMap((v) => v.split(",").filter(Boolean))
    : typeof idsParam === "string"
      ? idsParam.split(",").filter(Boolean)
      : [];
  console.log("idsArray", idsArray);
  if (idsArray.length === 0) {
    return res.status(400).json({ error: "Parameter 'ids' is required" });
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

    // RLSが効いている前提。idsArrayの中でもユーザーがアクセス可能な行のみ返る。
    const { data, error } = await supabase
      .from("trips")
      .select(`
        id, title, description, start_at, end_at, timezone, number_of_members, created_by, created_at,
        trip_members!inner(
          id, user_id, trip_id, role, joined_at, permissions
        )
      `)
      .in("id", idsArray);

    if (error) {
      return res.status(400).json({ error: "Failed to fetch trips" });
    }

    interface TripWithMembers extends Tables<"trips"> {
      trip_members: Tables<"trip_members">[];
    }

    const trips: TripDto[] = ((data as TripWithMembers[]) ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description ?? null,
      startAt: row.start_at,
      endAt: row.end_at,
      timeZone: row.timezone,
      numberOfMembers: row.number_of_members,
      createdBy: row.created_by,
      createdAt: row.created_at,
      members: row.trip_members.map((member) => ({
        id: member.id,
        userId: member.user_id,
        tripId: member.trip_id,
        role: member.role,
        joinedAt: member.joined_at,
        permissions: member.permissions,
      })),
    }));

    return res.status(200).json({ trips });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
}
