import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import Button from "@/components/custom/button/Button";
import DatePulldown from "@/components/custom/datetime/DatePulldown";
import Time from "@/components/custom/datetime/Time";
import InputGooglePlaces from "@/components/custom/InputGooglePlaces";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { GooglePlaceCandidate } from "@/hooks/google/useGooglePlacesPredictions";
import { useCreateSpot } from "@/hooks/spots/useCreateSpot";
import { useUpdateSpot } from "@/hooks/spots/useUpdateSpot";
import { useCurrentTrip } from "@/hooks/trips/useCurrentTrip";
import { extractLocalDateTimeParts } from "@/lib/functions/convertUtcToLocalParts";
import type { Tables } from "@/types/supabasetype";

type SpotRow = Tables<"spots">;

export interface SpotInitialValues {
  name?: string | null;
  address?: string | null;
  notes?: string | null;
  googlePlaceId?: string | null;
  location?: { lat: number; lng: number } | null;
  googleData?: GooglePlaceCandidate | null;
  visitDatetimeUtc?: string | null;
  timezone?: string | null;
}

interface SpotFormData {
  name: string;
  address: string;
  visitDateTime: Date | null;
  notes: string;
  googlePlaceId: string | null;
  location: { lat: number; lng: number } | null;
  googleData: GooglePlaceCandidate | null;
}

interface ModalAddSpotProps {
  onClose: () => void;
  defaultDate?: string;
  mode?: "create" | "edit";
  targetId?: string;
  initialValues?: SpotInitialValues;
  onSuccess?: (spot: SpotRow) => void;
}

