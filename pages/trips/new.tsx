import { useRouter } from "next/router";
import { useState } from "react";
import DateCustom from "@/components/custom/DateCustom";
import { Input } from "@/components/custom/Input";
import InputPassword from "@/components/custom/InputPassword";
import PageWrapper from "@/components/custom/PageWrapper";
import TimeZone from "@/components/custom/trip/TimeZone";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function NewTripPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [numPeople, setNumPeople] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const [timezone, setTimezone] = useState("");

  const isFormValid =
    title.trim() &&
    startDate &&
    endDate &&
    timezone &&
    password &&
    password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    try {
      console.log(
        "title: ",
        title,
        "description: ",
        description,
        "startDate: ",
        startDate,
        "endDate: ",
        endDate,
        "timezone: ",
        timezone,
        "numPeople: ",
        numPeople,
        "password: ",
        password
      );
      // const response = await fetch("/api/trip", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json"
      //   },
      //   body: JSON.stringify({
      //     title: title.trim(),
      //     description: description.trim(),
      //     startAt: startDate?.toISOString(),
      //     endAt: endDate?.toISOString(),
      //     timezone,
      //     numPeople: numPeople ? parseInt(numPeople) : undefined,
      //     password: password.trim() || undefined
      //   })
      // });

      // if (response.ok) {
      //   const data = await response.json();
      //   router.push(`/trips/${data.tripId}`);
      // } else {
      //   console.error("Failed to create trip");
      // }
    } catch (error) {
      console.error("Error creating trip:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      <h1 className="text-pagetitle mb-[3.2rem]">Create New Trip</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter trip title"
            required
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter trip description"
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
            />

            {/* End Date */}
            <DateCustom label="Until *" date={endDate} setDate={setEndDate} />
          </div>
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
            value={numPeople}
            onChange={(e) => setNumPeople(e.target.value)}
            placeholder="Enter number of people"
          />
        </div>

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="password">Password *</Label>
          <InputPassword
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
          />
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password *</Label>
          <InputPassword
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (password && e.target.value && password !== e.target.value) {
                setPasswordError("Passwords do not match");
              } else {
                setPasswordError("");
              }
            }}
            placeholder="Confirm password"
            aria-invalid={Boolean(passwordError)}
          />
          {passwordError && (
            <p className="text-red-500 text-sm mt-1">{passwordError}</p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={!isFormValid || loading}
          className="bg-black text-white w-full mt-[3.2rem] text-[1.2rem] py-[1.6rem] hover:bg-black/80 cursor-pointer"
        >
          {loading ? "Creating..." : "Create Trip"}
        </Button>
      </form>
    </PageWrapper>
  );
}
