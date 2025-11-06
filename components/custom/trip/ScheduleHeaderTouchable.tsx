import type { PointerEvent as ReactPointerEvent } from "react";
import { useCallback, useMemo, useRef } from "react";
import PageHeader from "@/components/custom/layout/PageHeader";
import ScheduleDateDots from "@/components/custom/trip/ScheduleDateDots";

interface HeaderContent {
  date: string;
  dayLabel: string;
  locationLabel: string;
}

interface NavigationConfig {
  dates: string[];
  currentDate: string;
  onSelect: (date: string) => void;
}

interface ScheduleHeaderTouchableProps {
  header: HeaderContent;
  navigation: NavigationConfig;
  navigateToDate: (date: string | null) => void;
  currentIndex: number;
  availableDates: string[];
}

export default function ScheduleHeaderTouchable({
  header,
  navigation,
  navigateToDate,
  currentIndex,
  availableDates,
}: ScheduleHeaderTouchableProps) {
  const swipeStartXRef = useRef<number | null>(null);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      swipeStartXRef.current = event.clientX;
    },
    [],
  );
  const handlePointerCancel = useCallback(() => {
    swipeStartXRef.current = null;
  }, []);

  const previousDate = useMemo(() => {
    if (currentIndex <= 0) return null;
    return availableDates[currentIndex - 1];
  }, [availableDates, currentIndex]);

  const nextDate = useMemo(() => {
    if (currentIndex === -1 || currentIndex >= availableDates.length - 1) {
      return null;
    }
    return availableDates[currentIndex + 1];
  }, [availableDates, currentIndex]);

  const handlePointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const startX = swipeStartXRef.current;
      swipeStartXRef.current = null;

      if (startX === null) return;

      const deltaX = event.clientX - startX;
      const threshold = 50;
      if (Math.abs(deltaX) < threshold) return;

      if (deltaX < 0) {
        navigateToDate(nextDate);
      } else {
        navigateToDate(previousDate);
      }
    },
    [navigateToDate, nextDate, previousDate],
  );
  return (
    <>
      <div
        className="touch-pan-y"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onPointerLeave={handlePointerCancel}
        role="presentation"
      >
        <PageHeader
          date={header.date}
          dayLabel={header.dayLabel}
          locationLabel={header.locationLabel}
        />
      </div>

      <ScheduleDateDots
        dates={navigation.dates}
        currentDate={navigation.currentDate}
        onSelect={navigation.onSelect}
      />
    </>
  );
}
