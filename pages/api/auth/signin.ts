import type { NextApiRequest, NextApiResponse } from "next";
import supabase from "@/lib/supabaseClient";

interface SignInResponseBody {
  access_token: string;
  refresh_token: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, password } = req.body as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error || !data.session) {
      // return res
      //   .status(401)
      //   .json({ error: error?.message ?? "Invalid credentials" });

      return res
        .status(401)
        .json({ error: "Email address or password is incorrect." });
    }

    const { access_token, refresh_token } = data.session;

    const responseBody: SignInResponseBody = {
      access_token,
      refresh_token
    };

    return res.status(200).json(responseBody);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error during sign in:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
