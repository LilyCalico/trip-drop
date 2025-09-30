import axios from "axios";
import { useCallback, useState } from "react";
import supabase from "@/lib/supabaseClient";

interface SignInResponse {
  access_token: string;
  refresh_token: string;
}

export const useSignin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = useCallback(
    async (email: string, password: string): Promise<SignInResponse | null> => {
      setLoading(true);
      setError(null);

      try {
        const baseURL =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

        const { data } = await axios.post<SignInResponse>(
          `${baseURL}/auth/signin`,
          { email, password }
        );

        const { access_token, refresh_token } = data;
        const { error: setSessionError } = await supabase.auth.setSession({
          access_token,
          refresh_token
        });

        if (setSessionError) {
          setError(setSessionError.message);
          return null;
        }

        return data;
      } catch (err) {
        let errorMessage = "An unexpected error occurred";
        if (axios.isAxiosError(err)) {
          errorMessage = err.response?.data?.error || err.message;
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }
        setError(errorMessage);
        // eslint-disable-next-line no-console
        console.error("Error signing in:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { signIn, loading, error };
};
