import type { NextApiRequest, NextApiResponse } from "next";

// GET /api/google/details?place_id=...
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

  const placeId = String(req.query.place_id || "");
  if (!placeId) {
    return res.status(400).json({ error: "place_id is required" });
  }

  const params = new URLSearchParams({ place_id: placeId, key: apiKey });
  const language = String(req.query.language || "ja");
  params.set("language", language);
  params.set("fields", "place_id,name,formatted_address,geometry,types");

  const url = `https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`;

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
      return res.status(400).json({
        status: data.status,
        error_message: data.error_message,
        result: data.result ?? null
      });
    }
    return res.status(200).json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "fetch failed";
    return res.status(500).json({ error: message });
  }
}
