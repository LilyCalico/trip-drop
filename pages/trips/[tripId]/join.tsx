import { useRouter } from "next/router";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import Button from "@/components/custom/button/Button";
import InputPassword from "@/components/custom/InputPassword";
import Spinner from "@/components/custom/Spinner";
import { useJoinTrip } from "@/hooks/trips/useJoinTrip";
import { useTripsStore } from "@/store/useTripsStore";

export default function JoinPage() {
  const router = useRouter();
  const { tripId } = router.query;
  const [password, setPassword] = useState("");
  const { joinTrip, loading, error } = useJoinTrip();
  const trips = useTripsStore((s) => s.trips);
  const [isMember, setIsMember] = useState<boolean | null>(null);

  // 既に参加している場合はscheduleページにリダイレクト
  useEffect(() => {
    if (!tripId || typeof tripId !== "string") {
      return;
    }

    if (!trips) {
      setIsMember(false);
    } else {
      const isMember = trips.some((trip) => trip.id === tripId);
      setIsMember(isMember);
      if (isMember) {
        router.replace(`/trips/${tripId}/schedule`);
      }
    }
  }, [tripId, trips, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!tripId || typeof tripId !== "string") {
      return;
    }

    const success = await joinTrip(tripId, password);
    if (success) {
      router.push(`/trips/${tripId}/schedule`);
    }
  };

  if (isMember === null || loading || isMember) {
    return <Spinner />;
  }

  if (isMember === false)
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <div className="w-full max-w-[40rem] px-[2.4rem]">
          <h1 className="text-[1.8rem] font-semibold text-center mb-[5.6rem]">
            Join Trip
          </h1>

          <form
            onSubmit={handleSubmit}
            className="space-y-[1.6rem] max-w-[24rem] mx-auto mb-[7.2rem]"
          >
            <div>
              <div>
                <label
                  htmlFor="password"
                  className="block text-[1.2rem] mb-[3.2rem] text-center"
                >
                  Please enter the password
                </label>
                <InputPassword
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                {error && (
                  <p className="text-red-500 text-[1.2rem] mt-[0.8rem] leading-[1.6] text-center">
                    {error}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-center mt-[7.2rem]">
              <Button type="submit" disabled={loading || !password}>
                {loading ? "Joining..." : "Join"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
}
