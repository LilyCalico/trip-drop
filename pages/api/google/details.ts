import type { NextApiRequest, NextApiResponse } from "next";

interface GooglePlaceDetailsResponse {
  result: {
    place_id: string;
    name: string;
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GooglePlaceDetailsResponse | { error: string }>,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { place_id } = req.query;

  if (!place_id || typeof place_id !== "string") {
    return res.status(400).json({ error: "place_id parameter is required" });
  }

  try {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      return res
        .status(500)
        .json({ error: "Google Places API key not configured" });
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(place_id)}&fields=place_id,name,formatted_address,geometry&key=${apiKey}`,
    );

    if (!response.ok) {
      throw new Error(`Google API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== "OK") {
      throw new Error(`Google API error: ${data.status}`);
    }

    return res.status(200).json({
      result: data.result,
    });
  } catch (error) {
    console.error("Google Place Details API error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
}
