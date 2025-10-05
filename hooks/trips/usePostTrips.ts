import { useCallback, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";

interface Trip {
  id: string;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string;
  timezone: string;
  number_of_members: number | null;
  created_by: string;
  created_at: string;
}

interface TripMember {
  trip_id: string;
  role: string;
  permissions: {
    can_edit: boolean;
    can_invite: boolean;
  };
  trips: Trip;
}

interface UsePostTripsResult {
  trips: TripMember[] | null;
  loading: boolean;
  error: string | null;
  fetchTrips: () => Promise<void>;
}

const usePostTrips = (): UsePostTripsResult => {
  const [trips, setTrips] = useState<TripMember[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const session = useAuthStore((s) => s.session);

  const fetchTrips = useCallback(async () => {
    if (!session?.access_token) {
      setError("No access token found");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/trips", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTrips(data.trips);
      } else {
        const errorData = await response.json();
        console.error("API Error:", errorData);
        setError(errorData.error || "Failed to fetch trips");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Error fetching trips:", err);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  return { trips, loading, error, fetchTrips };
};

export default usePostTrips;
