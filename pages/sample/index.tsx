import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type FindPlaceCandidate = {
  place_id: string;
  name: string;
  formatted_address: string;
};

type PlaceDetails = {
  result?: {
    place_id: string;
    name: string;
    formatted_address: string;
    geometry?: { location: { lat: number; lng: number } };
    types?: string[];
  };
  status?: string;
};

export default function index() {
  const [value, setValue] = useState("");
  const [results, setResults] = useState<FindPlaceCandidate[]>([]);
  const [selected, setSelected] = useState<PlaceDetails["result"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void search();
  };

  const search = async () => {
    if (!value.trim()) return;
    setLoading(true);
    setError(null);
    setSelected(null);
    try {
      const params = new URLSearchParams({ input: value });
      const r = await fetch(`/api/google/findplace?${params.toString()}`);
      const data = await r.json();
      setResults((data.candidates as FindPlaceCandidate[]) || []);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const getDetails = async (placeId: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ place_id: placeId });
      const r = await fetch(`/api/google/details?${params.toString()}`);
      const data: PlaceDetails = await r.json();
      setSelected(data.result || null);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log(results);
  }, [results]);

  return (
    <div className="p-[4rem]">
      <h1 className="mb-[2rem]">Hello World</h1>
      <form onSubmit={onSubmit} className="flex items-center gap-2 w-[30rem]">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="入力して送信"
        />
        <Button type="submit">Submit</Button>
      </form>

      <h1 className="mt-[2rem]">{value}</h1>

      {loading && <div className="mt-4">検索中...</div>}
      {error && <div className="mt-4 text-red-600">Error: {error}</div>}

      {results.length > 0 && (
        <div className="mt-4 w-[48rem]">
          <h2 className="font-semibold mb-2">検索結果</h2>
          <ul className="space-y-2">
            {results.map((c) => (
              <li key={c.place_id} className="border p-2 rounded-md">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {c.formatted_address}
                    </div>
                  </div>
                  <Button type="button" onClick={() => getDetails(c.place_id)}>
                    詳細
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {selected && (
        <div className="mt-6 w-[48rem]">
          <h2 className="font-semibold mb-2">詳細</h2>
          <pre className="bg-accent/40 p-3 rounded-md overflow-x-auto">
            {JSON.stringify(selected, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
