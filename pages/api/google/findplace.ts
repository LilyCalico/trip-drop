import type { NextApiRequest, NextApiResponse } from "next";

// GET /api/google/findplace?input=tokyo station&lat=35.68&lng=139.76&radius=50000
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Missing GOOGLE_MAPS_API_KEY" });
  }

  const input = String(req.query.input || "");
  if (!input) {
    return res.status(400).json({ error: "input is required" });
  }

  const lat = req.query.lat ? Number(req.query.lat) : undefined;
  const lng = req.query.lng ? Number(req.query.lng) : undefined;
  const radius = req.query.radius ? Number(req.query.radius) : undefined;

  const params = new URLSearchParams({
    input,
    inputtype: "textquery",
    key: apiKey
  });
  const language = String(req.query.language);
  params.set("language", language);

  // 位置バイアス（任意）
  if (lat != null && lng != null && radius != null) {
    params.set("locationbias", `circle:${radius}@${lat},${lng}`);
  }

  // fieldsは候補一覧で必要な最小限
  params.set("fields", "place_id,name,formatted_address,geometry");

  const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?${params.toString()}`;

  try {
    const r = await fetch(url);
    const text = await r.text();
    if (!r.ok) {
      return res
        .status(r.status)
        .json({ error: "upstream not ok", body: text });
    }
    const data = JSON.parse(text);
    if (data.status && data.status !== "OK") {
      // Google Places APIは200でもstatusがOK以外を返す
      return res.status(400).json({
        status: data.status,
        error_message: data.error_message,
        candidates: data.candidates ?? []
      });
    }
    return res.status(200).json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "fetch failed";
    return res.status(500).json({ error: message });
  }
}
