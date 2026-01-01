import axios, { isAxiosError } from "axios";
import { useCallback, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import type { Tables } from "@/types/supabasetype";

type HotelStayRow = Tables<"hotel_stays">;

interface UpdateHotelPayload {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  notes: string | null;
  bookingReference: string | null;
  googlePlaceId?: string | null;
  googleData?: unknown;
  checkin: string;
  checkout: string;
  tripId: string;
  timezone?: string | null;
}

export const useUpdateHotel = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const session = useAuthStore((s) => s.session);

  const updateHotel = useCallback(
    async (
      payload: UpdateHotelPayload
    ): Promise<
      { success: true; data: HotelStayRow } | { success: false; error: string }
    > => {
      if (!session?.access_token) {
        const error = "No access token";
        setError(error);
        return { success: false, error };
      }

      if (!payload.id) {
        const error = "Hotel id is required";
        setError(error);
        return { success: false, error };
      }

      if (!payload.checkin || !payload.checkout) {
        const error = "Check-in and check-out are required";
        setError(error);
        return { success: false, error };
      }

      setIsUpdating(true);
      setError(null);

      try {
        const baseURL =
          process.env.NEXT_PUBLIC_API_URL ||
          process.env.NEXT_PUBLIC_LOCAL_API_URL;

        const { data } = await axios.patch<HotelStayRow>(
          `${baseURL}/hotels/${payload.id}`,
          {
            name: payload.name,
            address: payload.address,
            phone: payload.phone,
            notes: payload.notes,
            bookingReference: payload.bookingReference,
            googlePlaceId: payload.googlePlaceId,
            googleData: payload.googleData,
            checkin: payload.checkin,
            checkout: payload.checkout
          },
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`
            }
          }
        );

        return { success: true, data };
      } catch (err) {
        const message = (() => {
          if (isAxiosError(err)) {
            return err.response?.data?.error ?? err.message;
          }
          if (err instanceof Error) {
            return err.message;
          }
          return "Failed to update hotel";
        })();
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsUpdating(false);
      }
    },
    [session?.access_token]
  );

  return {
    updateHotel,
    isUpdating,
    error
  };
};
