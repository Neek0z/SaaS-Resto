import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { useReviews } from "@/hooks/useReviews";
import { aggregateBySource } from "@/lib/api/reviews";
import type { Review, ReviewSource } from "@/lib/review-types";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { ReplyModal } from "@/components/reviews/ReplyModal";
import { Stars } from "@/components/reviews/Stars";
import { NewReviewModal } from "@/components/reviews/NewReviewModal";
import { cn } from "@/lib/utils";

type SourceFilter = "all" | ReviewSource;
type ReplyFilter = "all" | "pending" | "replied";
type RatingFilter = "all" | 1 | 2 | 3 | 4 | 5;

export default function Reviews() {
  const { reviews, loading, error, add, reply, remove } = useReviews();
  const [source, setSource] = useState<SourceFilter>("all");
  const [replyFilter, setReplyFilter] = useState<ReplyFilter>("all");
  const [rating, setRating] = useState<RatingFilter>("all");
  const [query, setQuery] = useState("");
  const [replyTo, setReplyTo] = useState<Review | null>(null);
  const [creating, setCreating] = useState(false);

  const sources = useMemo(() => aggregateBySource(reviews), [reviews]);

  const aggregate = useMemo(() => {
    const total = reviews.length;
    if (total === 0) return { avg: 0, total: 0 };
    const sum = reviews.reduce((s, r) => s + (r.rating / r.scale) * 5, 0);
    return { avg: sum / total, total };
  }, [reviews]);

  const pendingCount = reviews.filter((r) => !r.replied).length;
  const negativeCount = reviews.filter((r) => Math.round((r.rating / r.scale) * 5) <= 2).length;

  const distribution = useMemo(() => {
    const buckets: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => {
      const star = Math.max(1, Math.min(5, Math.round((r.rating / r.scale) * 5))) as 1 | 2 | 3 | 4 | 5;
      buckets[star]++;
    });
    const max = Math.max(...Object.values(buckets), 1);
    return { buckets, max };
  }, [reviews]);

  const filtered = useMemo(() => {
    return reviews.filter((r) => {
      if (source !== "all" && r.source !== source) return false;
      if (replyFilter === "pending" && r.replied) return false;
      if (replyFilter === "replied" && !r.replied) return false;
      if (rating !== "all") {
        const star = Math.round((r.rating / r.scale) * 5);
        if (star !== rating) return false;
      }
      if (query) {
        const q = query.toLowerCase();
        if (!r.text.toLowerCase().includes(q) && !r.author.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [reviews, source, replyFilter, rating, query]);

  const handleSend = async (review: Review, text: string) => {
    await reply(review.id, text);
  };

  const handleDelete = async (review: Review) => {
    if (!confirm(`Supprimer l'avis de ${review.author} ?`)) return;
    await remove(review.id);
  };

  return (
    <>
      <div className="flex items-end justify-between mb-5 pt-2">
        <div>
          <div className="chip-uppercase mb-1">Réputation · Multi-plateformes</div>
          <h2 className="display font-medium text-[26px] leading-tight m-0">
            Avis <em className="not-italic italic text-ember-soft font-normal">clients</em>
          </h2>
        </div>
        <button
          className="btn-primary inline-flex items-center gap-2"
          onClick={() => setCreating(true)}
        >
          <Plus size={13} />
          Nouvel avis
        </button>
      </div>

      {error && (
        <Card className="mb-4 border-danger/40">
          <div className="text-[12px] text-danger">{error}</div>
        </Card>
      )}

      <div className="grid grid-cols-12 gap-4 mb-4">
        <div className="kpi hero col-span-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="chip-uppercase">Note globale · pondérée</div>
              <div className="display font-medium text-[42px] leading-none mt-[14px] mb-[8px]">
                {aggregate.total > 0 ? aggregate.avg.toFixed(1) : "—"}
                <span className="text-[18px] text-ink-3 ml-[4px] font-normal"> / 5</span>
              </div>
              <Stars rating={aggregate.avg} size={14} />
            </div>
          </div>
          <div className="mt-5 text-[11.5px] text-ink-3">
            {aggregate.total.toLocaleString("fr-FR")} avis sur 3 plateformes
          </div>
        </div>

        <StatTile
          className="col-span-3"
          label="À répondre"
          value={pendingCount}
          hint="Avis en attente"
          tone="danger"
        />
        <StatTile
          className="col-span-3"
          label="Négatifs"
          value={negativeCount}
          hint="≤ 2★"
          tone="danger"
        />
        <StatTile
          className="col-span-2"
          label="Total"
          value={reviews.length}
          hint="Tous avis"
          tone="cream"
        />
      </div>

      <div className="grid grid-cols-12 gap-4 mb-4">
        <Card className="col-span-7">
          <CardHeader>
            <CardTitle>
              Répartition · <span className="text-ember-soft">par source</span>
            </CardTitle>
          </CardHeader>
          <div className="flex flex-col gap-0">
            {sources.map((s) => (
              <div
                key={s.source}
                className="grid items-center gap-4 py-3 border-b border-line last:border-b-0"
                style={{ gridTemplateColumns: "110px 80px 1fr auto" }}
              >
                <div className="chip-uppercase text-[11px] !text-ink-3">{s.source}</div>
                <div className="display text-[22px] font-medium">
                  {s.count > 0 ? s.rating.toFixed(1) : "—"}
                  <span className="text-[11px] text-ink-4 ml-1">/ {s.scale}</span>
                </div>
                {s.count > 0 ? (
                  <Stars rating={s.rating} scale={s.scale} />
                ) : (
                  <span className="text-[11px] text-ink-4 italic">Aucun avis</span>
                )}
                <div className="text-[11px] text-ink-3 mono">{s.count} avis</div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="col-span-5">
          <CardHeader>
            <CardTitle>
              Distribution · <span className="text-ember-soft">notes reçues</span>
            </CardTitle>
            <span className="text-[11px] text-ink-4 mono">{reviews.length} avis</span>
          </CardHeader>
          <div className="flex flex-col gap-2">
            {([5, 4, 3, 2, 1] as const).map((star) => {
              const count = distribution.buckets[star];
              const pct = (count / distribution.max) * 100;
              const color =
                star >= 4 ? "var(--ok)" : star === 3 ? "var(--amber)" : "var(--danger)";
              return (
                <div
                  key={star}
                  className="grid items-center gap-3"
                  style={{ gridTemplateColumns: "60px 1fr 40px" }}
                >
                  <div className="flex items-center gap-1">
                    <span className="mono text-[13px] font-semibold">{star}</span>
                    <span className="text-amber text-[11px]">★</span>
                  </div>
                  <div className="h-[10px] rounded-full bg-bg-3 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                  <div className="mono text-[12px] text-right text-ink-2">{count}</div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="segmented">
            {(["all", "Google", "TripAdvisor", "TheFork"] as const).map((s) => (
              <button key={s} className={cn(source === s && "active")} onClick={() => setSource(s)}>
                {s === "all" ? "Toutes sources" : s}
              </button>
            ))}
          </div>
          <span className="text-ink-4 text-[11px]">|</span>
          <div className="segmented">
            {(["all", "pending", "replied"] as const).map((s) => (
              <button
                key={s}
                className={cn(replyFilter === s && "active")}
                onClick={() => setReplyFilter(s)}
              >
                {s === "all" ? "Tous" : s === "pending" ? "À répondre" : "Répondus"}
              </button>
            ))}
          </div>
          <span className="text-ink-4 text-[11px]">|</span>
          <div className="segmented">
            <button className={cn(rating === "all" && "active")} onClick={() => setRating("all")}>
              ★ tous
            </button>
            {([5, 4, 3, 2, 1] as const).map((r) => (
              <button key={r} className={cn(rating === r && "active")} onClick={() => setRating(r)}>
                {r}★
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2 bg-bg-2 border border-line rounded-[10px] px-3 py-[7px] w-[260px] text-[13px]">
            <Search size={14} className="text-ink-3" />
            <input
              className="flex-1 bg-transparent border-0 outline-none text-ink-1 placeholder:text-ink-3"
              placeholder="Auteur, mot clé…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button className="text-ink-4 hover:text-ink-2 text-[11px]" onClick={() => setQuery("")}>
                ×
              </button>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {filtered.length} avis ·{" "}
            <span className="text-ember-soft">
              {source === "all" ? "toutes sources" : source}
              {replyFilter === "pending" ? " · en attente" : replyFilter === "replied" ? " · répondus" : ""}
              {rating !== "all" ? ` · ${rating}★` : ""}
            </span>
          </CardTitle>
          <span className="text-[11px] text-ink-4 mono uppercase tracking-[0.08em]">
            {pendingCount} en attente
          </span>
        </CardHeader>

        {loading && reviews.length === 0 ? (
          <div className="py-16 text-center text-ink-3 text-[13px]">Chargement…</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-ink-3 text-[13px]">
            {reviews.length === 0
              ? "Aucun avis pour l'instant. Ajoute un avis pour commencer."
              : "Aucun avis ne correspond aux filtres."}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((r) => (
              <ReviewCard
                key={r.id}
                review={r}
                onReply={setReplyTo}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </Card>

      <ReplyModal review={replyTo} onClose={() => setReplyTo(null)} onSend={handleSend} />
      <NewReviewModal
        open={creating}
        onClose={() => setCreating(false)}
        onSubmit={async (input) => {
          const created = await add(input);
          if (created) setCreating(false);
        }}
      />
    </>
  );
}

function StatTile({
  label,
  value,
  hint,
  tone,
  className,
}: {
  label: string;
  value: string | number;
  hint: string;
  tone: "ember" | "ok" | "danger" | "cream";
  className?: string;
}) {
  const toneColor =
    tone === "ember"
      ? "var(--ember-soft)"
      : tone === "ok"
      ? "var(--ok)"
      : tone === "danger"
      ? "var(--danger)"
      : "var(--ink-1)";
  return (
    <div className={cn("kpi", className)}>
      <div className="chip-uppercase">{label}</div>
      <div
        className="display font-medium text-[34px] leading-none mt-[12px] mb-[8px]"
        style={{ color: toneColor }}
      >
        {value}
      </div>
      <div className="text-[11.5px] text-ink-3">{hint}</div>
    </div>
  );
}
