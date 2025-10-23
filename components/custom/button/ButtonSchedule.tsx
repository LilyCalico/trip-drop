import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function ButtonSchedule({
  date,
  onClick,
}: {
  date: Date;
  onClick: () => void;
}) {
  const day = format(date, "dd");
  const dayOfWeek = format(date, "EEEE").slice(0, 3);

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white",
        "rounded-[0.8rem]",
        "p-[1.2rem]",
        "text-[1.2rem]",
        "min-w-[6.5rem]",
        "text-center",
        "cursor-pointer hover:bg-black/15 transition-all duration-300",
      )}
    >
      <p className="font-extrabold">{dayOfWeek}</p>
      <p>{day}</p>
    </div>
  );
}
