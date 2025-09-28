import axios from "axios";
import { useState } from "react";

interface SignupData {
  email: string;
  password: string;
}

interface SignupResponse {
  success: boolean;
  user?: {
    id: string;
    email?: string;
  };
  session?: {
    access_token: string;
    refresh_token: string;
  };
}

export const useSignup = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signup = async (data: SignupData): Promise<SignupResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const baseURL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

      const response = await axios.post<SignupResponse>(
        `${baseURL}/api/auth/signup`,
        data,
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

      return response.data;
    } catch (err) {
      let errorMessage = "An unexpected error occurred";

      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.error || err.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    signup,
    loading,
    error
  };
};
