import axios from "axios";
import { useCallback, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";

interface UpdateProfileResponse {
  name: string;
}

export const useUpdateProfile = () => {
  const session = useAuthStore((s) => s.session);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProfile = useCallback(
    async (name: string): Promise<UpdateProfileResponse | null> => {
      setLoading(true);
      setError(null);

      if (!session?.user?.id) {
        return null;
      }

      try {
        const baseURL =
          process.env.NEXT_PUBLIC_API_URL ||
          process.env.NEXT_PUBLIC_LOCAL_API_URL;

        const response = await axios.put<UpdateProfileResponse>(
          `${baseURL}/profile/update`,
          { userId: session.user.id, name: name.trim() },
          { headers: { "Content-Type": "application/json" } }
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
        console.error("Error updating profile:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [session?.user?.id]
  );

  return { updateProfile, loading, error };
};
