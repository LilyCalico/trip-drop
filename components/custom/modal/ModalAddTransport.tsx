import { useEffect, useMemo, useState } from "react";
import Button from "@/components/custom/button/Button";
import DatePulldown from "@/components/custom/datetime/DatePulldown";
import Time from "@/components/custom/datetime/Time";
import Input from "@/components/custom/Input";
import TimeZone from "@/components/custom/trip/TimeZone";
import { Label } from "@/components/ui/label";
import { useCurrentTrip } from "@/hooks/useCurrentTrip";

interface ModalAddTransportProps {
  onClose: () => void;
}

interface TransportFormData {
  carrierName: string;
  departureLocation: string;
  departureMemo: string;
  arrivalLocation: string;
  arrivalMemo: string;
  bookingReference: string;
}

export default function ModalAddTransport({ onClose }: ModalAddTransportProps) {
  const trip = useCurrentTrip();
  const [formData, setFormData] = useState<TransportFormData>({
    carrierName: "",
    departureLocation: "",
    departureMemo: "",
    arrivalLocation: "",
    arrivalMemo: "",
    bookingReference: "",
  });
  const [departureDate, setDepartureDate] = useState<string>("");
  const [departureTime, setDepartureTime] = useState<string>("00:00");
  const [arrivalDate, setArrivalDate] = useState<string>("");
  const [arrivalTime, setArrivalTime] = useState<string>("00:00");
  const [departureTimezone, setDepartureTimezone] = useState<string>("");
  const [arrivalTimezone, setArrivalTimezone] = useState<string>("");

  useEffect(() => {
    if (!trip) return;
    if (!departureDate) {
      setDepartureDate(trip.startAt);
    }
    if (!arrivalDate) {
      setArrivalDate(trip.endAt);
    }
    if (!departureTimezone) {
      setDepartureTimezone(trip.timeZone);
    }
    if (!arrivalTimezone) {
      setArrivalTimezone(trip.timeZone);
    }
  }, [trip, departureDate, arrivalDate, departureTimezone, arrivalTimezone]);

  const isValid = useMemo(() => {
    return (
      formData.carrierName.trim().length > 0 &&
      departureDate &&
      departureTime &&
      arrivalDate &&
      arrivalTime
    );
  }, [
    formData.carrierName,
    departureDate,
    departureTime,
    arrivalDate,
    arrivalTime,
  ]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!trip) return;
    const payload = {
      ...formData,
      tripId: trip.id,
      departureDateTime: `${departureDate}T${departureTime}`,
      arrivalDateTime: `${arrivalDate}T${arrivalTime}`,
      ...(departureTimezone && departureTimezone !== trip.timeZone
        ? { departureTimezone }
        : {}),
      ...(arrivalTimezone && arrivalTimezone !== trip.timeZone
        ? { arrivalTimezone }
        : {}),
    };
    // TODO: connect with transport creation hook/API
    // eslint-disable-next-line no-console
    console.log("ModalAddTransport payload", payload);
    // onClose();
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
        <div>
          <Label
            htmlFor="transport-departure-location"
            className="text-[1.2rem]"
          >
            Departure Location
          </Label>
          <Input
            id="transport-departure-location"
            value={formData.departureLocation}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                departureLocation: e.target.value,
              }))
            }
            placeholder=""
          />
        </div>
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
        <div>
          <Label htmlFor="transport-arrival-location" className="text-[1.2rem]">
            Arrival Location
          </Label>
          <Input
            id="transport-arrival-location"
            value={formData.arrivalLocation}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                arrivalLocation: e.target.value,
              }))
            }
            placeholder=""
          />
        </div>
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
          disabled={!isValid}
        >
          Add Transport
        </Button>
      </form>
    </div>
  );
}
