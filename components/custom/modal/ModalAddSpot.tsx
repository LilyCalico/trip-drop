import { eachDayOfInterval, format, parseISO } from "date-fns";
import { Calendar, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import Button from "@/components/custom/button/Button";
import Input from "@/components/custom/Input";
import { Input as BaseInput } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type GooglePlaceCandidate,
  useGooglePlacesPredictions,
} from "@/hooks/google/useGooglePlacesPredictions";
import { useCreateSpot } from "@/hooks/spots/useCreateSpot";
import { useCurrentTrip } from "@/hooks/useCurrentTrip";
import { cn } from "@/lib/utils";

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

  // 旅程の日付範囲を取得（UTCで生成）
  const tripDates = trip
    ? eachDayOfInterval({
        start: parseISO(trip.startAt),
        end: parseISO(trip.endAt),
      }).map((date) => {
        // 各日付をUTCの00:00:00に設定
        const utcDate = new Date(date);
        utcDate.setUTCHours(0, 0, 0, 0);
        return utcDate;
      })
    : [];

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
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, address: e.target.value }))
            }
            placeholder="Enter address"
          />
        </div>

        {/* DateTime */}
        <div className="flex gap-[0.8rem]">
          {/* Date */}
          <div>
            <Label htmlFor="visit-date" className="text-[1.2rem] mb-[0.4rem]">
              Visit Date
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Select value={selectedDate} onValueChange={setSelectedDate}>
                <SelectTrigger className="py-[1.6rem] pl-9 pr-[1.2rem] border-gray-light shadow-none input-custom">
                  <SelectValue>
                    {selectedDate
                      ? format(parseISO(selectedDate), "yyyy/MM/dd EEE")
                      : "Select date"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-light">
                  {tripDates.map((date) => (
                    <SelectItem
                      key={date.toISOString()}
                      value={date.toISOString()}
                      className="bg-white hover:bg-gray-50"
                    >
                      {format(date, "yyyy/MM/dd EEE")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="time-picker" className="text-[1.2rem] mb-[0.4rem]">
              Time
            </Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <BaseInput
                type="time"
                id="time-picker"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className={cn(
                  "h-[3.2rem] pl-9",
                  "border-gray-light shadow-none",
                  "appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none",
                )}
              />
            </div>
          </div>
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
