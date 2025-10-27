import type { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabasetype";

export interface GetTripDayIdParams {
  supabase: ReturnType<typeof createClient<Database>>;
  tripId: string;
  date: string;
}

async function getTripDayId({
  supabase,
  tripId,
  date,
}: GetTripDayIdParams): Promise<string> {
  const tripIdDayDate = new Date(date).toISOString().split("T")[0];

  // 1. 既存のtrip_dayを検索
  const { data: existingTripDay, error: selectError } = await supabase
    .from("trip_days")
    .select("id")
    .eq("trip_id", tripId)
    .eq("date", tripIdDayDate) // Date形式で比較
    .single();

  if (existingTripDay) {
    return existingTripDay.id;
  }

  // 2. 存在しない場合は作成
  if (selectError && selectError.code === "PGRST116") {
    throw new Error(`Trip day not found for tripId=${tripId} date=${date}`);
  }

  // 3. その他のエラーの場合
  console.error("Error selecting trip_day:", selectError);
  throw new Error(
    `Failed to select trip_day: ${selectError?.message || "Unknown error"}`,
  );
}

export default getTripDayId;
