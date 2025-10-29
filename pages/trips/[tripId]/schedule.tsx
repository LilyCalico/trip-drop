import { useRouter } from "next/router";
import { useMemo } from "react";
import { useCurrentTrip } from "@/hooks/trips/useCurrentTrip";

export default function TripSchedulePage() {
  const { query } = useRouter();
  // 必要があればcurrentTripを更新
  useCurrentTrip();

  const dateStr = useMemo(() => {
    return typeof query.date === "string" ? query.date : "";
  }, [query.date]);

  return (
    <div>
      <h1 className="text-[1.6rem] font-bold text-center">{dateStr}</h1>
    </div>
  );
}
