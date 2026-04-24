import { REVIEWS } from "@/lib/mock-data";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Delta } from "./Delta";
import { Stars } from "@/components/reviews/Stars";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { CardLink } from "./CardLink";

export function ReviewsCard() {
  const sources = [
    { key: "Google", d: REVIEWS.google },
    { key: "TripAdvisor", d: REVIEWS.tripadvisor },
    { key: "TheFork", d: REVIEWS.thefork },
  ];

  return (
    <Card className="col-span-5 p-[18px]">
      <CardHeader>
        <CardTitle>
          Avis clients · <span className="text-ember-soft">note globale</span>
        </CardTitle>
      </CardHeader>

      <div className="mb-3">
        {sources.map((s) => (
          <div
            key={s.key}
            className="grid items-center gap-[14px] py-[10px] border-b border-line last:border-b-0"
            style={{ gridTemplateColumns: "auto 1fr auto" }}
          >
            <div className="text-[11px] text-ink-3 uppercase tracking-[0.1em] font-semibold w-[100px]">
              {s.key}
            </div>
            <div className="flex items-center gap-2">
              <div className="display text-[22px] text-ink-1 font-medium">
                {s.d.rating}
                <span className="text-[12px] text-ink-4 ml-1">/ {s.d.scale}</span>
              </div>
              <Stars rating={s.d.rating} scale={s.d.scale} />
            </div>
            <div className="text-right">
              <div className="text-[11px] text-ink-3 mono mb-1">{s.d.count} avis</div>
              <Delta value={s.d.delta * 10} />
            </div>
          </div>
        ))}
      </div>

      <div className="text-[10.5px] uppercase tracking-[0.08em] text-ink-4 font-semibold mt-3 mb-2">
        Derniers avis
      </div>

      {REVIEWS.recent.slice(0, 3).map((r) => (
        <ReviewCard key={r.id} review={r} compact />
      ))}
      <CardLink to="/avis" label="Tous les avis" />
    </Card>
  );
}
