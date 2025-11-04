import { format, parseISO } from "date-fns";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface HeaderDateProps {
  category?: "schedule" | "hotel" | "transport";
  date?: string;
  dayLabel?: string;
  locationLabel?: string;
  backgroundSrc?: string;
  className?: string;
}

const TitleSchedule = ({
  dayLabel,
  formattedDate,
  locationLabel,
}: {
  dayLabel?: string;
  formattedDate: string;
  locationLabel?: string;
}) => {
  return (
    <div className="relative text-center h-full flex flex-col justify-center">
      {dayLabel ? (
        <p className="text-[1.4rem] font-bold uppercase mb-[0.8rem]">
          {dayLabel}
        </p>
      ) : null}
      {formattedDate ? (
        <p className="text-[1.8rem] font-bold tracking-[0.2rem]">
          {formattedDate}
        </p>
      ) : null}
      {locationLabel ? (
        <p className="mt-[0.8rem] text-[1.2rem]">{locationLabel}</p>
      ) : null}
    </div>
  );
};

const TitleCategory = ({ category }: { category: "hotel" | "transport" }) => {
  return (
    <div className="relative h-full flex flex-col justify-end text-right p-[1.6rem]">
      <p className="text-[1.8rem] font-bold tracking-[0.2rem]">
        {category === "hotel" ? "Hotels" : "Transports"}
      </p>
    </div>
  );
};

const HeaderDate = ({
  category = "schedule",
  date,
  dayLabel,
  locationLabel,
  backgroundSrc: backgroundSrcProp,
  className,
}: HeaderDateProps) => {
  const formattedDate = (() => {
    if (!date) return "";
    try {
      return format(parseISO(date), "yyyy/MM/dd (EEE)");
    } catch {
      return date;
    }
  })();

  const backgroundSrc =
    backgroundSrcProp ??
    (category === "schedule"
      ? "/img/bgimg/bgimg-date.png"
      : category === "hotel"
        ? "/img/bgimg/bgimg-hotel.png"
        : "/img/bgimg/bgimg-transport.png");

  return (
    <div
      className={cn(
        "max-w-[39.3rem] mx-auto h-[20rem]",
        "relative w-full overflow-hidden rounded-b-[1.2rem] text-white",
        className,
      )}
    >
      <Image
        src={backgroundSrc}
        alt="Header Date background"
        fill
        priority
        sizes="(min-width: 768px) 768px, 100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-black/20" />

      {category === "schedule" ? (
        <TitleSchedule
          dayLabel={dayLabel}
          formattedDate={formattedDate}
          locationLabel={locationLabel}
        />
      ) : (
        <TitleCategory category={category} />
      )}
    </div>
  );
};

export default HeaderDate;
