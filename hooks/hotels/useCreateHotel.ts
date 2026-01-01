import axios from "axios";
import { useState } from "react";
import getApiBaseUrl from "@/lib/getApiBaseUrl";
import { useAuthStore } from "@/store/useAuthStore";

export interface CreateHotelPayload {
  name: string;
  address: string | null;
  phone: string | null;
  notes: string | null;
  bookingReference: string | null;
  googlePlaceId: string | null;
  googleData: unknown;
  checkin: string; // ISO 8601 with offset
  checkout: string; // ISO 8601 with offset
  tripId: string;
}

export const useCreateHotel = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const session = useAuthStore((s) => s.session);

  const createHotel = async (payload: CreateHotelPayload) => {
    if (!session?.access_token) {
      setError("No access token");
      return null;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const baseURL = getApiBaseUrl();
      const { data } = await axios.post(
        `${baseURL}/hotels`,
        {
          name: payload.name,
          address: payload.address,
          phone: payload.phone,
          notes: payload.notes,
          bookingReference: payload.bookingReference,
          googlePlaceId: payload.googlePlaceId,
          googleData: payload.googleData,
          checkin: payload.checkin,
          checkout: payload.checkout,
          tripId: payload.tripId
        },
        {
          headers: { Authorization: `Bearer ${session.access_token}` }
        }
      );
      return data;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      setError(message);
      // eslint-disable-next-line no-console
      console.error("useCreateHotel error:", e);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { createHotel, isSubmitting, error };
};
