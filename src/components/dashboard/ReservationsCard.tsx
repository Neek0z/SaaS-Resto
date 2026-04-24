import { RESERVATIONS } from "@/lib/mock-data";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ResaRow } from "@/components/reservations/ResaRow";
import { CardLink } from "./CardLink";

export function ReservationsCard() {
  const totalCovers = RESERVATIONS.reduce((s, r) => s + r.covers, 0);

  return (
    <Card className="col-span-5 p-[18px]">
      <CardHeader>
        <CardTitle>
          Réservations · <span className="text-ember-soft">ce soir</span>
        </CardTitle>
        <span className="text-[11.5px] text-ink-3">
          {RESERVATIONS.length} résas · {totalCovers} couverts
        </span>
      </CardHeader>

      <div className="flex flex-col gap-[2px] max-h-[480px] overflow-y-auto pr-[6px]">
        {RESERVATIONS.map((r, i) => (
          <ResaRow key={i} r={r} current={r.time === "19:45"} />
        ))}
      </div>
      <CardLink to="/reservations" label="Voir le plan de salle" />
    </Card>
  );
}
