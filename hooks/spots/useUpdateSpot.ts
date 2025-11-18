import axios, { isAxiosError } from "axios";
import { useCallback, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import type { Tables } from "@/types/supabasetype";

type SpotRow = Tables<"spots">;

interface UpdateSpotParams {
  id: string;
  name: string;
  address?: string;
  notes?: string;
  googlePlaceId?: string | null;
  location?: { lat: number; lng: number } | null;
  googleData?: unknown;
  tripId: string;
  selectedDate: string;
  selectedTime: string;
  selectedTimezone: string;
}

export const useUpdateSpot = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const session = useAuthStore((s) => s.session);

  const updateSpot = useCallback(
    async (params: UpdateSpotParams): Promise<SpotRow | null> => {
      if (!session?.access_token) {
        setError("No access token");
        return null;
      }

      if (!params.id) {
        setError("Spot id is required");
        return null;
      }

      if (
        !params.selectedDate ||
        !params.selectedTime ||
        !params.selectedTimezone
      ) {
        setError("Date, time, and timezone are required");
        return null;
      }

      setIsUpdating(true);
      setError(null);

      try {
        const baseURL =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

        const { data } = await axios.patch<SpotRow>(
          `${baseURL}/spots/${params.id}`,
          {
            name: params.name,
            address: params.address,
            notes: params.notes,
            googlePlaceId: params.googlePlaceId,
            location: params.location,
            googleData: params.googleData,
            tripId: params.tripId,
            selectedDate: params.selectedDate,
            selectedTime: params.selectedTime,
            selectedTimezone: params.selectedTimezone,
          },
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          },
        );

        return data;
      } catch (err) {
        const message = (() => {
          if (isAxiosError(err)) {
            return err.response?.data?.error ?? err.message;
          }
          if (err instanceof Error) {
            return err.message;
          }
          return "Failed to update spot";
        })();
        setError(message);
        console.error("Error updating spot:", err);
        return null;
      } finally {
        setIsUpdating(false);
      }
    },
    [session?.access_token],
  );

  return {
    updateSpot,
    isUpdating,
    error,
  };
};
