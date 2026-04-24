import { MENU_PERF } from "@/lib/mock-data";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { MenuRow } from "@/components/menu/MenuRow";
import { CardLink } from "./CardLink";

export function MenuCard() {
  return (
    <Card className="col-span-7 p-[18px]">
      <CardHeader>
        <CardTitle>
          Menu · <span className="text-ember-soft">top ventes du soir</span>
        </CardTitle>
        <span className="text-[11.5px] text-ink-3 mono">MARGE / STOCK / TENDANCE</span>
      </CardHeader>

      <div>
        <div
          className="grid items-center gap-3 py-[10px] px-2 text-[10.5px] uppercase tracking-[0.08em] text-ink-4 border-b border-line mb-1 font-semibold"
          style={{ gridTemplateColumns: "1fr 60px 80px 60px" }}
        >
          <span>Plat</span>
          <span className="text-right">Vendus</span>
          <span>Marge</span>
          <span className="text-right">Stock</span>
        </div>
        {MENU_PERF.map((m) => (
          <MenuRow key={m.name} m={m} />
        ))}
      </div>
      <CardLink to="/menu" label="Voir tout le menu" />
    </Card>
  );
}
