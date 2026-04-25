import { supabase } from "@/lib/supabase";
import type {
  NewReview,
  Review,
  ReviewPatch,
  ReviewSource,
  SourceAggregate,
} from "@/lib/review-types";
import { REVIEW_SOURCES } from "@/lib/review-types";

function requireClient() {
  if (!supabase) throw new Error("Supabase non configuré.");
  return supabase;
}

type Row = {
  id: string;
  restaurant_id: string;
  source: ReviewSource;
  author: string;
  rating: number | string;
  scale: number;
  text: string;
  replied: boolean;
  reply_text: string | null;
  replied_at: string | null;
  created_at: string;
  updated_at: string;
};

function mapRow(r: Row): Review {
  return {
    id: r.id,
    restaurantId: r.restaurant_id,
    source: r.source,
    author: r.author,
    rating: typeof r.rating === "string" ? Number(r.rating) : r.rating,
    scale: r.scale,
    text: r.text,
    replied: r.replied,
    replyText: r.reply_text,
    repliedAt: r.replied_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function listReviews(): Promise<Review[]> {
  const sb = requireClient();
  const { data, error } = await sb
    .from("reviews")
    .select(
      "id, restaurant_id, source, author, rating, scale, text, replied, reply_text, replied_at, created_at, updated_at"
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as Row[]).map(mapRow);
}

export async function createReview(input: NewReview): Promise<Review> {
  const sb = requireClient();
  const row = {
    source: input.source,
    author: input.author,
    rating: input.rating,
    scale: input.scale ?? 5,
    text: input.text,
    ...(input.createdAt ? { created_at: input.createdAt } : {}),
  };
  const { data, error } = await sb
    .from("reviews")
    .insert(row)
    .select(
      "id, restaurant_id, source, author, rating, scale, text, replied, reply_text, replied_at, created_at, updated_at"
    )
    .single();
  if (error) throw error;
  return mapRow(data as Row);
}

export async function updateReview(id: string, patch: ReviewPatch): Promise<void> {
  const sb = requireClient();
  const row: Record<string, unknown> = {};
  if (patch.source !== undefined) row.source = patch.source;
  if (patch.author !== undefined) row.author = patch.author;
  if (patch.rating !== undefined) row.rating = patch.rating;
  if (patch.scale !== undefined) row.scale = patch.scale;
  if (patch.text !== undefined) row.text = patch.text;
  if (patch.replied !== undefined) {
    row.replied = patch.replied;
    row.replied_at = patch.replied ? new Date().toISOString() : null;
  }
  if (patch.replyText !== undefined) row.reply_text = patch.replyText;
  if (Object.keys(row).length === 0) return;
  const { error } = await sb.from("reviews").update(row).eq("id", id);
  if (error) throw error;
}

export async function deleteReview(id: string): Promise<void> {
  const sb = requireClient();
  const { error } = await sb.from("reviews").delete().eq("id", id);
  if (error) throw error;
}

export function aggregateBySource(reviews: Review[]): SourceAggregate[] {
  return REVIEW_SOURCES.map((source) => {
    const inSource = reviews.filter((r) => r.source === source);
    const scale = inSource[0]?.scale ?? 5;
    const sum = inSource.reduce((s, r) => s + r.rating, 0);
    const avg = inSource.length === 0 ? 0 : sum / inSource.length;
    return {
      source,
      rating: Math.round(avg * 10) / 10,
      scale,
      count: inSource.length,
    };
  });
}
