import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@radix-ui/react-popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { Label } from "../ui/label";

interface DateCustomProps {
  label: string;
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
}

export default function DateCustom({ label, date, setDate }: DateCustomProps) {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  return (
    <div>
      <div className="grid grid-cols-2 gap-4 d">
        <div className="space-y-2">
          <Label htmlFor="start-date">{label}</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                className={cn(
                  "py-[1.5rem] justify-start text-left font-normal rounded-md text-[1rem] border border-gray-light min-w-[16rem]",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 !h-5 !w-5 text-black" />
                {date ? format(date, "PPP") : "Pick a date"}
                {/* Pick a date */}
              </Button>
            </PopoverTrigger>

            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="bg-white"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
