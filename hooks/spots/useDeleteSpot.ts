import axios, { isAxiosError } from "axios";
import { useCallback, useState } from "react";
import getApiBaseUrl from "@/lib/getApiBaseUrl";
import { useAuthStore } from "@/store/useAuthStore";

type DeleteSpotResponse =
  | {
      success: true;
    }
  | {
      success: false;
      message: string;
    };

export const useDeleteSpot = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const accessToken = useAuthStore((s) => s.session?.access_token ?? null);

  const deleteSpot = useCallback(
    async (spotId: string): Promise<DeleteSpotResponse> => {
      if (!spotId) {
        return { success: false, message: "Spot ID is required" };
      }

      if (!accessToken) {
        return { success: false, message: "Not authenticated" };
      }

      setIsDeleting(true);

      try {
        const baseURL = getApiBaseUrl();
        await axios.delete(`${baseURL}/spots/${spotId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });

        return { success: true };
      } catch (err) {
        let message = "Failed to delete spot";

        if (isAxiosError(err)) {
          message = err.response?.data?.error ?? err.message ?? message;
        } else if (err instanceof Error) {
          message = err.message;
        }

        console.error("Error deleting spot:", err);
        return { success: false, message };
      } finally {
        setIsDeleting(false);
      }
    },
    [accessToken]
  );

  return {
    deleteSpot,
    isDeleting
  };
};
