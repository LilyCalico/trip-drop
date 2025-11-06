import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import Button from "@/components/custom/button/Button";
import DatePulldown from "@/components/custom/datetime/DatePulldown";
import Time from "@/components/custom/datetime/Time";
import Input from "@/components/custom/Input";
import InputGooglePlaces from "@/components/custom/InputGooglePlaces";
import TimeZone from "@/components/custom/trip/TimeZone";
import { Label } from "@/components/ui/label";
import type { GooglePlaceCandidate } from "@/hooks/google/useGooglePlacesPredictions";
import {
  type CreateTransportPayload,
  useCreateTransport,
} from "@/hooks/transports/useCreateTransport";
import { useCurrentTrip } from "@/hooks/trips/useCurrentTrip";

interface ModalAddTransportProps {
  onClose: () => void;
  defaultDate?: string;
}

interface TransportFormData {
  carrierName: string;
  departureLocation: string;
  departureMemo: string;
  arrivalLocation: string;
  arrivalMemo: string;
  bookingReference: string;
  departureGooglePlaceId: string | null;
  departureGoogleData: GooglePlaceCandidate | null;
  arrivalGooglePlaceId: string | null;
  arrivalGoogleData: GooglePlaceCandidate | null;
}

const toDateOnly = (value: string) =>
  value.length >= 10 ? value.slice(0, 10) : value;

