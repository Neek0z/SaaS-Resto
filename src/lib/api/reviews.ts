import { REVIEWS, type Review } from "@/lib/mock-data";
import { supabase } from "@/lib/supabase";

// Expected Supabase table `reviews`:
// id (text), source (text), author (text), rating (numeric),
// scale (int), created_at (timestamptz), text (text), replied (bool).

export async function listReviews(): Promise<Review[]> {
  if (!supabase) return REVIEWS.recent;

  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[reviews] supabase error — falling back to mocks", error);
    return REVIEWS.recent;
  }

  return (data ?? []).map((r): Review => ({
    id: r.id,
    source: r.source,
    author: r.author,
    rating: Number(r.rating),
    scale: r.scale,
    time: r.created_at,
    text: r.text,
    replied: r.replied,
  }));
}

export function getSources() {
  return [
    { key: "Google" as const, ...REVIEWS.google },
    { key: "TripAdvisor" as const, ...REVIEWS.tripadvisor },
    { key: "TheFork" as const, ...REVIEWS.thefork },
  ];
}
