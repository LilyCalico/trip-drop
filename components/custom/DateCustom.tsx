import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@radix-ui/react-popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { Label } from "../ui/label";

interface DateCustomProps {
  label: string;
  labelClassName?: string;
  htmlFor: string;
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
}

export default function DateCustom({
  label,
  labelClassName,
  htmlFor,
  date,
  setDate,
}: DateCustomProps) {
  return (
    <div>
      <div className="space-y-2">
        <Label htmlFor={htmlFor} className={labelClassName}>
          {label}
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              className={cn(
                "text-[1.2rem] py-[1.5rem] justify-start text-left font-normal rounded-md border border-gray-light min-w-[16rem]",
                !date && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="mr-2 !h-5 !w-5 text-black " />
              {date ? format(date, "PPP") : "Pick a date"}
              {/* Pick a date */}
            </Button>
          </PopoverTrigger>

          <PopoverContent className="w-auto p-0 z-[100]">
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
  );
}
