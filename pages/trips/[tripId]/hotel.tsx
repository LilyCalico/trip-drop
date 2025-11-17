import { Plus } from "lucide-react";
import { useCallback, useState } from "react";
import Button from "@/components/custom/button/Button";
import CardHotel from "@/components/custom/cards/CardHotel";
import LayoutTrip from "@/components/custom/layout/LayoutTrip";
import HeaderDate from "@/components/custom/layout/PageHeader";
import ModalAdd from "@/components/custom/modal/ModalAdd";
import Spinner from "@/components/custom/Spinner";
import { useTripHotels } from "@/hooks/hotels/useTripHotels";
import { useCurrentTrip } from "@/hooks/trips/useCurrentTrip";

export default function HotelPage() {
  const trip = useCurrentTrip();
  const [modalOpen, setModalOpen] = useState(false);
  const { hotels, isLoading, error, mutate } = useTripHotels({
    tripId: trip?.id,
  });

  const handleHotelDeleted = useCallback(
    (deletedId: string) => {
      void mutate((current) => {
        if (!current) {
          return current;
        }

        return current.filter((hotel) => hotel.id !== deletedId);
      }, true);
    },
    [mutate],
  );

  const handleHotelUpdated = useCallback(() => {
    void mutate();
  }, [mutate]);

  if (isLoading || !trip?.id) {
    return <Spinner />;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  let content = null;

  if (!hotels) {
    content = (
      <div className="text-center my-[2.4rem] font-bold">
        <p>No Hotels Found</p>
      </div>
    );
  } else {
    content = hotels?.map((hotel) => (
      <CardHotel
        key={hotel.id}
        id={hotel.id}
        name={hotel.name}
        address={hotel.address}
        phone={hotel.phone}
        notes={hotel.notes}
        bookingReference={hotel.bookingReference}
        datetimeUtc={hotel.checkInAt}
        timezone={hotel.timezone}
        googlePlaceId={hotel.googlePlaceId}
        checkInUtc={hotel.checkInAt}
        checkOutUtc={hotel.checkOutAt}
        check="in"
        onDeleted={(targetId) => {
          handleHotelDeleted(targetId);
        }}
        onUpdated={handleHotelUpdated}
      />
    ));
  }

  return (
    <LayoutTrip>
      <HeaderDate category="hotel" />
      <div className="w-[34.5rem] pt-[3.2rem] mx-auto">
        {content}
        <Button
          className="flex items-center gap-[0.8rem] w-full mt-[3.2rem]"
          onClick={() => {
            setModalOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Add Items
        </Button>
      </div>

      <ModalAdd
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        type={"hotel"}
      />
    </LayoutTrip>
  );
}
