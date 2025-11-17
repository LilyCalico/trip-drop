import { format, isWithinInterval, parseISO, startOfDay } from "date-fns";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import TripNavigation from "@/components/custom/layout/TripNavigation";
import { useCurrentTrip } from "@/hooks/trips/useCurrentTrip";

export default function LayoutTrip({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { date } = router.query as { date?: string };
  const trip = useCurrentTrip();
  const [isOpen, setIsOpen] = useState(false);
  const tripTitle = trip?.title;

  // dateが存在しない場合のデフォルト日付を計算
  const defaultDate = useMemo(() => {
    if (!trip?.startAt || !trip?.endAt) {
      return null;
    }
    const today = startOfDay(new Date());
    const startDate = startOfDay(parseISO(trip.startAt));
    const endDate = startOfDay(parseISO(trip.endAt));

    if (isWithinInterval(today, { start: startDate, end: endDate })) {
      // 期間内なら当日の日付
      return format(today, "yyyy-MM-dd");
    }
    // 期間外なら初日
    return format(startDate, "yyyy-MM-dd");
  }, [trip?.startAt, trip?.endAt]);

  // 実際に使用する日付（dateが存在しない場合はdefaultDateを使用）
  const effectiveDate = date || defaultDate;

  // パスに応じた表示テキストを決定
  const displayText = useMemo(() => {
    const pathname = router.pathname;
    if (pathname === "/trips/[tripId]/transport") {
      return "Transport";
    }
    if (pathname === "/trips/[tripId]/hotel") {
      return "Hotel";
    }
    if (pathname === "/trips/[tripId]/setting") {
      return "Setting";
    }
    // それ以外は日付を表示
    return effectiveDate ? format(parseISO(effectiveDate), "MMM d EEE") : "";
  }, [router.pathname, effectiveDate]);

  const handleMenuClick = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="hidden lg:block">
      <div className="flex gap-[3.2rem]">
        {/* Schedule, Transport, Hotel, Setting */}
        <TripNavigation isOpen={isOpen} onClose={handleMenuClick} />

        {/* Trip Detail */}
        <div className="w-full">
          <div className="font-family-figtree mt-[2.4rem] mb-[4.8rem] w-full pl-[3.2rem]">
            <p className="text-[2.4rem] font-semibold mb-[0.8rem]">
              {displayText}
            </p>
            <p className="text-[1.2rem]">{tripTitle ?? ""}</p>
          </div>
          <div className="ml-[3.2rem]">{children}</div>
        </div>
      </div>
    </div>
  );
}
