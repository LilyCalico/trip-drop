import axios from "axios";
import { useState } from "react";
import { createVisitDateTime } from "@/lib/createVisitDateTime";
import { useAuthStore } from "@/store/useAuthStore";

interface CreateSpotParams {
  name: string;
  address?: string;
  notes?: string;
  googlePlaceId?: string | null;
  location?: { lat: number; lng: number } | null;
  googleData?: any | null;
  tripId: string;
  selectedDate: string;
  time: string;
  timezone: string;
}

export const useCreateSpot = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const session = useAuthStore((s) => s.session);

  const createSpot = async (params: CreateSpotParams) => {
    setIsSubmitting(true);

    try {
      if (!params.selectedDate || !params.time || !params.timezone) {
        console.warn("Missing required date/time parameters");
        return null;
      }

      // 選択された日付を取得（ISO文字列から日付部分のみ）
      const visitDate = params.selectedDate.split("T")[0];

      // tripのタイムゾーンでのISO文字列を作成
      const visitDateTimeWithTimezone = createVisitDateTime(
        visitDate,
        params.time,
        params.timezone,
      );

      if (!visitDateTimeWithTimezone) {
        console.warn("Failed to create visit date time");
        return null;
      }

      console.log("LOCATION", params.location);

      const submitData = {
        name: params.name,
        address: params.address,
        visitDateTime: visitDateTimeWithTimezone,
        timezone: params.timezone,
        notes: params.notes,
        googlePlaceId: params.googlePlaceId,
        location: params.location,
        googleData: params.googleData,
        tripId: params.tripId,
        selectedDate: params.selectedDate,
      };

      // API呼び出し
      if (!session?.access_token) {
        console.error("No access token found");
        return null;
      }

      const baseURL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
      const response = await axios.post(`${baseURL}/spots`, submitData, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error("Error creating spot:", error);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    createSpot,
    isSubmitting,
  };
};
