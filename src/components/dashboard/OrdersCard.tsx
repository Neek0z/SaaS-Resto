import { useMemo, useState } from "react";
import { useOrders } from "@/hooks/useOrders";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderRow } from "@/components/orders/OrderRow";
import { CardLink } from "./CardLink";
import { cn } from "@/lib/utils";

type Filter = "all" | "salle" | "cc" | "delivery";

export function OrdersCard() {
  const [filter, setFilter] = useState<Filter>("all");
  const { orders, loading, error } = useOrders();

  const active = useMemo(
    () => orders.filter((o) => o.status !== "served" && o.status !== "cancelled"),
    [orders]
  );
  const rows = filter === "all" ? active : active.filter((o) => o.channel === filter);

  return (
    <Card className="col-span-7 p-[18px]">
      <CardHeader>
        <CardTitle>
          Commandes · <span className="text-ember-soft">en cours</span>
        </CardTitle>
        <div className="segmented">
          {(["all", "salle", "cc", "delivery"] as const).map((f) => (
            <button
              key={f}
              className={cn(filter === f && "active")}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "Toutes" : f === "salle" ? "Salle" : f === "cc" ? "C&C" : "Livraison"}
            </button>
          ))}
        </div>
      </CardHeader>

      {error ? (
        <div className="py-10 text-center text-[12px] text-danger">{error}</div>
      ) : loading && orders.length === 0 ? (
        <div className="py-10 text-center text-[12px] text-ink-3">Chargement…</div>
      ) : rows.length === 0 ? (
        <div className="py-10 text-center text-[12px] text-ink-3">
          Aucune commande en cours.
        </div>
      ) : (
        <div className="flex flex-col gap-[2px]">
          {rows.slice(0, 6).map((o) => (
            <OrderRow key={o.id} order={o} />
          ))}
        </div>
      )}
      <CardLink to="/commandes" label={`Voir les ${active.length} commandes`} />
    </Card>
  );
}
