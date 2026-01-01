import axios, { isAxiosError } from "axios";
import { useCallback, useState } from "react";
import type { GooglePlaceCandidate } from "@/hooks/google/useGooglePlacesPredictions";
import getApiBaseUrl from "@/lib/getApiBaseUrl";
import { useAuthStore } from "@/store/useAuthStore";
import type { Tables } from "@/types/supabasetype";

type TransportRow = Tables<"transports">;

export interface UpdateTransportParams {
  id: string;
  carrierName: string;
  departureLocation: string;
  arrivalLocation: string;
  departureMemo?: string | null;
  arrivalMemo?: string | null;
  bookingReference?: string | null;
  departureTimezone: string;
  arrivalTimezone: string;
  departureDate: string;
  departureTime: string;
  arrivalDate: string;
  arrivalTime: string;
  description?: string | null;
  departureGooglePlaceId?: string | null;
  arrivalGooglePlaceId?: string | null;
  departureGoogleData?: GooglePlaceCandidate | null;
  arrivalGoogleData?: GooglePlaceCandidate | null;
}

export const useUpdateTransport = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const session = useAuthStore((state) => state.session);

  const updateTransport = useCallback(
    async (params: UpdateTransportParams): Promise<TransportRow | null> => {
      if (!session?.access_token) {
        setError("No access token");
        return null;
      }

      if (!params.id) {
        setError("Transport id is required");
        return null;
      }

      const trimmedName = params.carrierName.trim();
      if (!trimmedName) {
        setError("carrierName is required");
        return null;
      }

      const trimmedDepartureLocation = params.departureLocation.trim();
      const trimmedArrivalLocation = params.arrivalLocation.trim();
      if (!trimmedDepartureLocation || !trimmedArrivalLocation) {
        setError("Locations are required");
        return null;
      }

      if (
        !params.departureDate ||
        !params.departureTime ||
        !params.arrivalDate ||
        !params.arrivalTime
      ) {
        setError("Date and time fields are required");
        return null;
      }

      if (!params.departureTimezone || !params.arrivalTimezone) {
        setError("Timezone fields are required");
        return null;
      }

      setIsUpdating(true);
      setError(null);

      try {
        const baseURL = getApiBaseUrl();

        const { data } = await axios.patch<TransportRow>(
          `${baseURL}/transports/${params.id}`,
          {
            carrierName: trimmedName,
            description: params.description ?? null,
            departureLocation: trimmedDepartureLocation,
            arrivalLocation: trimmedArrivalLocation,
            departureMemo: params.departureMemo ?? null,
            arrivalMemo: params.arrivalMemo ?? null,
            bookingReference: params.bookingReference ?? null,
            departureTimezone: params.departureTimezone,
            arrivalTimezone: params.arrivalTimezone,
            departureDate: params.departureDate,
            departureTime: params.departureTime,
            arrivalDate: params.arrivalDate,
            arrivalTime: params.arrivalTime,
            departureGooglePlaceId: params.departureGooglePlaceId ?? null,
            departureGoogleData: params.departureGoogleData ?? null,
            arrivalGooglePlaceId: params.arrivalGooglePlaceId ?? null,
            arrivalGoogleData: params.arrivalGoogleData ?? null
          },
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`
            }
          }
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
          return "Failed to update transport";
        })();
        setError(message);
        console.error("Error updating transport:", err);
        return null;
      } finally {
        setIsUpdating(false);
      }
    },
    [session?.access_token]
  );

  return {
    updateTransport,
    isUpdating,
    error
  };
};
