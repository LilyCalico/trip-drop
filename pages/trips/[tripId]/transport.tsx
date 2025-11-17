import { Plus } from "lucide-react";
import { useState } from "react";
import Button from "@/components/custom/button/Button";
import CardTransport from "@/components/custom/cards/CardTransport";
import LayoutTrip from "@/components/custom/layout/LayoutTrip";
import HeaderDate from "@/components/custom/layout/PageHeader";
import ModalAdd from "@/components/custom/modal/ModalAdd";
import Spinner from "@/components/custom/Spinner";
import { useTripTransports } from "@/hooks/transports/useTripTransports";
import { useCurrentTrip } from "@/hooks/trips/useCurrentTrip";

export default function TransportPage() {
  const trip = useCurrentTrip();
  const [modalOpen, setModalOpen] = useState(false);
  const { transports, isLoading, error } = useTripTransports({
    tripId: trip?.id,
  });

  if (isLoading) {
    return <Spinner />;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!transports) {
    return <div>No transports found</div>;
  }

  return (
    <LayoutTrip>
      <HeaderDate category="transport" />
      <div className="w-[34.5rem] pt-[3.2rem] mx-auto">
        {transports?.map((transport) => (
          <CardTransport key={transport.id} {...transport} />
        ))}

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
        type={"transport"}
      />
    </LayoutTrip>
  );
}
