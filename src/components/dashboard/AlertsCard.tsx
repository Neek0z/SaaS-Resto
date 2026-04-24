import { AlertTriangle, Info } from "lucide-react";
import { ALERTS, type Alert } from "@/lib/mock-data";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function AlertsCard() {
  return (
    <Card className="col-span-5 p-[18px]">
      <CardHeader>
        <CardTitle>
          Alertes · <span className="text-ember-soft">à traiter</span>
        </CardTitle>
        <span className="text-[11.5px] text-ink-3">{ALERTS.length} en attente</span>
      </CardHeader>

      <div className="flex flex-col gap-[6px]">
        {ALERTS.map((a, i) => (
          <AlertRow key={i} a={a} />
        ))}
      </div>
    </Card>
  );
}

function AlertRow({ a }: { a: Alert }) {
  const Icon = a.level === "info" ? Info : AlertTriangle;
  const iconCls =
    a.level === "high"
      ? "bg-danger/15 text-danger"
      : a.level === "warn"
      ? "bg-amber/15 text-amber"
      : "bg-info/15 text-info";

  return (
    <div className="flex gap-[10px] items-start p-[10px_12px] rounded-lg bg-bg-2 border border-line text-[12.5px] cursor-pointer transition-colors hover:bg-bg-3">
      <div
        className={cn(
          "w-[22px] h-[22px] rounded-md flex-shrink-0 grid place-items-center",
          iconCls
        )}
      >
        <Icon size={12} />
      </div>
      <div className="flex-1">
        <div className="font-medium leading-snug">{a.text}</div>
        <div className="text-ink-3 text-[11px] mt-[2px] uppercase tracking-[0.08em]">
          {a.type} · il y a {a.minutesAgo} min
        </div>
      </div>
    </div>
  );
}