export default function ModalAddSpot({
  onClose,
  defaultDate,
  mode = "create",
  targetId,
  initialValues,
  onSuccess,
}: ModalAddSpotProps) {
  const trip = useCurrentTrip();
  const { createSpot, isSubmitting } = useCreateSpot();
  const { updateSpot, isUpdating } = useUpdateSpot();

  const [formData, setFormData] = useState<SpotFormData>({
    name: "",
    address: "",
    visitDateTime: null,
    notes: "",
    googlePlaceId: null,
    location: null,
    googleData: null,
  });
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [time, setTime] = useState<string>("00:00");
  const [selectedTimezone, setSelectedTimezone] = useState<string>("");

  const isEditMode = mode === "edit";

  // 初期値設定: 初日の00:00
  useEffect(() => {
    if (!trip) {
      return;
    }

    if (isEditMode && initialValues) {
      setFormData((prev) => ({
        ...prev,
        name: initialValues.name ?? prev.name,
        address: initialValues.address ?? prev.address,
        notes: initialValues.notes ?? prev.notes,
        googlePlaceId: initialValues.googlePlaceId ?? prev.googlePlaceId,
        location: initialValues.location ?? prev.location,
        googleData: initialValues.googleData ?? prev.googleData,
      }));

      const timezoneToUse =
        initialValues.timezone ?? trip.timeZone ?? selectedTimezone;
      setSelectedTimezone(timezoneToUse ?? "");

      const parts = extractLocalDateTimeParts({
        datetimeUtc: initialValues.visitDatetimeUtc,
        timezone: timezoneToUse,
      });

      if (parts) {
        setSelectedDate(parts.date);
        setTime(parts.time);
      }
      return;
    }

    if (!formData.visitDateTime) {
      const firstDay = new Date(trip.startAt);
      firstDay.setHours(0, 0, 0, 0);
      setFormData((prev) => ({ ...prev, visitDateTime: firstDay }));
    }

    if (!selectedTimezone) {
      setSelectedTimezone(trip.timeZone ?? "");
    }
  }, [
    trip,
    formData.visitDateTime,
    initialValues,
    isEditMode,
    selectedTimezone,
  ]);

  const handleNameChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      name: value,
    }));
  };

  // 候補選択時
  const handleCandidateSelect = (candidate: GooglePlaceCandidate) => {
    setFormData((prev) => ({
      ...prev,
      name: candidate.name,
      address: candidate.formatted_address,
      googlePlaceId: candidate.place_id,
      location: {
        lat: candidate.geometry.location.lat,
        lng: candidate.geometry.location.lng,
      },
      googleData: candidate, // Google Places APIの全データを保存
    }));
  };

  // フォーム送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!trip) {
      console.warn("Trip not found");
      return;
    }

    const timezoneToUse = selectedTimezone || trip.timeZone;

    if (!selectedDate || !time || !timezoneToUse) {
      toast.error("Date, time, and timezone are required");
      return;
    }

    if (isEditMode) {
      if (!targetId) {
        toast.error("Target spot id not provided");
        return;
      }

      const result = await updateSpot({
        id: targetId,
        name: formData.name,
        address: formData.address,
        notes: formData.notes,
        googlePlaceId: formData.googlePlaceId,
        location: formData.location,
        googleData: formData.googleData,
        tripId: trip.id,
        selectedDate: selectedDate,
        selectedTime: time,
        selectedTimezone: timezoneToUse,
      });

      if (result) {
        toast.success("Spot updated successfully!");
        onSuccess?.(result);
        onClose();
      } else {
        toast.error("Failed to update spot. Please try again.");
      }
      return;
    }

    const createResult = await createSpot({
      name: formData.name,
      address: formData.address,
      notes: formData.notes,
      googlePlaceId: formData.googlePlaceId,
      location: formData.location,
      googleData: formData.googleData,
      tripId: trip.id,
      selectedDate: selectedDate,
      selectedTime: time,
      selectedTimezone: timezoneToUse,
    });

    if (createResult) {
      toast.success("Spot added successfully!");
      onSuccess?.(createResult);
      onClose();
    } else {
      toast.error("Failed to add spot. Please try again.");
    }
  };

  // 初期値設定: 旅程の初日
  useEffect(() => {
    if (defaultDate && selectedDate === "") {
      setSelectedDate(defaultDate);
    }

    if (
      trip &&
      !selectedDate &&
      !defaultDate &&
      (!isEditMode || !initialValues?.visitDatetimeUtc)
    ) {
      setSelectedDate(trip.startAt);
    }
  }, [trip, selectedDate, defaultDate, initialValues, isEditMode]);

  useEffect(() => {
    if (isEditMode && initialValues?.name) {
      setFormData((prev) => ({
        ...prev,
        name: initialValues.name ?? prev.name,
      }));
    }
  }, [initialValues?.name, isEditMode]);

  const submitting = useMemo(
    () => (isEditMode ? isUpdating : isSubmitting),
    [isEditMode, isSubmitting, isUpdating],
  );

  if (!trip) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-[1.6rem]">
        {/* Name (Manual or Auto complete with Google Places API) */}
        <InputGooglePlaces
          id="name"
          label="Name"
          required
          value={formData.name}
          onValueChange={handleNameChange}
          onCandidateSelect={handleCandidateSelect}
          placeholder=""
        />

        {/* Address (Manual or Auto complete with Google Places API) */}
        <div>
          <Label htmlFor="address" className="text-[1.2rem]">
            Address
          </Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => {
              setFormData((prev) => ({
                ...prev,
                address: e.target.value,
                googlePlaceId: null,
                location: null,
                googleData: null,
              }));
            }}
            placeholder="Enter address"
          />
        </div>

        {/* DateTime */}
        <div className="flex gap-[0.8rem]">
          {/* Date */}
          <DatePulldown
            label="Visit Date"
            id="visit-date"
            value={selectedDate}
            onChange={setSelectedDate}
            startDate={trip.startAt}
            endDate={trip.endAt}
            placeholder="Select date"
          />
          <Time label="Time" id="time-picker" value={time} onChange={setTime} />
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes" className="text-[1.2rem]">
            Notes
          </Label>
          <Input
            id="notes"
            value={formData.notes}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, notes: e.target.value }))
            }
            placeholder="Add notes or additional information"
          />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full mt-[1.6rem]"
          disabled={submitting || !formData.name}
        >
          {submitting
            ? isEditMode
              ? "Updating..."
              : "Adding..."
            : isEditMode
              ? "Update Spot"
              : "Add Spot"}
        </Button>
      </form>
    </div>
  );
}
