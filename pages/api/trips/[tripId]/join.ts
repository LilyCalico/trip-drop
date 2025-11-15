import { createClient } from "@supabase/supabase-js";
import type { NextApiRequest, NextApiResponse } from "next";
import { verifyPassword } from "@/lib/passwordUtils";
import type { Database } from "@/types/supabasetype";

type ErrorBody = { error: string };
type SuccessBody = { success: true };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessBody | ErrorBody>,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { tripId } = req.query;
  const resolvedTripId = typeof tripId === "string" ? tripId.trim() : "";
  if (!resolvedTripId) {
    return res.status(400).json({ error: "Missing trip id" });
  }

  const passwordInput =
    typeof req.body?.password === "string" ? req.body.password.trim() : "";
  if (!passwordInput) {
    return res.status(400).json({ error: "Password is required" });
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
  const supabaseServiceRoleKey = process.env.SUPABASE_ACCESS_TOKEN as
    | string
    | undefined;

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
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
  const userId = userRes.user.id;

  const supabaseAdmin = createClient<Database>(
    supabaseUrl,
    supabaseServiceRoleKey,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );

  const { data: tripRow, error: tripErr } = await supabaseAdmin
    .from("trips")
    .select("share_password")
    .eq("id", resolvedTripId)
    .single();

  if (tripErr || !tripRow?.share_password) {
    const status = tripErr?.code === "PGRST116" ? 404 : 400;
    const message =
      status === 404
        ? "Trip not found"
        : `Failed to load trip: ${tripErr?.message}`;
    return res.status(status).json({ error: message });
  }

  const isPasswordValid = verifyPassword(passwordInput, tripRow.share_password);
  if (!isPasswordValid) {
    return res.status(401).json({ error: "Invalid password" });
  }

  const { data: existingMemberRows, error: existingMemberError } =
    await supabaseAdmin
      .from("trip_members")
      .select("id")
      .eq("trip_id", resolvedTripId)
      .eq("user_id", userId)
      .limit(1);

  if (existingMemberError) {
    return res.status(400).json({
      error: `Failed to verify membership: ${existingMemberError.message}`,
    });
  }

  if (existingMemberRows && existingMemberRows.length > 0) {
    return res.status(200).json({ success: true });
  }

  const { error: insertMemberError } = await supabaseAdmin
    .from("trip_members")
    .insert({
      trip_id: resolvedTripId,
      user_id: userId,
      role: "member",
      permissions: { can_edit: false, can_invite: false },
      joined_at: new Date().toISOString(),
    });

  if (insertMemberError) {
    if (insertMemberError.code === "23505") {
      return res.status(200).json({ success: true });
    }
    return res.status(400).json({
      error: `Failed to add member: ${insertMemberError.message}`,
    });
  }

  return res.status(200).json({ success: true });
}
