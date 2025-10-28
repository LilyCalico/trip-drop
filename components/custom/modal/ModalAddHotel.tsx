import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import Button from "@/components/custom/button/Button";
import DatePulldown from "@/components/custom/datetime/DatePulldown";
import Time from "@/components/custom/datetime/Time";
import Input from "@/components/custom/Input";
import { Label } from "@/components/ui/label";
import { useGooglePlaceDetails } from "@/hooks/google/useGooglePlaceDetails";
import {
  type GooglePlaceCandidate,
  useGooglePlacesPredictions,
} from "@/hooks/google/useGooglePlacesPredictions";
import { useCreateHotel } from "@/hooks/hotels/useCreateHotel";
import { useCurrentTrip } from "@/hooks/useCurrentTrip";
import { toZonedIsoString } from "@/lib/toZonedIsoString";

interface ModalAddHotelProps {
  onClose: () => void;
}

interface HotelFormData {
  name: string;
  address: string;
  phone: string;
  notes: string;
  googlePlaceId: string | null;
  googleData: GooglePlaceCandidate | null;
  bookingReference: string;
}

export default function ModalAddHotel({ onClose }: ModalAddHotelProps) {
  const trip = useCurrentTrip();
  const { candidates, showPredictions, setShowPredictions, handleInputChange } =
    useGooglePlacesPredictions();
  const { getDetails } = useGooglePlaceDetails();
  const { createHotel, isSubmitting } = useCreateHotel();

  // form data
  const [formData, setFormData] = useState<HotelFormData>({
    name: "",
    address: "",
    phone: "",
    notes: "",
    googlePlaceId: null,
    googleData: null,
    bookingReference: "",
  });

  // checkin / checkout
  const [checkinDate, setCheckinDate] = useState<string>("");
  const [checkinTime, setCheckinTime] = useState<string>("00:00");
  const [checkoutDate, setCheckoutDate] = useState<string>("");
  const [checkoutTime, setCheckoutTime] = useState<string>("00:00");

  // 旅程の初日と最終日を初期値に
  useEffect(() => {
    if (!trip) return;

    if (!checkinDate) {
      const zonedCheckin = toZonedIsoString(
        trip.startAt,
        "00:00",
        trip.timeZone,
      );
      setCheckinDate(zonedCheckin ?? "");
    }

    if (!checkoutDate) {
      const zonedCheckout = toZonedIsoString(
        trip.endAt,
        "00:00",
        trip.timeZone,
      );
      setCheckoutDate(zonedCheckout ?? "");
    }
  }, [trip, checkinDate, checkoutDate]);

  // Name入力 (自動入力がされていればAddress/Phoneをクリア)
  const handleNameChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      name: value,
      address: prev.googlePlaceId ? "" : prev.address,
      phone: prev.googlePlaceId ? "" : prev.phone,
      googlePlaceId: null,
      googleData: null,
    }));
    handleInputChange(value);
  };

  // 候補選択時 → Address/Phoneを自動入力
  const handleCandidateSelect = async (candidate: GooglePlaceCandidate) => {
    try {
      // まず候補から取れる最低限を反映
      const details = await getDetails(candidate.place_id);
      const phone = details?.formatted_phone_number ?? "";

      setFormData((prev) => ({
        ...prev,
        name: candidate.name,
        address: candidate.formatted_address,
        phone,
        googlePlaceId: candidate.place_id,
        googleData: candidate,
      }));
      setShowPredictions(false);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      setShowPredictions(false);
    }
  };

  const isValid = useMemo(() => {
    return (
      formData.name.trim().length > 0 &&
      checkinDate &&
      checkinTime &&
      checkoutDate &&
      checkoutTime
    );
  }, [formData.name, checkinDate, checkinTime, checkoutDate, checkoutTime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trip) return;

    // YYYY-MM-DDTHH:MM:00
    const checkinDateTime = `${checkinDate.split("T")[0]}T${checkinTime}`;
    const checkoutDateTime = `${checkoutDate.split("T")[0]}T${checkoutTime}`;

    const payload = {
      name: formData.name,
      address: formData.address || null,
      phone: formData.phone || null,
      notes: formData.notes || null,
      bookingReference: formData.bookingReference || null,
      googlePlaceId: formData.googlePlaceId,
      googleData: formData.googleData,
      checkin: checkinDateTime,
      checkout: checkoutDateTime,
      tripId: trip.id,
    };

    // eslint-disable-next-line no-console
    console.log("create hotel payload", payload);

    // APIにPOST
    const result = await createHotel(payload);
    if (result) {
      console.log("Success!!!!", result);
      toast.success("Hotel added successfully!");
      onClose();
    } else {
      toast.error("Failed to add hotel. Please try again.");
    }
  };

  if (!trip) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-[1.6rem]">
        {/* Name */}
        <div>
          <Label htmlFor="hotel-name" className="text-[1.2rem]">
            Name *
          </Label>
          <div className="relative">
            <Input
              id="hotel-name"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder=""
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
          <Label htmlFor="hotel-address" className="text-[1.2rem]">
            Address
          </Label>
          <Input
            id="hotel-address"
            value={formData.address}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                address: e.target.value,
                googlePlaceId: null,
                googleData: null,
              }))
            }
            placeholder=""
          />
        </div>

        {/* Phone */}
        <div>
          <Label htmlFor="hotel-phone" className="text-[1.2rem]">
            Phone
          </Label>
          <Input
            id="hotel-phone"
            value={formData.phone}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, phone: e.target.value }))
            }
            placeholder=""
          />
        </div>

        {/* Check-in */}
        <div className="flex gap-[0.8rem]">
          <DatePulldown
            label="Check-in Date"
            id="checkin-date"
            value={checkinDate}
            onChange={setCheckinDate}
            startDate={trip.startAt}
            endDate={trip.endAt}
            placeholder="Select date"
          />
          <Time
            label="Time"
            id="checkin-time"
            value={checkinTime}
            onChange={setCheckinTime}
          />
        </div>

        {/* Check-out */}
        <div className="flex gap-[0.8rem]">
          <DatePulldown
            label="Check-out Date"
            id="checkout-date"
            value={checkoutDate}
            onChange={setCheckoutDate}
            startDate={trip.startAt}
            endDate={trip.endAt}
            placeholder="Select date"
          />
          <Time
            label="Time"
            id="checkout-time"
            value={checkoutTime}
            onChange={setCheckoutTime}
          />
        </div>

        {/* Booking reference (optional) */}
        <div>
          <Label htmlFor="hotel-booking-ref" className="text-[1.2rem]">
            Booking reference
          </Label>
          <Input
            id="hotel-booking-ref"
            value={formData.bookingReference}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                bookingReference: e.target.value,
              }))
            }
            placeholder=""
          />
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="hotel-notes" className="text-[1.2rem]">
            Note
          </Label>
          <Input
            id="hotel-notes"
            value={formData.notes}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, notes: e.target.value }))
            }
            placeholder=""
          />
        </div>

        {/* Submit */}
        <Button
          type="submit"
          className="w-full mt-[1.6rem]"
          disabled={!isValid || isSubmitting}
        >
          {isSubmitting ? "Adding..." : "Add Hotel"}
        </Button>
      </form>
    </div>
  );
}
