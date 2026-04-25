import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export function AlertsCard() {
  return (
    <Card className="col-span-5 p-[18px]">
      <CardHeader>
        <CardTitle>
          Alertes · <span className="text-ember-soft">à traiter</span>
        </CardTitle>
        <span className="text-[11.5px] text-ink-3">0 en attente</span>
      </CardHeader>

      <div className="py-10 text-center text-[12px] text-ink-3">
        Aucune alerte pour le moment.
      </div>
    </Card>
  );
}
