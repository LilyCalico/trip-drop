import { createClient } from "@supabase/supabase-js";
import type { NextApiRequest, NextApiResponse } from "next";
import type { Database } from "@/types/supabasetype";

type ErrorBody = { error: string; details?: string; code?: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<
    Database["public"]["Tables"]["transports"]["Row"] | ErrorBody
  >,
) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const queryId = req.query.transportId;
  const transportId = Array.isArray(queryId) ? queryId[0] : queryId;

  if (!transportId) {
    return res.status(400).json({ error: "Transport ID is required" });
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
      .from("transports")
      .delete()
      .eq("id", transportId)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ error: "Transport not found" });
      }

      console.error("Supabase error deleting transport:", error);
      return res.status(400).json({
        error: "Failed to delete transport",
        details: error.message,
        code: error.code,
      });
    }

    if (!data) {
      return res.status(404).json({ error: "Transport not found" });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error("Error deleting transport:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
