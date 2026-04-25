import { useMemo } from "react";
import { useReviews } from "@/hooks/useReviews";
import { aggregateBySource } from "@/lib/api/reviews";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Stars } from "@/components/reviews/Stars";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { CardLink } from "./CardLink";

export function ReviewsCard() {
  const { reviews, loading, error } = useReviews();
  const sources = useMemo(() => aggregateBySource(reviews), [reviews]);

  return (
    <Card className="col-span-5 p-[18px]">
      <CardHeader>
        <CardTitle>
          Avis clients · <span className="text-ember-soft">note globale</span>
        </CardTitle>
      </CardHeader>

      {error ? (
        <div className="py-10 text-center text-[12px] text-danger">{error}</div>
      ) : loading && reviews.length === 0 ? (
        <div className="py-10 text-center text-[12px] text-ink-3">Chargement…</div>
      ) : reviews.length === 0 ? (
        <div className="py-10 text-center text-[12px] text-ink-3">
          Aucun avis pour l'instant.
        </div>
      ) : (
        <>
          <div className="mb-3">
            {sources.map((s) => (
              <div
                key={s.source}
                className="grid items-center gap-[14px] py-[10px] border-b border-line last:border-b-0"
                style={{ gridTemplateColumns: "auto 1fr auto" }}
              >
                <div className="text-[11px] text-ink-3 uppercase tracking-[0.1em] font-semibold w-[100px]">
                  {s.source}
                </div>
                <div className="flex items-center gap-2">
                  <div className="display text-[22px] text-ink-1 font-medium">
                    {s.count > 0 ? s.rating.toFixed(1) : "—"}
                    <span className="text-[12px] text-ink-4 ml-1">/ {s.scale}</span>
                  </div>
                  {s.count > 0 && <Stars rating={s.rating} scale={s.scale} />}
                </div>
                <div className="text-[11px] text-ink-3 mono">{s.count} avis</div>
              </div>
            ))}
          </div>

          <div className="text-[10.5px] uppercase tracking-[0.08em] text-ink-4 font-semibold mt-3 mb-2">
            Derniers avis
          </div>

          {reviews.slice(0, 3).map((r) => (
            <ReviewCard key={r.id} review={r} compact />
          ))}
        </>
      )}
      <CardLink to="/avis" label="Tous les avis" />
    </Card>
  );
}
