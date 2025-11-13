import { createClient } from "@supabase/supabase-js";
import type { NextApiRequest, NextApiResponse } from "next";
import { extractLocalDateTimeParts } from "@/lib/functions/convertUtcToLocalParts";
import createDateRangeArray from "@/lib/functions/createDateRangeArray";
import { createUtcDateTimeForDB } from "@/lib/functions/createUtcDateTime";
import type { Database } from "@/types/supabasetype";
import getTripDayId from "../lib/getTripDayId";

type ErrorBody = { error: string; details?: string; code?: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<
    Database["public"]["Tables"]["hotel_stays"]["Row"] | ErrorBody
  >,
) {
  const queryId = req.query.hotelId;
  const hotelId = Array.isArray(queryId) ? queryId[0] : queryId;

  if (!hotelId) {
    return res.status(400).json({ error: "Hotel ID is required" });
  }

  if (!["GET", "PATCH", "DELETE"].includes(req.method ?? "")) {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ error: "Missing Authorization Bearer token" });
    }

    const accessToken = authHeader.replace("Bearer ", "");

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

    if (!supabaseUrl || !supabaseAnonKey) {
      return res.status(500).json({ error: "Supabase env not configured" });
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userRes, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userRes?.user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // GET
    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("hotel_stays")
        .select()
        .eq("id", hotelId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return res.status(404).json({ error: "Hotel not found" });
        }

        console.error("Supabase error fetching hotel stay:", error);
        return res.status(400).json({
          error: "Failed to fetch hotel stay",
          details: error.message,
          code: error.code,
        });
      }

      if (!data) {
        return res.status(404).json({ error: "Hotel not found" });
      }

      return res.status(200).json(data);
    }

    // PATCH
    if (req.method === "PATCH") {
      const body = req.body as Partial<{
        name?: string;
        address?: string | null;
        phone?: string | null;
        notes?: string | null;
        bookingReference?: string | null;
        googlePlaceId?: string | null;
        googleData?: unknown;
        checkin?: string;
        checkout?: string;
      }>;

      const hasName = "name" in body;
      const hasAddress = "address" in body;
      const hasPhone = "phone" in body;
      const hasNotes = "notes" in body;
      const hasBookingReference = "bookingReference" in body;
      const hasGooglePlaceId = "googlePlaceId" in body;
      const hasGoogleData = "googleData" in body;
      const hasCheckin = "checkin" in body;
      const hasCheckout = "checkout" in body;

      const toTrimmedOrNull = (value?: string | null) => {
        if (typeof value !== "string") {
          return null;
        }
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
      };

      const updatePayload: Database["public"]["Tables"]["hotel_stays"]["Update"] =
        {};

      // nameが存在する場合
      if (hasName) {
        if (!body.name || typeof body.name !== "string") {
          return res.status(400).json({ error: "Hotel name is required" });
        }
        const trimmedName = body.name.trim();
        if (!trimmedName) {
          return res.status(400).json({ error: "Hotel name is required" });
        }
        updatePayload.name = trimmedName;
      }

      // addressが存在する場合
      if (hasAddress) {
        updatePayload.address = toTrimmedOrNull(body.address);
      }

      // nameまたはaddressが変更され、googlePlaceId/googleDataがリクエストに含まれていない場合、nullにする
      if ((hasName || hasAddress) && !hasGooglePlaceId && !hasGoogleData) {
        updatePayload.google_place_id = null;
        updatePayload.google_data = null;
        updatePayload.location = null;
      }

      // phoneの処理
      if (hasPhone) {
        updatePayload.phone = toTrimmedOrNull(body.phone);
      }

      // notesの処理
      if (hasNotes) {
        updatePayload.notes = toTrimmedOrNull(body.notes);
      }

      // bookingReferenceの処理
      if (hasBookingReference) {
        updatePayload.booking_reference = toTrimmedOrNull(
          body.bookingReference,
        );
      }

      // googlePlaceIdの処理
      if (hasGooglePlaceId) {
        updatePayload.google_place_id = toTrimmedOrNull(body.googlePlaceId);
      }

      // googleDataの処理
      if (hasGoogleData) {
        updatePayload.google_data = (body.googleData ??
          null) as Database["public"]["Tables"]["hotel_stays"]["Update"]["google_data"];

        // googleDataからlocationを抽出
        if (body.googleData) {
          try {
            const candidate = body.googleData as {
              geometry?: { location?: { lat?: number; lng?: number } };
            };
            const lat = candidate?.geometry?.location?.lat;
            const lng = candidate?.geometry?.location?.lng;
            if (typeof lat === "number" && typeof lng === "number") {
              updatePayload.location = `POINT(${lng} ${lat})`;
            }
          } catch {
            // locationの抽出に失敗した場合は無視
          }
        } else {
          updatePayload.location = null;
        }
      }

      // checkin/checkoutの処理（これらが変更された場合のみ）
      if (hasCheckin || hasCheckout) {
        // 既存のhotel_stayからtrip_idとcheckin/checkoutを取得
        const { data: currentStay, error: currentStayError } = await supabase
          .from("hotel_stays")
          .select("trip_id, check_in_at, check_out_at, timezone")
          .eq("id", hotelId)
          .single();

        if (currentStayError || !currentStay?.trip_id) {
          return res.status(404).json({ error: "Hotel stay not found" });
        }

        const tripIdToUse = currentStay.trip_id;

        const { data: trip, error: tripError } = await supabase
          .from("trips")
          .select("timezone")
          .eq("id", tripIdToUse)
          .single();

        if (tripError || !trip) {
          return res.status(404).json({ error: "Trip not found" });
        }

        // DBから選択されているtripのtimezoneを取得
        const timezoneToUse = trip.timezone;

        // checkinの処理
        let checkinUtc: string | null = null;
        let checkinDatePart: string | null = null;
        let _checkinTimePart: string | null = null;

        // checkinを変更する場合
        if (hasCheckin) {
          if (!body.checkin || typeof body.checkin !== "string") {
            return res.status(400).json({
              error: "checkin must be a valid string",
            });
          }

          const [datePart, timePart] = body.checkin.split("T");
          if (!datePart || !timePart) {
            return res.status(400).json({ error: "Invalid datetime format" });
          }

          checkinDatePart = datePart;
          _checkinTimePart = timePart;

          const utc = createUtcDateTimeForDB({
            selectedDate: datePart,
            selectedTime: timePart,
            selectedTimezone: timezoneToUse,
          });

          if (!utc) {
            return res.status(400).json({ error: "Invalid date conversion" });
          }

          checkinUtc = utc;
        } else {
          // 既存のcheckinを使用
          if (currentStay.check_in_at) {
            checkinUtc = currentStay.check_in_at;
            // UTCからローカル時間に変換して日付部分を取得
            const parts = extractLocalDateTimeParts({
              datetimeUtc: currentStay.check_in_at,
              timezone: timezoneToUse,
            });
            if (parts) {
              checkinDatePart = parts.date;
              _checkinTimePart = parts.time;
            }
          }
        }

        // checkoutの処理
        let checkoutUtc: string | null = null;
        let checkoutDatePart: string | null = null;
        let _checkoutTimePart: string | null = null;

        if (hasCheckout) {
          if (!body.checkout || typeof body.checkout !== "string") {
            return res.status(400).json({
              error: "checkout must be a valid string",
            });
          }

          const [datePart, timePart] = body.checkout.split("T");
          if (!datePart || !timePart) {
            return res.status(400).json({ error: "Invalid datetime format" });
          }

          checkoutDatePart = datePart;
          _checkoutTimePart = timePart;

          const utc = createUtcDateTimeForDB({
            selectedDate: datePart,
            selectedTime: timePart,
            selectedTimezone: timezoneToUse,
          });

          if (!utc) {
            return res.status(400).json({ error: "Invalid date conversion" });
          }

          checkoutUtc = utc;
        } else {
          // 既存のcheckoutを使用
          if (currentStay.check_out_at) {
            checkoutUtc = currentStay.check_out_at;
            // UTCからローカル時間に変換して日付部分を取得
            const parts = extractLocalDateTimeParts({
              datetimeUtc: currentStay.check_out_at,
              timezone: timezoneToUse,
            });
            if (parts) {
              checkoutDatePart = parts.date;
              _checkoutTimePart = parts.time;
            }
          }
        }

        // 整合性チェック：checkin < checkout
        if (checkinUtc && checkoutUtc) {
          const checkinDate = new Date(checkinUtc);
          const checkoutDate = new Date(checkoutUtc);

          if (checkinDate >= checkoutDate) {
            return res.status(400).json({
              error: "checkin must be before checkout",
            });
          }
        }

        if (
          !checkinUtc ||
          !checkoutUtc ||
          !checkinDatePart ||
          !checkoutDatePart
        ) {
          return res.status(400).json({
            error: "checkin and checkout are required",
          });
        }

        if (hasCheckin) {
          updatePayload.check_in_at = checkinUtc;
        }
        if (hasCheckout) {
          updatePayload.check_out_at = checkoutUtc;
        }

        const dateList = createDateRangeArray(
          checkinDatePart,
          checkoutDatePart,
        );
        console.log("🐹dateList", dateList);

        let tripDayIds: string[];
        try {
          tripDayIds = await Promise.all(
            dateList.map((date) =>
              getTripDayId({
                supabase,
                tripId: tripIdToUse,
                date,
              }),
            ),
          );
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          return res.status(400).json({
            error: "Trip day not found",
            details: message,
          });
        }

        // hotel_stay_daysの更新
        const { error: deleteDaysError } = await supabase
          .from("hotel_stay_days")
          .delete()
          .eq("stay_id", hotelId);

        if (deleteDaysError) {
          console.error(
            "Supabase error deleting hotel stay days:",
            deleteDaysError,
          );
          return res.status(400).json({
            error: "Failed to update hotel stay days",
            details: deleteDaysError.message,
            code: deleteDaysError.code,
          });
        }

        if (tripDayIds.length > 0) {
          const stayDayInsertPayload: Database["public"]["Tables"]["hotel_stay_days"]["Insert"][] =
            tripDayIds.map((tripDayId, index) => ({
              stay_id: hotelId,
              trip_day_id: tripDayId,
              stay_date: dateList[index] ?? checkinDatePart,
            }));

          const { error: stayDaysError } = await supabase
            .from("hotel_stay_days")
            .insert(stayDayInsertPayload);

          if (stayDaysError) {
            console.error(
              "Supabase error inserting hotel stay days:",
              stayDaysError,
            );
            return res.status(400).json({
              error: "Failed to update hotel stay days",
              details: stayDaysError.message,
              code: stayDaysError.code,
            });
          }
        }
      }

      // 更新するフィールドがない場合
      if (Object.keys(updatePayload).length === 0) {
        return res.status(400).json({ error: "No fields to update" });
      }

      const { data: updatedStay, error: updateError } = await supabase
        .from("hotel_stays")
        .update(updatePayload)
        .eq("id", hotelId)
        .select()
        .single();

      if (updateError) {
        if (updateError.code === "PGRST116") {
          return res.status(404).json({ error: "Hotel not found" });
        }

        console.error("Supabase error updating hotel stay:", updateError);
        return res.status(400).json({
          error: "Failed to update hotel stay",
          details: updateError.message,
          code: updateError.code,
        });
      }

      if (!updatedStay) {
        return res.status(404).json({ error: "Hotel not found" });
      }

      return res.status(200).json(updatedStay);
    }

    // DELETE
    if (req.method === "DELETE") {
      const { error: stayDaysError } = await supabase
        .from("hotel_stay_days")
        .delete()
        .eq("stay_id", hotelId);

      if (stayDaysError) {
        console.error(
          "Supabase error deleting hotel stay days:",
          stayDaysError,
        );
        return res.status(400).json({
          error: "Failed to delete hotel stay days",
          details: stayDaysError.message,
          code: stayDaysError.code,
        });
      }

      const { data, error } = await supabase
        .from("hotel_stays")
        .delete()
        .eq("id", hotelId)
        .select()
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return res.status(404).json({ error: "Hotel not found" });
        }

        console.error("Supabase error deleting hotel stay:", error);
        return res.status(400).json({
          error: "Failed to delete hotel stay",
          details: error.message,
          code: error.code,
        });
      }

      if (!data) {
        return res.status(404).json({ error: "Hotel not found" });
      }

      return res.status(200).json(data);
    }
  } catch (error) {
    console.error("Error handling hotel stay request:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
