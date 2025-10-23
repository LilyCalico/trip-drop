import { createClient } from "@supabase/supabase-js";
import type { NextApiRequest, NextApiResponse } from "next";
import type { Database } from "@/types/supabasetype";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userId, name } = req.body;
  const trimName = name.trim();

  if (!userId || !name) {
    return res.status(400).json({ error: "User ID and name are required" });
  }

  if (trimName.length > 20) {
    return res
      .status(400)
      .json({ error: "Name must be less than 20 characters" });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

  try {
    const updateData: Database["public"]["Tables"]["profiles"]["Update"] = {
      name: trimName
    };

    const { data, error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      console.error("Error updating profile:", error);
      return res.status(500).json({ error: "Failed to update profile" });
    }

    return res.status(200).json({
      name: data.name
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
