import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface ScheduleDateDotsProps {
  dates: string[];
  currentDate: string;
  onSelect: (date: string) => void;
}

export default function ScheduleDateDots({
  dates,
  currentDate,
  onSelect,
}: ScheduleDateDotsProps) {
  if (dates.length === 0) {
    return null;
  }

  return (
    <div className="flex justify-center gap-[0.8rem] mt-[1.6rem]">
      {dates.map((date, index) => {
        const isCurrent = date === currentDate;

        const label = (() => {
          try {
            return format(parseISO(date), "MM/dd");
          } catch {
            return date;
          }
        })();

        return (
          <button
            key={date}
            type="button"
            onClick={() => {
              onSelect(date);
            }}
            className={cn(
              "cursor-pointer h-[0.6rem] w-[0.6rem] rounded-full transition-transform duration-200",
              isCurrent ? "bg-black/80" : "bg-gray-300 hover:bg-gray-400",
            )}
            aria-label={`Day ${index + 1} (${label})`}
            aria-current={isCurrent ? "date" : undefined}
          />
        );
      })}
    </div>
  );
}
