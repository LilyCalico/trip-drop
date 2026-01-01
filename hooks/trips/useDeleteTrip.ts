import axios, { isAxiosError } from "axios";
import { useCallback, useState } from "react";
import getApiBaseUrl from "@/lib/getApiBaseUrl";
import { useAuthStore } from "@/store/useAuthStore";
import { useTripsStore } from "@/store/useTripsStore";

interface UseDeleteTripResult {
  deleting: boolean;
  error: string | null;
  deleteTrip: (tripId: string) => Promise<boolean>;
}

const useDeleteTrip = (): UseDeleteTripResult => {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const session = useAuthStore((s) => s.session);
  const trips = useTripsStore((s) => s.trips);
  const setTrips = useTripsStore((s) => s.setTrips);

  const deleteTrip = useCallback(
    async (tripId: string) => {
      if (!session?.access_token) {
        setError("No access token");
        return false;
      }

      setDeleting(true);
      setError(null);
      try {
        const baseURL = getApiBaseUrl();
        await axios.delete(`${baseURL}/trips/${tripId}`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });

        const next = (trips ?? []).filter((t) => t.id !== tripId);
        setTrips(next);
        return true;
      } catch (err) {
        if (isAxiosError(err)) {
          const msg =
            typeof err.response?.data === "object" &&
            err.response?.data &&
            "error" in (err.response.data as Record<string, unknown>)
              ? String((err.response.data as { error: string }).error)
              : err.message;
          setError(msg);
        } else {
          setError(err instanceof Error ? err.message : "Unknown error");
        }
        return false;
      } finally {
        setDeleting(false);
      }
    },
    [session?.access_token, trips, setTrips]
  );

  return { deleting, error, deleteTrip };
};

export default useDeleteTrip;
