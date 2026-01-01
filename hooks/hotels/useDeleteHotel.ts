import axios, { isAxiosError } from "axios";
import { useCallback, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";

type DeleteHotelResult =
  | {
      success: true;
    }
  | {
      success: false;
      message: string;
    };

export const useDeleteHotel = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const accessToken = useAuthStore(
    (state) => state.session?.access_token ?? null
  );

  const deleteHotel = useCallback(
    async (hotelId: string): Promise<DeleteHotelResult> => {
      if (!hotelId) {
        return { success: false, message: "Hotel ID is required" };
      }

      if (!accessToken) {
        return { success: false, message: "Not authenticated" };
      }

      setIsDeleting(true);

      try {
        const baseURL =
          process.env.NEXT_PUBLIC_API_URL ||
          process.env.NEXT_PUBLIC_LOCAL_API_URL;

        await axios.delete(`${baseURL}/hotels/${hotelId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });

        return { success: true };
      } catch (error) {
        let message = "Failed to delete hotel";

        if (isAxiosError(error)) {
          message = error.response?.data?.error ?? error.message ?? message;
        } else if (error instanceof Error) {
          message = error.message;
        }

        console.error("Error deleting hotel:", error);
        return { success: false, message };
      } finally {
        setIsDeleting(false);
      }
    },
    [accessToken]
  );

  return {
    deleteHotel,
    isDeleting
  };
};
