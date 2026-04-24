import { useState } from "react";
import { ORDERS } from "@/lib/mock-data";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderRow } from "@/components/orders/OrderRow";
import { CardLink } from "./CardLink";
import { cn } from "@/lib/utils";

type Filter = "all" | "salle" | "cc" | "delivery";

export function OrdersCard() {
  const [filter, setFilter] = useState<Filter>("all");
  const rows = filter === "all" ? ORDERS : ORDERS.filter((o) => o.channel === filter);

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

      <div className="flex flex-col gap-[2px]">
        {rows.slice(0, 6).map((o) => (
          <OrderRow key={o.id} order={o} />
        ))}
      </div>
      <CardLink to="/commandes" label={`Voir les ${ORDERS.length} commandes`} />
    </Card>
  );
}
