import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useLoyalty } from "@/hooks/useLoyalty";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { TIER_COLOR, TIER_LABEL, type LoyaltyTier } from "@/lib/loyalty-types";
import { CardLink } from "./CardLink";

const TIERS: LoyaltyTier[] = ["bronze", "silver", "gold", "platine"];

export function LoyaltyCard() {
  const { customers, kpis, loading, error } = useLoyalty();

  const counts = customers.reduce(
    (acc, c) => {
      acc[c.tier] = (acc[c.tier] ?? 0) + 1;
      return acc;
    },
    {} as Record<LoyaltyTier, number>
  );

  const total = customers.length;
  const top = [...customers]
    .sort((a, b) => b.points - a.points)
    .slice(0, 3);

  return (
    <Card className="col-span-12 lg:col-span-6 p-[18px]">
      <CardHeader>
        <CardTitle>
          <Link to="/fidelite" className="hover:text-ember-soft transition-colors">
            Fidélité · <span className="text-ember-soft">communauté</span>
          </Link>
        </CardTitle>
        <div className="flex gap-3 text-[11.5px] text-ink-3 mono">
          <span>{kpis.activeMonth} actifs · 30 j</span>
          <span className="text-ember-soft">
            +{kpis.pointsThisMonth.toLocaleString("fr-FR")} pts
          </span>
        </div>
      </CardHeader>

      {error ? (
        <div className="py-10 text-center text-[12px] text-danger">{error}</div>
      ) : loading && total === 0 ? (
        <div className="py-10 text-center text-[12px] text-ink-3">Chargement…</div>
      ) : total === 0 ? (
        <div className="py-10 text-center text-[12px] text-ink-3 flex flex-col items-center gap-2">
          <Heart size={18} className="text-ink-4" />
          <span>Aucun client fidèle pour l&apos;instant.</span>
        </div>
      ) : (
        <>
          {/* Distribution par palier */}
          <div className="mb-4">
            <div className="flex items-baseline justify-between mb-2">
              <div className="text-[11px] text-ink-4 mono uppercase tracking-[0.06em]">
                Membres par palier
              </div>
              <div className="display text-[20px] font-medium">{total}</div>
            </div>
            <div className="flex h-[8px] rounded-full overflow-hidden bg-bg-2 border border-line">
              {TIERS.map((t) => {
                const c = counts[t] ?? 0;
                const pct = total > 0 ? (c / total) * 100 : 0;
                if (pct === 0) return null;
                return (
                  <div
                    key={t}
                    style={{
                      width: `${pct}%`,
                      background: TIER_COLOR[t],
                    }}
                    title={`${TIER_LABEL[t]} · ${c}`}
                  />
                );
              })}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[11px] text-ink-3">
              {TIERS.map((t) => {
                const c = counts[t] ?? 0;
                if (c === 0) return null;
                return (
                  <span key={t} className="inline-flex items-center gap-[5px]">
                    <span
                      className="w-[7px] h-[7px] rounded-full"
                      style={{ background: TIER_COLOR[t] }}
                    />
                    {TIER_LABEL[t]} <span className="mono">{c}</span>
                  </span>
                );
              })}
            </div>
          </div>

          {/* Top 3 */}
          {top.length > 0 && (
            <div>
              <div className="text-[11px] text-ink-4 mono uppercase tracking-[0.06em] mb-2">
                Top points
              </div>
              <div className="flex flex-col">
                {top.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between gap-3 py-[8px] border-b border-line last:border-b-0"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-[6px] h-[6px] rounded-full shrink-0"
                        style={{ background: TIER_COLOR[c.tier] }}
                      />
                      <span className="text-[13px] truncate">{c.name}</span>
                    </div>
                    <span className="text-[12px] mono text-ember-soft font-semibold shrink-0">
                      {c.points.toLocaleString("fr-FR")} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
      <CardLink to="/fidelite" label="Voir tous les clients" />
    </Card>
  );
}
