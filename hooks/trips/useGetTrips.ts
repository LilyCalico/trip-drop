import axios, { isAxiosError } from "axios";
import { useCallback, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useTripsStore } from "@/store/useTripsStore";
import type { TripType } from "@/types/fronttype";

interface TripsIdsResponse {
  tripIds: string[];
}

interface TripsResponse {
  trips: TripType[];
}

interface MembersResponse {
  members: TripType["members"];
}

interface UseGetTripsResult {
  loading: boolean;
  error: string | null;
  fetchTrips: () => Promise<TripType[] | undefined>;
}

const useGetTrips = (): UseGetTripsResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const session = useAuthStore((s) => s.session);
  const setTripsLoading = useTripsStore((s) => s.setLoading);

  const fetchTrips = useCallback(async () => {
    if (!session?.access_token) {
      setError("No access token found");
      return;
    }

    setLoading(true);
    setTripsLoading(true);
    setError(null);

    try {
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`
      };

      const baseURL =
        process.env.NEXT_PUBLIC_API_URL ||
        process.env.NEXT_PUBLIC_LOCAL_API_URL;

      // 1. IDs を取得
      const idsRes = await axios.get<TripsIdsResponse>(`${baseURL}/trips/ids`, {
        headers
      });

      const tripIds = idsRes.data.tripIds ?? [];

      if (tripIds.length === 0) {
        return undefined;
      }

      // 2. trips詳細を一括取得
      const tripsRes = await axios.get<TripsResponse>("/api/trips", {
        headers,
        params: { ids: tripIds.join(",") }
      });

      // 3. members詳細を一括取得
      const membersRes = await axios.get<MembersResponse>("/api/members", {
        headers,
        params: { tripIds: tripIds.join(",") }
      });

      // 4. tripsとmembersを統合
      const tripsWithMembers = tripsRes.data.trips.map((trip) => ({
        ...trip,
        members: membersRes.data.members.filter(
          (member) => member.tripId === trip.id
        )
      }));

      return tripsWithMembers;
    } catch (err) {
      if (isAxiosError(err)) {
        const apiMessage =
          typeof err.response?.data === "object" &&
          err.response?.data !== null &&
          "error" in (err.response?.data as Record<string, unknown>)
            ? String((err.response?.data as { error: string }).error)
            : err.message;
        setError(apiMessage);
      } else {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
      }

      console.error("Error fetching trips:", err);
    } finally {
      setLoading(false);
      setTripsLoading(false);
    }
  }, [session?.access_token, setTripsLoading]);

  return { loading, error, fetchTrips };
};

export default useGetTrips;
