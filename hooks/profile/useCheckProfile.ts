import axios from "axios";
import { useCallback, useState } from "react";
import getApiBaseUrl from "@/lib/getApiBaseUrl";
import { useAuthStore } from "@/store/useAuthStore";

interface CheckProfileResponse {
  isProfileExists: boolean;
  isNameNull: boolean;
}

export const useCheckProfile = () => {
  const session = useAuthStore((s) => s.session);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkProfile = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!session?.user.id) {
      return null;
    }

    try {
      const baseURL = getApiBaseUrl();

      const response = await axios.get<CheckProfileResponse>(
        `${baseURL}/profile/check?userId=${session.user.id}`
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
      console.error("Error checking profile:", err);
    } finally {
      setLoading(false);
    }
  }, [session?.user.id]);

  return {
    checkProfile,
    loading,
    error
  };
};
