import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@radix-ui/react-popover";
import { format } from "date-fns";
import {
  CalendarIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from "lucide-react";
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
  setDate
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
                "text-[1.4rem] py-[1.8rem] justify-start text-left font-normal rounded-md border border-gray-light min-w-[18rem]",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 !h-6 !w-6 text-black " />
              {date ? format(date, "PPP") : "Pick a date"}
              {/* Pick a date */}
            </Button>
          </PopoverTrigger>

          <PopoverContent className="w-auto p-0 z-[100]">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="bg-white [--cell-size:2.75rem] p-4"
              classNames={{
                weekday:
                  "text-muted-foreground rounded-md flex-1 font-normal text-[1rem] select-none",
                caption_label: "text-base",
                day: "[&_button]:text-[1.1rem] [&_button:hover]:bg-gray-100"
              }}
              components={{
                Chevron: ({ className, orientation, ...props }) => {
                  if (orientation === "left") {
                    return (
                      <ChevronLeftIcon
                        className={cn("size-5", className)}
                        {...props}
                      />
                    );
                  }
                  if (orientation === "right") {
                    return (
                      <ChevronRightIcon
                        className={cn("size-5", className)}
                        {...props}
                      />
                    );
                  }
                  return (
                    <ChevronDownIcon
                      className={cn("size-5", className)}
                      {...props}
                    />
                  );
                }
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
