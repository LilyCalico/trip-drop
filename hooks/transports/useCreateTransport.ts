import axios, { isAxiosError } from "axios";
import { useCallback, useState } from "react";

import type { GooglePlaceCandidate } from "@/hooks/google/useGooglePlacesPredictions";
import getApiBaseUrl from "@/lib/getApiBaseUrl";
import { useAuthStore } from "@/store/useAuthStore";
import type { Database } from "@/types/supabasetype";

type TransportRow = Database["public"]["Tables"]["transports"]["Row"];

export interface CreateTransportPayload {
  tripId: string;
  carrierName: string;
  description?: string | null;
  departureLocation?: string | null;
  arrivalLocation?: string | null;
  departureMemo?: string | null;
  arrivalMemo?: string | null;
  bookingReference?: string | null;
  departureTimezone?: string | null;
  arrivalTimezone?: string | null;
  departureDate?: string;
  departureTime?: string;
  arrivalDate?: string;
  arrivalTime?: string;
  departureDateTime?: string;
  arrivalDateTime?: string;
  departureGooglePlaceId?: string | null;
  departureGoogleData?: GooglePlaceCandidate | null;
  arrivalGooglePlaceId?: string | null;
  arrivalGoogleData?: GooglePlaceCandidate | null;
}

interface CreateTransportResponse {
  transport: TransportRow;
}

const toTrimmedOrNull = (value?: string | null) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const parseIsoDateTime = (value?: string | null) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;

  const [datePart, timePartRaw] = trimmed.split("T");
  if (!datePart || !timePartRaw) {
    return null;
  }

  const timeMatch = timePartRaw.replace(/Z$/, "").match(/^(\d{2}:\d{2})/);
  if (!timeMatch) {
    return null;
  }

  return {
    date: datePart,
    time: timeMatch[1]
  };
};

export const useCreateTransport = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const session = useAuthStore((s) => s.session);

  const createTransport = useCallback(
    async (payload: CreateTransportPayload) => {
      if (!session?.access_token) {
        setError("No access token");
        return null;
      }

      const trimmedName = payload.carrierName.trim();
      if (!trimmedName) {
        setError("carrierName is required");
        return null;
      }

      const departureParts = {
        date:
          payload.departureDate?.trim() ||
          parseIsoDateTime(payload.departureDateTime)?.date ||
          null,
        time:
          payload.departureTime?.trim() ||
          parseIsoDateTime(payload.departureDateTime)?.time ||
          null
      };

      const arrivalParts = {
        date:
          payload.arrivalDate?.trim() ||
          parseIsoDateTime(payload.arrivalDateTime)?.date ||
          null,
        time:
          payload.arrivalTime?.trim() ||
          parseIsoDateTime(payload.arrivalDateTime)?.time ||
          null
      };

      if (!departureParts.date || !departureParts.time) {
        setError("Departure date and time are required");
        return null;
      }

      if (!arrivalParts.date || !arrivalParts.time) {
        setError("Arrival date and time are required");
        return null;
      }

      setIsSubmitting(true);
      setError(null);

      try {
        const baseURL = getApiBaseUrl();

        const response = await axios.post<CreateTransportResponse>(
          `${baseURL}/transports`,
          {
            tripId: payload.tripId,
            carrierName: trimmedName,
            description: toTrimmedOrNull(payload.description),
            departureLocation: toTrimmedOrNull(payload.departureLocation),
            arrivalLocation: toTrimmedOrNull(payload.arrivalLocation),
            departureMemo: toTrimmedOrNull(payload.departureMemo),
            arrivalMemo: toTrimmedOrNull(payload.arrivalMemo),
            bookingReference: toTrimmedOrNull(payload.bookingReference),
            departureTimezone: toTrimmedOrNull(payload.departureTimezone),
            arrivalTimezone: toTrimmedOrNull(payload.arrivalTimezone),
            departureDate: departureParts.date,
            departureTime: departureParts.time,
            arrivalDate: arrivalParts.date,
            arrivalTime: arrivalParts.time,
            departureGooglePlaceId: toTrimmedOrNull(
              payload.departureGooglePlaceId ?? null
            ),
            departureGoogleData: payload.departureGoogleData ?? null,
            arrivalGooglePlaceId: toTrimmedOrNull(
              payload.arrivalGooglePlaceId ?? null
            ),
            arrivalGoogleData: payload.arrivalGoogleData ?? null
          },
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`
            }
          }
        );

        return response.data.transport;
      } catch (err) {
        const message = (() => {
          if (isAxiosError(err)) {
            const responseError =
              err.response?.data &&
              typeof err.response.data === "object" &&
              "error" in err.response.data
                ? String(
                    (err.response.data as { error: string; details?: string })
                      .error
                  )
                : err.message;
            return responseError;
          }
          if (err instanceof Error) {
            return err.message;
          }
          return "Unknown error";
        })();

        setError(message);
        // eslint-disable-next-line no-console
        console.error("useCreateTransport error:", err);
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [session?.access_token]
  );

  return { createTransport, isSubmitting, error };
};
