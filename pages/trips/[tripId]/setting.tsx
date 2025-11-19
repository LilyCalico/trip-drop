import { eachDayOfInterval, format, parseISO } from "date-fns";
import { useRouter } from "next/router";
import { useState } from "react";
import ButtonAdd from "@/components/custom/button/ButtonAdd";
import ButtonSchedule from "@/components/custom/button/ButtonSchedule";
import LayoutTrip from "@/components/custom/layout/LayoutTrip";
import ModalAdd from "@/components/custom/modal/ModalAdd";
import Spinner from "@/components/custom/Spinner";
import TripDetail from "@/components/custom/trip/TripDetail";
import { useCurrentTrip } from "@/hooks/trips/useCurrentTrip";
import { cn } from "@/lib/utils";
import { useTripsStore } from "@/store/useTripsStore";

const Title = ({ title }: { title: string }) => {
  return (
    <h1 className="text-[1.6rem] font-bold text-center tracking-[0.2em]">
      {title}
    </h1>
  );
};

const Wrapper = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return <div className={cn("pt-[3.2rem]", className)}>{children}</div>;
};

export default function TripDetailPage() {
  const router = useRouter();
  const trip = useCurrentTrip();
  const { loading } = useTripsStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"spot" | "hotel" | "transport">(
    "spot",
  );

  const openModal = (type: "spot" | "hotel" | "transport") => {
    setModalType(type);
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setModalType("spot");
  };

  if (loading) {
    return <Spinner />;
  }

  console.log("trip", trip);

  if (!loading && trip) {
    const scheduleDates = eachDayOfInterval({
      start: parseISO(trip.startAt),
      end: parseISO(trip.endAt),
    });

    return (
      <LayoutTrip>
        <div className="lg:max-w-[70rem] lg:mx-auto">
          {/* Detail */}
          <div className="my-[3.2rem]">
            <TripDetail
              tripId={trip.id}
              title={trip.title}
              description={trip.description}
              startAt={trip.startAt}
              endAt={trip.endAt}
              numberOfMembers={trip.numberOfMembers ?? 1}
            />
          </div>

          {/* SCHEDULE DATE LIST */}
          {/* <Wrapper className="bg-section px-[2.4rem]">
            <Title title="SCHEDULE" />
            <div className="py-[2.4rem] flex gap-[0.4rem] w-full overflow-x-scroll">
              {scheduleDates.map((date) => (
                <ButtonSchedule
                  key={date.toISOString()}
                  date={date}
                  onClick={() => {
                    const yyyyMmDd = format(date, "yyyy-MM-dd");
                    router.push(`/trips/${trip.id}/schedule?date=${yyyyMmDd}`);
                  }}
                />
              ))}
            </div>
          </Wrapper> */}

          {/* ADD BUTTONS */}
          <Wrapper className="">
            <Title title="ADD" />
            <div className="flex gap-[1.2rem] justify-center my-[2.4rem] pb-[3.2rem]">
              <ButtonAdd type="spot" onClick={() => openModal("spot")} />
              <ButtonAdd type="hotel" onClick={() => openModal("hotel")} />
              <ButtonAdd
                type="transport"
                onClick={() => openModal("transport")}
              />
            </div>
          </Wrapper>

          {/* Modal to add spot, hotel, or transport */}
          <ModalAdd isOpen={modalOpen} onClose={closeModal} type={modalType} />
        </div>
      </LayoutTrip>
    );
  }

  return <div>Trip not found</div>;
}
