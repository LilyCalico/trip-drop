import axios, { isAxiosError } from "axios";
import { useCallback, useState } from "react";
import { useSWRConfig } from "swr";
import getApiBaseUrl from "@/lib/getApiBaseUrl";
import { useAuthStore } from "@/store/useAuthStore";
import { useTripsStore } from "@/store/useTripsStore";
import type { TripType } from "@/types/fronttype";
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
  const { mutate } = useSWRConfig();
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
        const baseURL = getApiBaseUrl();
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

        const optimisticTrip: TripType = {
          id: tripId,
          title: payload.title,
          description: payload.description || null,
          startAt: payload.startAt,
          endAt: payload.endAt,
          timeZone: payload.timezone,
          numberOfMembers: payload.numOfPeople ?? 1,
          createdBy: session.user?.id ?? null,
          createdAt: null,
          members: []
        };

        // Optimistic update のための現在の状態を保存（ロールバック用）
        const previousTrips = useTripsStore.getState().trips ?? [];
        const previousCurrentTrip = useTripsStore.getState().currentTrip;

        const currentTrips = previousTrips;
        setTrips([optimisticTrip, ...currentTrips]);
        setCurrentTrip(optimisticTrip);

        void mutate("/api/trips");
        void mutate("/api/trips/ids");

        // バックグラウンドで実際のデータを取得して更新
        void (async () => {
          try {
            const trips = await fetchTrips();
            if (trips && trips.length > 0) {
              // 作成した trip が含まれているか確認
              const createdTrip = trips.find((trip) => trip.id === tripId);
              if (createdTrip) {
                setTrips(trips);
                setCurrentTrip(createdTrip);
              } else {
                // trip が見つからない場合、ロールバック
                console.warn(
                  `Created trip ${tripId} not found in fetched trips. Rolling back optimistic update.`
                );
                setTrips(previousTrips);
                setCurrentTrip(previousCurrentTrip);
              }
            } else {
              // trips が空の場合、ロールバック
              console.warn(
                "Fetched trips is empty. Rolling back optimistic update."
              );
              setTrips(previousTrips);
              setCurrentTrip(previousCurrentTrip);
            }
          } catch (fetchErr) {
            // エラー時はロールバック
            console.error("Error revalidating trips after creation:", fetchErr);
            setTrips(previousTrips);
            setCurrentTrip(previousCurrentTrip);
            // エラーをユーザーに通知（オプション）
            setError(
              "Trip created but failed to refresh the list. Please refresh the page."
            );
          }
        })();

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
    [session, fetchTrips, mutate, setTrips, setCurrentTrip]
  );

  return { creating, error, createTrip };
};

export default useCreateTrip;
