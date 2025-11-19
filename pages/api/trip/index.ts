import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import type { NextApiRequest, NextApiResponse } from "next";
import { createDateRangeArray } from "@/lib/functions/createDateRangeArray";
import { formatLocalDateFromUtc } from "@/lib/functions/formatLocalDateFromUtc";
import { hashPassword } from "@/lib/passwordUtils";
import { timezones } from "@/lib/timezones";

type ErrorBody = { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Record<string, unknown> | ErrorBody>,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const authHeader = req.headers.authorization;
    // Bearerで始まっていないときはエラーを返す
    if (!authHeader?.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ error: "Missing Authorization Bearer token" });
    }

    // Bearerのうしろのアクセストークンを取得
    const accessToken = authHeader.replace("Bearer ", "");

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

    // 環境変数がない場合はエラーを返す
    if (!supabaseUrl || !supabaseAnonKey) {
      return res.status(500).json({ error: "Supabase env not configured" });
    }

    // Anon Key + ユーザー認証でRLSを正しく適用
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // ユーザー情報を取得
    const { data: userRes, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userRes?.user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const body = req.body ?? {};

    // 入力値の検証・サニタイゼーション
    const title: string | undefined =
      typeof body.title === "string" ? body.title.trim() : undefined;
    const description: string | null =
      typeof body.description === "string" ? body.description.trim() : null;
    let startAt: string | undefined =
      typeof body.startAt === "string" ? body.startAt.trim() : undefined;
    let endAt: string | undefined =
      typeof body.endAt === "string" ? body.endAt.trim() : undefined;
    const timezone: string | undefined =
      typeof body.timezone === "string" ? body.timezone.trim() : undefined;
    const password: string | undefined =
      typeof body.password === "string" ? body.password.trim() : undefined;

    // 人数指定がない場合はデフォルトで1人
    const numOfPeople: number | null =
      typeof body.numOfPeople === "number" && body.numOfPeople > 0
        ? body.numOfPeople
        : 1;

    if (
      !title ||
      !startAt ||
      !endAt ||
      !timezone ||
      !password ||
      !numOfPeople
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // 文字列長制限とパターン検証
    if (title.length > 50) {
      return res
        .status(400)
        .json({ error: "Title must be 100 characters or less" });
    }

    if (description && description.length > 100) {
      return res
        .status(400)
        .json({ error: "Description must be 100 characters or less" });
    }

    if (password.length < 8 || password.length > 30) {
      return res
        .status(400)
        .json({ error: "Password must be between 8 and 30 characters" });
    }

    // 日付形式の検証
    const startDateObj = new Date(startAt);
    const endDateObj = new Date(endAt);
    if (
      Number.isNaN(startDateObj.getTime()) ||
      Number.isNaN(endDateObj.getTime())
    ) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    // startAtがendAtより遅い場合は値を入れ替える
    if (startDateObj > endDateObj) {
      const temp = startAt;
      startAt = endAt;
      endAt = temp;
    }

    // タイムゾーンの検証（許可された値のみ）
    const validTimezones = timezones.map((tz) => tz.value);
    if (!validTimezones.includes(timezone)) {
      return res.status(400).json({ error: "Invalid timezone" });
    }

    const createdBy = userRes.user.id;
    const tripId = randomUUID();

    // パスワードをハッシュ化（ソルト付き）
    const hashedPassword = hashPassword(password);

    // 1) trips へ挿入（自前ID採番）。RLSは created_by チェックのみなので通る
    const { error: insertTripError } = await supabase
      .from("trips")
      .insert([
        {
          id: tripId,
          title,
          description,
          start_at: startAt,
          end_at: endAt,
          timezone,
          number_of_members: numOfPeople,
          share_password: hashedPassword,
          created_by: createdBy,
        },
      ])
      .single();

    if (insertTripError) {
      console.error("Insert trip error:", insertTripError);
      return res
        .status(400)
        .json({ error: `insert trip error: ${insertTripError.message}` });
    }

    // 2) 自動的にオーナーとしてメンバー登録（これでSELECTポリシーも通る）
    const { data: memberData, error: addMemberError } = await supabase
      .from("trip_members")
      .insert([
        {
          trip_id: tripId,
          user_id: createdBy,
          role: "owner",
          permissions: { can_edit: true, can_invite: true },
        },
      ])
      .select();

    if (addMemberError) {
      console.error("Add member error:", addMemberError);
      return res
        .status(400)
        .json({ error: `add member error: ${addMemberError.message}` });
    }

    // 3) trip_daysを自動作成（開始日から終了日までの各日付）
    const timezonedStartDate = formatLocalDateFromUtc(startAt, timezone);
    const timezonedEndDate = formatLocalDateFromUtc(endAt, timezone);
    const tripDays =
      timezonedStartDate && timezonedEndDate
        ? createDateRangeArray(timezonedStartDate, timezonedEndDate)
        : [];

    const tripDaysData = tripDays.map((date) => ({
      trip_id: tripId,
      date: date,
      title: null,
    }));

    const { error: insertTripDaysError } = await supabase
      .from("trip_days")
      .insert(tripDaysData);

    if (insertTripDaysError) {
      console.error("Insert trip days error:", insertTripDaysError);
      return res.status(400).json({
        error: `insert trip days error: ${insertTripDaysError.message}`,
      });
    }

    return res.status(201).json({ tripId });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
}
