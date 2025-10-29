import { useRouter } from "next/router";
import { useEffect } from "react";
import { useTripsStore } from "@/store/useTripsStore";

export const useCurrentTrip = () => {
  const router = useRouter();
  const { tripId } = router.query as { tripId?: string };
  const { trips, currentTrip, setCurrentTrip } = useTripsStore();

  useEffect(() => {
    if (!tripId || !trips) return;

    // currentTripが未設定または異なるtripIdの場合にセット
    if (!currentTrip || currentTrip.id !== tripId) {
      const foundTrip = trips.find((trip) => trip.id === tripId);
      setCurrentTrip(foundTrip || null);
    }
  }, [tripId, trips, currentTrip, setCurrentTrip]);

  return currentTrip;
};
