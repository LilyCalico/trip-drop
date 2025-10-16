import { useRouter } from "next/router";
import { useEffect } from "react";
import Spinner from "@/components/custom/Spinner";
import TripDetail from "@/components/custom/trip/TripDetail";
import { useTripsStore } from "@/store/useTripsStore";

export default function TripDetailPage() {
  const router = useRouter();
  const { tripId } = router.query;
  const { tripsState, loading } = useTripsStore();
  const trip = tripsState?.find((trip) => trip.id === tripId);

  if (loading) {
    return <Spinner />;
  }

  if (!loading && trip) {
    return (
      <div>
        <TripDetail
          tripId={trip.id}
          title={trip.title}
          description={trip.description ?? ""}
          startAt={trip.startAt}
          endAt={trip.endAt}
          numberOfMembers={trip.numberOfMembers ?? 1}
        />
      </div>
    );
  }

  return <div>Trip not found</div>;
}
