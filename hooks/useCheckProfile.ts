import axios from "axios";
import { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";

interface CheckProfileResponse {
  isProfileExists: boolean;
  isNameNull: boolean;
}

export const useCheckProfile = () => {
  const session = useAuthStore((s) => s.session);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkProfile = async () => {
    setLoading(true);
    setError(null);

    if (!session?.user.id) {
      setError("User not found");
      return;
    }

    try {
      const baseURL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

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
  };

  return {
    checkProfile,
    loading,
    error
  };
};
