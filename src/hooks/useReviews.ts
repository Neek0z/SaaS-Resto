import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  createReview,
  deleteReview,
  listReviews,
  updateReview,
} from "@/lib/api/reviews";
import type { NewReview, Review, ReviewPatch } from "@/lib/review-types";
import { extractErrorMessage } from "@/lib/errors";

function translateError(e: unknown): string {
  const msg = extractErrorMessage(e);
  const lower = msg.toLowerCase();
  if (lower.includes("row level security") || lower.includes("permission")) {
    return "Accès refusé. Vérifiez votre rôle.";
  }
  if (lower.includes("not configured") || lower.includes("non configur")) {
    return "Supabase non configuré.";
  }
  if (lower.includes("network") || lower.includes("failed to fetch")) {
    return "Connexion réseau indisponible.";
  }
  return msg;
}

type UseReviews = {
  reviews: Review[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  add: (input: NewReview) => Promise<Review | null>;
  update: (id: string, patch: ReviewPatch) => Promise<void>;
  reply: (id: string, text: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
};

export function useReviews(): UseReviews {
  const { restaurant } = useAuth();
  const restaurantId = restaurant?.id ?? null;
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const load = useCallback(async () => {
    if (!restaurantId) {
      setReviews([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const rows = await listReviews();
      if (!mounted.current) return;
      setReviews(rows);
    } catch (e) {
      if (mounted.current) setError(translateError(e));
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    mounted.current = true;
    void load();
    return () => {
      mounted.current = false;
    };
  }, [load]);

  const add = useCallback(async (input: NewReview): Promise<Review | null> => {
    try {
      const created = await createReview(input);
      setReviews((prev) => [created, ...prev]);
      return created;
    } catch (e) {
      setError(translateError(e));
      return null;
    }
  }, []);

  const update = useCallback(async (id: string, patch: ReviewPatch) => {
    const before = reviews;
    setReviews((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              ...(patch.source !== undefined ? { source: patch.source } : {}),
              ...(patch.author !== undefined ? { author: patch.author } : {}),
              ...(patch.rating !== undefined ? { rating: patch.rating } : {}),
              ...(patch.scale !== undefined ? { scale: patch.scale } : {}),
              ...(patch.text !== undefined ? { text: patch.text } : {}),
              ...(patch.replied !== undefined
                ? {
                    replied: patch.replied,
                    repliedAt: patch.replied ? new Date().toISOString() : null,
                  }
                : {}),
              ...(patch.replyText !== undefined ? { replyText: patch.replyText } : {}),
            }
          : r
      )
    );
    try {
      await updateReview(id, patch);
    } catch (e) {
      setReviews(before);
      setError(translateError(e));
    }
  }, [reviews]);

  const reply = useCallback(
    async (id: string, text: string) => {
      await update(id, { replied: true, replyText: text });
    },
    [update]
  );

  const remove = useCallback(async (id: string) => {
    const before = reviews;
    setReviews((prev) => prev.filter((r) => r.id !== id));
    try {
      await deleteReview(id);
    } catch (e) {
      setReviews(before);
      setError(translateError(e));
    }
  }, [reviews]);

  return { reviews, loading, error, reload: load, add, update, reply, remove };
}
