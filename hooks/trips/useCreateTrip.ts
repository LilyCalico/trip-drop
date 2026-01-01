import axios, { isAxiosError } from "axios";
import { useCallback, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useTripsStore } from "@/store/useTripsStore";
import useGetTrips from "./useGetTrips";

interface CreateTripPayload {
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  timezone: string;
  numOfPeople: number | null;
  password: string;
}

interface CreateTripResult {
  success: boolean;
  tripId?: string;
  message?: string;
}

interface UseCreateTripResult {
  creating: boolean;
  error: string | null;
  createTrip: (payload: CreateTripPayload) => Promise<CreateTripResult>;
}

const useCreateTrip = (): UseCreateTripResult => {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const session = useAuthStore((s) => s.session);
  const setTrips = useTripsStore((s) => s.setTrips);
  const setCurrentTrip = useTripsStore((s) => s.setCurrentTrip);
  const { fetchTrips } = useGetTrips();

  const createTrip = useCallback(
    async (payload: CreateTripPayload): Promise<CreateTripResult> => {
      if (!session?.access_token) {
        const message = "No access token found";
        setError(message);
        return { success: false, message };
      }

      setCreating(true);
      setError(null);

      try {
        const baseURL =
          process.env.NEXT_PUBLIC_API_URL ||
          process.env.NEXT_PUBLIC_LOCAL_API_URL;

        const response = await axios.post<{ tripId?: string }>(
          `${baseURL}/trip`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`
            }
          }
        );
        const tripId = response.data.tripId ?? "";

        if (!tripId) {
          const message = "Trip created but response was invalid.";
          setError(message);
          return { success: false, message };
        }

        const trips = await fetchTrips();
        if (!trips || trips.length === 0) {
          const message = "Trip created but list is still empty.";
          setError(message);
          return { success: false, tripId, message };
        }

        setTrips(trips);

        const createdTrip = trips.find((trip) => trip.id === tripId) ?? null;
        if (createdTrip) {
          setCurrentTrip(createdTrip);
        }

        return { success: true, tripId };
      } catch (err) {
        let message = "Unknown error creating trip.";
        if (isAxiosError(err)) {
          message =
            typeof err.response?.data === "object" &&
            err.response?.data !== null &&
            "error" in (err.response.data as Record<string, unknown>)
              ? String((err.response.data as { error: string }).error)
              : err.message;
        } else if (err instanceof Error) {
          message = err.message;
        }

        setError(message);
        console.error("Error creating trip:", err);
        return { success: false, message };
      } finally {
        setCreating(false);
      }
    },
    [session?.access_token, fetchTrips, setTrips, setCurrentTrip]
  );

  return { creating, error, createTrip };
};

export default useCreateTrip;
