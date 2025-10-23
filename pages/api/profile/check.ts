import { createClient } from "@supabase/supabase-js";
import type { NextApiRequest, NextApiResponse } from "next";
import type { Database } from "@/types/supabasetype";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userId } = req.query;

  if (!userId || typeof userId !== "string") {
    return res.status(400).json({ error: "User ID is required" });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, name")
      .eq("id", userId)
      .single();

    if (error && error.code === "PGRST116") {
      // プロフィールが存在しない場合、デフォルトプロフィールを作成
      try {
        const profileData: Database["public"]["Tables"]["profiles"]["Insert"] =
          {
            id: userId,
            name: null,
            avatar_url: null
          };

        const { error: insertError } = await supabase
          .from("profiles")
          .insert(profileData);

        if (insertError) {
          console.error("Error creating profile:", insertError);
          return res.status(500).json({
            error: "Failed to create profile",
            isNameNull: true
          });
        }

        return res.status(200).json({
          isProfileExists: true,
          isNameNull: true
        });
      } catch (insertError) {
        console.error("Error creating profile:", insertError);
        return res.status(500).json({
          error: "Failed to create profile",
          isNameNull: true
        });
      }
    } else if (data) {
      // プロフィールが存在する
      const isNameNull = data.name === null;
      return res.status(200).json({
        isProfileExists: true,
        isNameNull
      });
    }

    return res.status(500).json({ error: "Unexpected error" });
  } catch (error) {
    console.error("Error checking profile:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
