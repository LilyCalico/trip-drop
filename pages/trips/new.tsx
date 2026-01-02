import { format } from "date-fns";
import { useRouter } from "next/router";
import { useState } from "react";
import { FaAngleDown, FaRegStar, FaSliders } from "react-icons/fa6";
import DateCustom from "@/components/custom/DateCustom";
import InputPassword from "@/components/custom/InputPassword";
import TimeZone from "@/components/custom/trip/TimeZone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useCreateTrip from "@/hooks/trips/useCreateTrip";
import { createUtcDateTimeForDB } from "@/lib/functions/createUtcDateTime";
import { useAuthStore } from "@/store/useAuthStore";

export default function NewTripPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authLoading = useAuthStore((s) => s.loading);
  const { createTrip, creating, error: createTripError } = useCreateTrip();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [numOfPeople, setnumOfPeople] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [timezone, setTimezone] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isAdditionalInfoExpanded, setIsAdditionalInfoExpanded] =
    useState(false);

  const isFormValid =
    title.trim() &&
    Boolean(startDate) &&
    Boolean(endDate) &&
    timezone &&
    password &&
    password.length >= 8 &&
    password.length <= 30;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setSubmitError("");
    const startDateString = startDate ? format(startDate, "yyyy-MM-dd") : null;
    const endDateString = endDate ? format(endDate, "yyyy-MM-dd") : null;

    const startAt = startDateString
      ? createUtcDateTimeForDB({
          selectedDate: startDateString,
          selectedTimezone: timezone
        })
      : null;
    const endAt = endDateString
      ? createUtcDateTimeForDB({
          selectedDate: endDateString,
          selectedTimezone: timezone
        })
      : null;

    if (!startAt || !endAt) {
      setSubmitError("Start and end dates are required.");
      return;
    }

    const requestBody = {
      title: title.trim(),
      description: description.trim(),
      startAt,
      endAt,
      timezone,
      numOfPeople: numOfPeople ? parseInt(numOfPeople, 10) : null,
      password: password.trim()
    };

    try {
      const result = await createTrip(requestBody);

      if (result.success && result.tripId) {
        router.push(`/trips/${result.tripId}/schedule`);
        return;
      }

      const message =
        result.message ??
        createTripError ??
        "Failed to create trip. Please try again.";
      setSubmitError(message);
    } catch (err) {
      console.error("Unexpected error submitting trip:", err);
      setSubmitError(
        err instanceof Error ? err.message : "Unknown error occurred."
      );
    }
  };

  if (authLoading || !isAuthenticated) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-[45rem] mx-auto px-[2.4rem]">
      <h1 className="text-pagetitle mb-[3.2rem] mt-[2.4rem]">
        Create New Trip
      </h1>

      <form onSubmit={handleSubmit} className="space-y-[2.4rem]">
        {/* Title */}
        <div className="space-y-2">
          <h3 className="font-bold text-[1rem] mb-[1.6rem] flex items-center gap-2">
            <FaRegStar />
            <span>REQUIRED INFORMATION</span>
          </h3>
          <Label htmlFor="title">Journey Title *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-[1.6rem]"
            required
          />
        </div>

        {/* Date Range */}
        <div>
          <div className="grid grid-cols-2 gap-2">
            {/* Start Date */}
            <DateCustom
              label="From *"
              date={startDate}
              setDate={setStartDate}
              htmlFor="startDate"
            />

            {/* End Date */}
            <DateCustom
              label="Until *"
              date={endDate}
              setDate={setEndDate}
              htmlFor="endDate"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="password">Journey Password</Label>
            <span className="text-[1.1rem] text-gray-500">
              * (8 - 30 characters)
            </span>
          </div>
          <InputPassword
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>

        {/* Error Message */}
        {(submitError || createTripError) && (
          <div className="mt-4">
            <p className="text-red-500">{submitError || createTripError}</p>
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsAdditionalInfoExpanded(!isAdditionalInfoExpanded)}
          className="font-bold text-[1rem] mb-[1.6rem] mt-[6rem] flex items-center gap-2 w-full text-left cursor-pointer hover:opacity-80 transition-opacity duration-200"
        >
          <FaSliders />
          <span>ADDITIONAL INFORMATION</span>
          <FaAngleDown
            className={`transition-transform duration-300 ${
              isAdditionalInfoExpanded ? "rotate-180" : ""
            }`}
          />
        </button>
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isAdditionalInfoExpanded
              ? "max-h-[1000px] opacity-100"
              : "max-h-0 opacity-0"
          }`}
        >
          <div className="space-y-[2.4rem]">
            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Journey Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Timezone */}
            <TimeZone timezone={timezone} setTimezone={setTimezone} />

            {/* Number of People */}
            <div className="space-y-2">
              <Label htmlFor="num-people">Number of People</Label>
              <Input
                id="num-people"
                type="number"
                min="1"
                value={numOfPeople}
                onChange={(e) => setnumOfPeople(e.target.value)}
                placeholder="1"
                className="max-w-[10rem]"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={!isFormValid || creating || passwordError !== ""}
          className="bg-black text-white w-full mt-[3.2rem] text-[1.2rem] py-[1.6rem] hover:bg-black/80 cursor-pointer"
        >
          {creating ? "Creating..." : "Create Trip"}
        </Button>
      </form>
    </div>
  );
}
