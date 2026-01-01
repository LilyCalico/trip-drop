import axios, { isAxiosError } from "axios";
import { useCallback, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";

type DeleteTransportResult =
  | {
      success: true;
    }
  | {
      success: false;
      message: string;
    };

export const useDeleteTransport = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const accessToken = useAuthStore(
    (state) => state.session?.access_token ?? null
  );

  const deleteTransport = useCallback(
    async (transportId: string): Promise<DeleteTransportResult> => {
      if (!transportId) {
        return { success: false, message: "Transport ID is required" };
      }

      if (!accessToken) {
        return { success: false, message: "Not authenticated" };
      }

      setIsDeleting(true);

      try {
        const baseURL =
          process.env.NEXT_PUBLIC_API_URL ||
          process.env.NEXT_PUBLIC_LOCAL_API_URL;

        await axios.delete(`${baseURL}/transports/${transportId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });

        return { success: true };
      } catch (error) {
        let message = "Failed to delete transport";

        if (isAxiosError(error)) {
          message = error.response?.data?.error ?? error.message ?? message;
        } else if (error instanceof Error) {
          message = error.message;
        }

        console.error("Error deleting transport:", error);
        return { success: false, message };
      } finally {
        setIsDeleting(false);
      }
    },
    [accessToken]
  );

  return {
    deleteTransport,
    isDeleting
  };
};
