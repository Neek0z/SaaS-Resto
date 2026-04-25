import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { CardLink } from "./CardLink";
import { fetchTopDishes, type TopDish } from "@/lib/api/top-dishes";
import { extractErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";

export function MenuCard() {
  const [dishes, setDishes] = useState<TopDish[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    fetchTopDishes(5)
      .then((d) => {
        if (mounted) setDishes(d);
      })
      .catch((e) => {
        if (mounted) setError(extractErrorMessage(e));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Card className="col-span-7 p-[18px]">
      <CardHeader>
        <CardTitle>
          Menu · <span className="text-ember-soft">top ventes (7 jours)</span>
        </CardTitle>
        <span className="text-[11.5px] text-ink-3 mono">VENDUS / TENDANCE</span>
      </CardHeader>

      <div>
        <div
          className="grid items-center gap-3 py-[10px] px-2 text-[10.5px] uppercase tracking-[0.08em] text-ink-4 border-b border-line mb-1 font-semibold"
          style={{ gridTemplateColumns: "1fr 80px 80px" }}
        >
          <span>Plat</span>
          <span className="text-right">Vendus</span>
          <span className="text-right">Tendance</span>
        </div>

        {error ? (
          <div className="py-8 text-center text-[12px] text-danger">{error}</div>
        ) : loading && dishes.length === 0 ? (
          <div className="py-8 text-center text-[12px] text-ink-3">Chargement…</div>
        ) : dishes.length === 0 ? (
          <div className="py-8 text-center text-[12px] text-ink-3">
            Aucune commande sur les 7 derniers jours.
          </div>
        ) : (
          dishes.map((d) => <DishRow key={d.name} d={d} />)
        )}
      </div>

      <CardLink to="/menu" label="Voir tout le menu" />
    </Card>
  );
}

function DishRow({ d }: { d: TopDish }) {
  return (
    <div
      className="grid items-center gap-3 py-[10px] px-2 border-b border-line text-[13px] hover:bg-bg-2 transition-colors"
      style={{ gridTemplateColumns: "1fr 80px 80px" }}
    >
      <div>
        <div className="font-medium">{d.name}</div>
        {d.category && (
          <div className="text-[10.5px] text-ink-4 uppercase tracking-[0.08em] mt-[2px]">
            {d.category}
          </div>
        )}
      </div>
      <div className="display text-[18px] text-ink-1 text-right">{d.sold}</div>
      <div className="text-right">
        <span
          className={cn(
            "trend",
            d.trend > 0 ? "up" : d.trend < 0 ? "down" : "flat"
          )}
        >
          {d.trend > 0 ? "↑" : d.trend < 0 ? "↓" : "—"} {Math.abs(d.trend)}%
        </span>
      </div>
    </div>
  );
}
