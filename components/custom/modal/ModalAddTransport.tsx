import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import Button from "@/components/custom/button/Button";
import DatePulldown from "@/components/custom/datetime/DatePulldown";
import Time from "@/components/custom/datetime/Time";
import TimeZone from "@/components/custom/trip/TimeZone";
import Input from "@/components/ui/input";
import InputGooglePlaces from "@/components/ui/inputGooglePlaces";
import { Label } from "@/components/ui/label";
import type { GooglePlaceCandidate } from "@/hooks/google/useGooglePlacesPredictions";
import {
  type CreateTransportPayload,
  useCreateTransport,
} from "@/hooks/transports/useCreateTransport";
import {
  type UpdateTransportParams,
  useUpdateTransport,
} from "@/hooks/transports/useUpdateTransport";
import { useCurrentTrip } from "@/hooks/trips/useCurrentTrip";
import { extractLocalDateTimeParts as convertUtcToLocalParts } from "@/lib/functions/convertUtcToLocalParts";
import type { Tables } from "@/types/supabasetype";

type TransportRow = Tables<"transports">;

export interface TransportInitialValues {
  carrierName?: string | null;
  departureLocation?: string | null;
  arrivalLocation?: string | null;
  departureMemo?: string | null;
  arrivalMemo?: string | null;
  departureDatetimeUtc?: string | null;
  arrivalDatetimeUtc?: string | null;
  bookingReference?: string | null;
  departureTimezone?: string | null;
  arrivalTimezone?: string | null;
  departureGooglePlaceId?: string | null;
  arrivalGooglePlaceId?: string | null;
  departureGoogleData?: GooglePlaceCandidate | null;
  arrivalGoogleData?: GooglePlaceCandidate | null;
}

interface ModalAddTransportProps {
  onClose: () => void;
  mode?: "create" | "edit";
  targetId?: string;
  initialValues?: TransportInitialValues;
  onSuccess?: (transport: TransportRow) => void;
}

interface TransportFormData {
  carrierName: string;
  departureLocation: string;
  departureMemo: string;
  departureDateTimeLocal: string;
  departureTimezone: string;
  arrivalLocation: string;
  arrivalMemo: string;
  arrivalDateTimeLocal: string;
  arrivalTimezone: string;
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
  mode = "create",
  targetId,
  initialValues,
  onSuccess,
}: ModalAddTransportProps) {
  const trip = useCurrentTrip();
  const {
    createTransport,
    isSubmitting,
    error: createError,
  } = useCreateTransport();
  const {
    updateTransport,
    isUpdating,
    error: updateError,
  } = useUpdateTransport();
  const [formData, setFormData] = useState<TransportFormData>({
    carrierName: initialValues?.carrierName ?? "",
    departureLocation: initialValues?.departureLocation ?? "",
    departureMemo: initialValues?.departureMemo ?? "",
    departureTimezone: initialValues?.departureTimezone ?? "",
    departureDateTimeLocal: initialValues?.departureDatetimeUtc ?? "",
    arrivalLocation: initialValues?.arrivalLocation ?? "",
    arrivalMemo: initialValues?.arrivalMemo ?? "",
    arrivalTimezone: initialValues?.arrivalTimezone ?? "",
    arrivalDateTimeLocal: initialValues?.arrivalDatetimeUtc ?? "",
    bookingReference: initialValues?.bookingReference ?? "",
    departureGooglePlaceId: initialValues?.departureGooglePlaceId ?? null,
    departureGoogleData: initialValues?.departureGoogleData ?? null,
    arrivalGooglePlaceId: initialValues?.arrivalGooglePlaceId ?? null,
    arrivalGoogleData: initialValues?.arrivalGoogleData ?? null,
  });

  const initialDateTimeParts = useMemo(() => {
    if (mode === "edit" && initialValues) {
      return {
        departure: convertUtcToLocalParts({
          datetimeUtc: initialValues.departureDatetimeUtc,
          timezone: initialValues.departureTimezone,
        }),
        arrival: convertUtcToLocalParts({
          datetimeUtc: initialValues.arrivalDatetimeUtc,
          timezone: initialValues.arrivalTimezone,
        }),
      };
    }
  }, [mode, initialValues]);

  const [departureDate, setDepartureDate] = useState<string>(
    initialDateTimeParts?.departure?.date ?? "",
  );
  const [departureTime, setDepartureTime] = useState<string>(
    initialDateTimeParts?.departure?.time ?? "00:00",
  );
  const [arrivalDate, setArrivalDate] = useState<string>(
    initialDateTimeParts?.arrival?.date ?? "",
  );
  const [arrivalTime, setArrivalTime] = useState<string>(
    initialDateTimeParts?.arrival?.time ?? "00:00",
  );
  const [departureTimezone, setDepartureTimezone] = useState<string>(
    initialValues?.departureTimezone ?? "",
  );
  const [arrivalTimezone, setArrivalTimezone] = useState<string>(
    initialValues?.arrivalTimezone ?? "",
  );
  const isEditMode = mode === "edit";

  useEffect(() => {
    if (createError) {
      toast.error(createError);
    }
  }, [createError]);

  useEffect(() => {
    if (updateError) {
      toast.error(updateError);
    }
  }, [updateError]);

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

    const resolvedDepartureTimezone = departureTimezone || trip.timeZone;
    const resolvedArrivalTimezone = arrivalTimezone || trip.timeZone;

    if (!resolvedDepartureTimezone || !resolvedArrivalTimezone) {
      toast.error("Timezone is required");
      return;
    }

    if (!departureDate || !arrivalDate) {
      toast.error("Date is required");
      return;
    }

    const sharedFields = {
      carrierName: formData.carrierName,
      departureLocation: formData.departureLocation,
      arrivalLocation: formData.arrivalLocation,
      departureMemo: formData.departureMemo,
      arrivalMemo: formData.arrivalMemo,
      bookingReference: formData.bookingReference,
      departureTimezone: resolvedDepartureTimezone,
      arrivalTimezone: resolvedArrivalTimezone,
      departureDate: toDateOnly(departureDate),
      departureTime,
      arrivalDate: toDateOnly(arrivalDate),
      arrivalTime,
      departureGooglePlaceId: formData.departureGooglePlaceId,
      departureGoogleData: formData.departureGoogleData,
      arrivalGooglePlaceId: formData.arrivalGooglePlaceId,
      arrivalGoogleData: formData.arrivalGoogleData,
    };

    if (isEditMode) {
      if (!targetId) {
        toast.error("Transport ID is missing");
        return;
      }

      const updatePayload: UpdateTransportParams = {
        id: targetId,
        ...sharedFields,
      };

      const updated = await updateTransport(updatePayload);

      if (updated) {
        toast.success("Transport updated");
        onSuccess?.(updated);
        onClose();
      }
      return;
    }

    const payload = {
      tripId: trip.id,
      ...sharedFields,
    } as CreateTransportPayload;
    setDepartureDate;
    const transport = await createTransport(payload);

    if (transport) {
      toast.success("Transport saved");
      onSuccess?.(transport);
      onClose();
    }
  };

  const submitting = isEditMode ? isUpdating : isSubmitting;

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
          disabled={!isValid || submitting}
        >
          {submitting
            ? isEditMode
              ? "Updating..."
              : "Saving..."
            : isEditMode
              ? "Update Transport"
              : "Add Transport"}
        </Button>
      </form>
    </div>
  );
}
