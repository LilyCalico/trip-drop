import { useEffect, useState } from "react";
import { toast } from "sonner";
import Button from "@/components/custom/button/Button";
import DatePulldown from "@/components/custom/datetime/DatePulldown";
import Time from "@/components/custom/datetime/Time";
import Input from "@/components/custom/Input";
import { Label } from "@/components/ui/label";
import {
  type GooglePlaceCandidate,
  useGooglePlacesPredictions,
} from "@/hooks/google/useGooglePlacesPredictions";
import { useCreateSpot } from "@/hooks/spots/useCreateSpot";
import { useCurrentTrip } from "@/hooks/useCurrentTrip";

interface SpotFormData {
  name: string;
  address: string;
  visitDateTime: Date | null;
  notes: string;
  googlePlaceId: string | null;
  location: { lat: number; lng: number } | null;
  googleData: any | null; // Google Places APIの全データ
}

interface ModalAddSpotProps {
  onClose: () => void;
}

export default function ModalAddSpot({ onClose }: ModalAddSpotProps) {
  const trip = useCurrentTrip();
  const { candidates, showPredictions, setShowPredictions, handleInputChange } =
    useGooglePlacesPredictions();
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

  // Name入力時の予測変換
  const handleNameChange = (value: string) => {
    setFormData((prev) => ({ ...prev, name: value }));
    handleInputChange(value);
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
    setShowPredictions(false);
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
      time: time,
      timezone: trip.timeZone,
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
        {/* Name */}
        <div className="">
          <Label htmlFor="name" className="text-[1.2rem]">
            Name *
          </Label>
          <div className="relative">
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Enter spot name"
              required
            />
            {showPredictions && candidates.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {candidates.map((candidate) => (
                  <div
                    key={candidate.place_id}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                    onClick={() => handleCandidateSelect(candidate)}
                  >
                    <div className="font-medium">{candidate.name}</div>
                    <div className="text-sm text-gray-500">
                      {candidate.formatted_address}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Address */}
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
          <Time
            label="Time"
            id="time-picker"
            value={time}
            onChange={setTime}
          />
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
