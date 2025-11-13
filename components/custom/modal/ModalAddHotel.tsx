import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import Button from "@/components/custom/button/Button";
import DatePulldown from "@/components/custom/datetime/DatePulldown";
import Time from "@/components/custom/datetime/Time";
import Input from "@/components/custom/Input";
import InputGooglePlaces from "@/components/custom/InputGooglePlaces";
import { Label } from "@/components/ui/label";
import { useGooglePlaceDetails } from "@/hooks/google/useGooglePlaceDetails";
import type { GooglePlaceCandidate } from "@/hooks/google/useGooglePlacesPredictions";
import { useCreateHotel } from "@/hooks/hotels/useCreateHotel";
import { useUpdateHotel } from "@/hooks/hotels/useUpdateHotel";
import { useCurrentTrip } from "@/hooks/trips/useCurrentTrip";
import {
  extractLocalDateTimeParts as convertUtcToLocalParts,
  extractLocalDateTimeParts,
} from "@/lib/functions/convertUtcToLocalParts";
import { toZonedIsoString } from "@/lib/toZonedIsoString";
import type { Tables } from "@/types/supabasetype";

type HotelStayRow = Tables<"hotel_stays">;

export interface HotelInitialValues {
  name?: string | null;
  address?: string | null;
  phone?: string | null;
  notes?: string | null;
  bookingReference?: string | null;
  googlePlaceId?: string | null;
  googleData?: GooglePlaceCandidate | null;
  checkinUtc?: string | null;
  checkoutUtc?: string | null;
  timezone?: string | null;
}

interface ModalAddHotelProps {
  onClose: () => void;
  defaultDate?: string;
  mode: "create" | "edit";
  targetId?: string;
  initialValues?: HotelInitialValues;
  onSuccess?: (stay: HotelStayRow) => void;
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

export default function ModalAddHotel({
  onClose,
  defaultDate,
  mode,
  targetId,
  initialValues,
  onSuccess,
}: ModalAddHotelProps) {
  const trip = useCurrentTrip();
  const { getDetails } = useGooglePlaceDetails();
  const { createHotel, isSubmitting } = useCreateHotel();
  const { updateHotel, isUpdating } = useUpdateHotel();

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

  // checkin / checkout の初期値計算
  const initialDateTimeParts = useMemo(() => {
    if (mode === "edit" && initialValues) {
      return {
        checkin: convertUtcToLocalParts({
          datetimeUtc: initialValues.checkinUtc,
          timezone: initialValues.timezone,
        }),
        checkout: convertUtcToLocalParts({
          datetimeUtc: initialValues.checkoutUtc,
          timezone: initialValues.timezone,
        }),
      };
    }
    return { checkin: null, checkout: null };
  }, [mode, initialValues]);

  const [checkinDate, setCheckinDate] = useState<string>(
    initialDateTimeParts.checkin?.date ?? "",
  );
  const [checkinTime, setCheckinTime] = useState<string>(
    initialDateTimeParts.checkin?.time ?? "00:00",
  );
  const [checkoutDate, setCheckoutDate] = useState<string>(
    initialDateTimeParts.checkout?.date ?? "",
  );
  const [checkoutTime, setCheckoutTime] = useState<string>(
    initialDateTimeParts.checkout?.time ?? "00:00",
  );
  const [timezone, setTimezone] = useState<string>(
    mode === "edit" ? (initialValues?.timezone ?? "") : "",
  );

  const isEditMode = mode === "edit";
  const initializedRef = useRef<string | undefined>(undefined);
  const previousModeRef = useRef<"create" | "edit">(mode);

  // 旅程の初日と最終日を初期値に
  useEffect(() => {
    if (!trip) return;

    // モードが変更された場合は初期化をリセット
    if (previousModeRef.current !== mode) {
      initializedRef.current = undefined;
      previousModeRef.current = mode;
    }

    if (isEditMode && initialValues) {
      // 編集モードの初期化: targetIdが変更された場合のみ実行
      if (initializedRef.current === targetId) return;
      initializedRef.current = targetId;

      setFormData((prev) => ({
        ...prev,
        name: initialValues.name ?? prev.name,
        address: initialValues.address ?? prev.address,
        phone: initialValues.phone ?? prev.phone,
        notes: initialValues.notes ?? prev.notes,
        bookingReference:
          initialValues.bookingReference ?? prev.bookingReference,
        googlePlaceId: initialValues.googlePlaceId ?? prev.googlePlaceId,
        googleData: initialValues.googleData ?? prev.googleData,
      }));

      const timezoneToUse = initialValues.timezone ?? trip.timeZone ?? timezone;
      setTimezone(timezoneToUse ?? "");

      const checkinParts = extractLocalDateTimeParts({
        datetimeUtc: initialValues.checkinUtc,
        timezone: timezoneToUse,
      });

      if (checkinParts) {
        setCheckinDate(checkinParts.date);
        setCheckinTime(checkinParts.time);
      }

      const checkoutParts = extractLocalDateTimeParts({
        datetimeUtc: initialValues.checkoutUtc,
        timezone: timezoneToUse,
      });

      if (checkoutParts) {
        setCheckoutDate(checkoutParts.date);
        setCheckoutTime(checkoutParts.time);
      }

      return;
    }

    // 作成モードの初期化: 一度だけ実行
    if (initializedRef.current !== undefined) return;
    initializedRef.current = undefined;

    if (!checkinDate) {
      const zonedCheckin = toZonedIsoString(
        defaultDate ?? trip.startAt,
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

    if (!timezone) {
      setTimezone(trip.timeZone ?? "");
    }
  }, [
    trip,
    defaultDate,
    initialValues,
    isEditMode,
    mode,
    targetId,
    timezone,
    checkinDate,
    checkoutDate,
  ]);

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
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
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
      timezone: timezone || trip.timeZone,
    };

    if (isEditMode) {
      if (!targetId) {
        toast.error("Target hotel id not provided");
        return;
      }

      const result = await updateHotel({
        id: targetId,
        ...payload,
      });

      if (result.success) {
        toast.success("Hotel updated successfully!");
        onSuccess?.(result.data);
        onClose();
      } else {
        toast.error(result.error);
      }
      return;
    }

    const result = await createHotel(payload);
    if (result) {
      toast.success("Hotel added successfully!");
      onSuccess?.(result.stay);
      onClose();
    } else {
      toast.error("Failed to add hotel. Please try again.");
    }
  };

  const submitting = useMemo(
    () => (isEditMode ? isUpdating : isSubmitting),
    [isEditMode, isSubmitting, isUpdating],
  );

  if (!trip) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-[1.6rem]">
        {/* Name */}
        <InputGooglePlaces
          id="hotel-name"
          label="Name"
          required
          value={formData.name}
          onValueChange={handleNameChange}
          onCandidateSelect={handleCandidateSelect}
          placeholder=""
        />

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
          disabled={!isValid || submitting}
        >
          {submitting
            ? isEditMode
              ? "Updating..."
              : "Adding..."
            : isEditMode
              ? "Update Hotel"
              : "Add Hotel"}
        </Button>
      </form>
    </div>
  );
}