export default function ModalAddTransport({
  onClose,
  defaultDate,
}: ModalAddTransportProps) {
  const trip = useCurrentTrip();
  const { createTransport, isSubmitting, error } = useCreateTransport();
  const [formData, setFormData] = useState<TransportFormData>({
    carrierName: "",
    departureLocation: "",
    departureMemo: "",
    arrivalLocation: "",
    arrivalMemo: "",
    bookingReference: "",
    departureGooglePlaceId: null,
    departureGoogleData: null,
    arrivalGooglePlaceId: null,
    arrivalGoogleData: null,
  });
  const [departureDate, setDepartureDate] = useState<string>("");
  const [departureTime, setDepartureTime] = useState<string>("00:00");
  const [arrivalDate, setArrivalDate] = useState<string>("");
  const [arrivalTime, setArrivalTime] = useState<string>("00:00");
  const [departureTimezone, setDepartureTimezone] = useState<string>("");
  const [arrivalTimezone, setArrivalTimezone] = useState<string>("");

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  useEffect(() => {
    if (!trip) return;
    if (defaultDate && departureDate === "") {
      setDepartureDate(defaultDate);
    }
    if (defaultDate && arrivalDate === "") {
      setArrivalDate(defaultDate);
    }
    if (!departureDate && !defaultDate) {
      setDepartureDate(trip.startAt);
    }
    if (!arrivalDate && !defaultDate) {
      setArrivalDate(trip.endAt);
    }
    if (!departureTimezone) {
      setDepartureTimezone(trip.timeZone);
    }
    if (!arrivalTimezone) {
      setArrivalTimezone(trip.timeZone);
    }
  }, [
    trip,
    departureDate,
    arrivalDate,
    departureTimezone,
    arrivalTimezone,
    defaultDate,
  ]);

  const isValid = useMemo(() => {
    return (
      formData.carrierName.trim().length > 0 &&
      formData.departureLocation.trim().length > 0 &&
      formData.arrivalLocation.trim().length > 0 &&
      departureDate &&
      departureTime &&
      arrivalDate &&
      arrivalTime
    );
  }, [
    formData.carrierName,
    formData.departureLocation,
    formData.arrivalLocation,
    departureDate,
    departureTime,
    arrivalDate,
    arrivalTime,
  ]);

  const handleDepartureLocationChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      departureLocation: value,
      departureGooglePlaceId: null,
      departureGoogleData: null,
    }));
  };

  const handleDepartureCandidateSelect = (candidate: GooglePlaceCandidate) => {
    setFormData((prev) => ({
      ...prev,
      departureLocation: candidate.name,
      departureGooglePlaceId: candidate.place_id,
      departureGoogleData: candidate,
    }));
  };

  const handleArrivalLocationChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      arrivalLocation: value,
      arrivalGooglePlaceId: null,
      arrivalGoogleData: null,
    }));
  };

  const handleArrivalCandidateSelect = (candidate: GooglePlaceCandidate) => {
    setFormData((prev) => ({
      ...prev,
      arrivalLocation: candidate.name,
      arrivalGooglePlaceId: candidate.place_id,
      arrivalGoogleData: candidate,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!trip) return;
    const payload = {
      tripId: trip.id,
      carrierName: formData.carrierName,
      departureLocation: formData.departureLocation,
      arrivalLocation: formData.arrivalLocation,
      departureMemo: formData.departureMemo,
      arrivalMemo: formData.arrivalMemo,
      bookingReference: formData.bookingReference,
      departureTimezone: departureTimezone || null,
      arrivalTimezone: arrivalTimezone || null,
      departureDate: toDateOnly(departureDate),
      departureTime,
      arrivalDate: toDateOnly(arrivalDate),
      arrivalTime,
      departureGooglePlaceId: formData.departureGooglePlaceId,
      departureGoogleData: formData.departureGoogleData,
      arrivalGooglePlaceId: formData.arrivalGooglePlaceId,
      arrivalGoogleData: formData.arrivalGoogleData,
    } as CreateTransportPayload;

    const transport = await createTransport(payload);

    if (transport) {
      toast.success("Transport saved");
      onClose();
    }
  };

  if (!trip) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-[1.6rem]">
        <div>
          <Label htmlFor="transport-carrier" className="text-[1.2rem]">
            Airline / Railway Name *
          </Label>
          <Input
            id="transport-carrier"
            value={formData.carrierName}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, carrierName: e.target.value }))
            }
            placeholder=""
            required
          />
        </div>
        <InputGooglePlaces
          id="transport-departure-location"
          label="Departure Location"
          value={formData.departureLocation}
          onValueChange={handleDepartureLocationChange}
          onCandidateSelect={handleDepartureCandidateSelect}
          required
        />
        <div>
          <Label htmlFor="transport-departure-memo" className="text-[1.2rem]">
            Departure Memo
          </Label>
          <Input
            id="transport-departure-memo"
            value={formData.departureMemo}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                departureMemo: e.target.value,
              }))
            }
            placeholder=""
          />
        </div>
        <div className="flex gap-[0.8rem]">
          <DatePulldown
            label="Departure Date *"
            id="transport-departure-date"
            value={departureDate}
            onChange={setDepartureDate}
            startDate={trip.startAt}
            endDate={trip.endAt}
            placeholder="Select date"
            className="md:flex-1"
          />
          <Time
            label="Time *"
            id="transport-departure-time"
            value={departureTime}
            onChange={setDepartureTime}
            required
            className="md:flex-1"
          />
        </div>
        <TimeZone
          timezone={departureTimezone}
          setTimezone={setDepartureTimezone}
          required={false}
        />
        <InputGooglePlaces
          id="transport-arrival-location"
          label="Arrival Location"
          value={formData.arrivalLocation}
          onValueChange={handleArrivalLocationChange}
          onCandidateSelect={handleArrivalCandidateSelect}
          required
        />
        <div>
          <Label htmlFor="transport-arrival-memo" className="text-[1.2rem]">
            Arrival Memo
          </Label>
          <Input
            id="transport-arrival-memo"
            value={formData.arrivalMemo}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, arrivalMemo: e.target.value }))
            }
            placeholder=""
          />
        </div>
        <div className="flex gap-[0.8rem]">
          <DatePulldown
            label="Arrival Date *"
            id="transport-arrival-date"
            value={arrivalDate}
            onChange={setArrivalDate}
            startDate={trip.startAt}
            endDate={trip.endAt}
            placeholder="Select date"
            className="md:flex-1"
          />
          <Time
            label="Time *"
            id="transport-arrival-time"
            value={arrivalTime}
            onChange={setArrivalTime}
            required
            className="md:flex-1"
          />
        </div>
        <TimeZone
          timezone={arrivalTimezone}
          setTimezone={setArrivalTimezone}
          required={false}
        />
        <div>
          <Label
            htmlFor="transport-booking-reference"
            className="text-[1.2rem]"
          >
            Booking Reference
          </Label>
          <Input
            id="transport-booking-reference"
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
        <Button
          type="submit"
          className="w-full mt-[1.6rem]"
          disabled={!isValid || isSubmitting}
        >
          {isSubmitting ? "Saving..." : "Add Transport"}
        </Button>
      </form>
    </div>
  );
}
