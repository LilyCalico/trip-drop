import { useEffect, useState } from "react";
import { toast } from "sonner";
import Button from "@/components/custom/button/Button";
import DatePulldown from "@/components/custom/datetime/DatePulldown";
import Time from "@/components/custom/datetime/Time";
import Input from "@/components/custom/Input";
import InputGooglePlaces from "@/components/custom/InputGooglePlaces";
import { Label } from "@/components/ui/label";
import type { GooglePlaceCandidate } from "@/hooks/google/useGooglePlacesPredictions";
import { useCreateSpot } from "@/hooks/spots/useCreateSpot";
import { useCurrentTrip } from "@/hooks/useCurrentTrip";

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
}

export default function ModalAddSpot({ onClose }: ModalAddSpotProps) {
  const trip = useCurrentTrip();
  const { createSpot, isSubmitting } = useCreateSpot();

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

  // 初期値設定: 初日の00:00
  useEffect(() => {
    if (trip && !formData.visitDateTime) {
      const firstDay = new Date(trip.startAt);
      firstDay.setHours(0, 0, 0, 0);
      setFormData((prev) => ({ ...prev, visitDateTime: firstDay }));
    }
  }, [trip, formData.visitDateTime]);

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

    const result = await createSpot({
      name: formData.name,
      address: formData.address,
      notes: formData.notes,
      googlePlaceId: formData.googlePlaceId,
      location: formData.location,
      googleData: formData.googleData,
      tripId: trip.id,
      selectedDate: selectedDate,
      selectedTime: time,
      selectedTimezone: trip.timeZone,
    });

    if (result) {
      toast.success("Spot added successfully!");
      onClose();
    } else {
      toast.error("Failed to add spot. Please try again.");
    }
  };

  // 初期値設定: 旅程の初日
  useEffect(() => {
    if (trip && !selectedDate) {
      setSelectedDate(trip.startAt);
    }
  }, [trip, selectedDate]);

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
          disabled={isSubmitting || !formData.name}
        >
          {isSubmitting ? "Adding..." : "Add Spot"}
        </Button>
      </form>
    </div>
  );
}
