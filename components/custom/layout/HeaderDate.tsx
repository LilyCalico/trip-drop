import { format, parseISO } from "date-fns";
import Image from "next/image";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface HeaderDateProps {
  date: string;
  dayLabel: string;
  locationLabel: string;
  backgroundSrc?: string;
  className?: string;
}

const HeaderDate = ({
  date,
  dayLabel,
  locationLabel,
  backgroundSrc = "/img/bgimg/bgimg-date.png",
  className,
}: HeaderDateProps) => {
  const formattedDate = useMemo(() => {
    if (!date) return "";
    try {
      return format(parseISO(date), "yyyy/MM/dd (EEE)");
    } catch {
      return date;
    }
  }, [date]);

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

      <div className="relative text-center h-full flex flex-col justify-center">
        <div>
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
      </div>
    </div>
  );
};

export default HeaderDate;
