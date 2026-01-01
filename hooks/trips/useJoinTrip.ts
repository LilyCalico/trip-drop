import axios from "axios";
import { useCallback, useState } from "react";
import getApiBaseUrl from "@/lib/getApiBaseUrl";
import useGetTrips from "@/hooks/trips/useGetTrips";
import { useAuthStore } from "@/store/useAuthStore";
import { useTripsStore } from "@/store/useTripsStore";

interface JoinTripResponse {
  success: true;
}

export const useJoinTrip = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const session = useAuthStore((s) => s.session);
  const setTrips = useTripsStore((s) => s.setTrips);
  const { fetchTrips } = useGetTrips();

  const joinTrip = useCallback(
    async (tripId: string, password: string): Promise<boolean> => {
      if (!session?.access_token) {
        setError("No access token found");
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        const baseURL = getApiBaseUrl();

        await axios.post<JoinTripResponse>(
          `${baseURL}/trips/${tripId}/join`,
          { password },
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`
            }
          }
        );

        const trips = await fetchTrips();
        setTrips(trips ?? []);

        return true;
      } catch (err) {
        let errorMessage = "An unexpected error occurred";
        if (axios.isAxiosError(err)) {
          errorMessage =
            (err.response?.data as { error?: string } | undefined)?.error ||
            err.message;
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }
        setError(errorMessage);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [session?.access_token, fetchTrips, setTrips]
  );

  return { joinTrip, loading, error };
};
