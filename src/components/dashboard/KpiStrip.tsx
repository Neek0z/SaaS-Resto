import { useState } from "react";
import { Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Delta } from "./Delta";
import { useDashboardCtx } from "@/hooks/useDashboard";
import { cn, formatEuros } from "@/lib/utils";
import { RoleGate } from "@/components/RoleGate";

type Period = "today" | "week" | "month";

function KpiLink({
  to,
  className,
  children,
}: {
  to: string;
  className?: string;
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => navigate(to)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate(to);
        }
      }}
      className={cn(
        "cursor-pointer hover:border-line-2 hover:bg-bg-2/30 focus:outline-none focus:ring-2 focus:ring-ember/40 transition-colors",
        className
      )}
    >
      {children}
    </div>
  );
}

export function KpiStrip() {
  const [period, setPeriod] = useState<Period>("today");
  const { data, loading, error } = useDashboardCtx();

  if (error) {
    return (
      <div className="kpi col-span-12 mb-4 text-[12px] text-danger">{error}</div>
    );
  }

  if (!data || loading) {
    return (
      <div className="grid grid-cols-12 gap-3 sm:gap-4 mb-4">
        <div className="kpi hero col-span-12 lg:col-span-4 animate-pulse h-[160px]" />
        <div className="kpi col-span-12 sm:col-span-6 lg:col-span-3 animate-pulse h-[160px]" />
        <div className="kpi col-span-12 sm:col-span-6 lg:col-span-2 animate-pulse h-[160px]" />
        <div className="kpi col-span-12 sm:col-span-12 lg:col-span-3 animate-pulse h-[160px]" />
      </div>
    );
  }

  const k = data.kpis;
  const rev =
    period === "today" ? k.revenue.today : period === "week" ? k.revenue.week : k.revenue.month;
  const revDelta =
    period === "today"
      ? k.revenue.todayDelta
      : period === "week"
      ? k.revenue.weekDelta
      : k.revenue.monthDelta;

  const progress = k.covers.goal === 0 ? 0 : Math.round((k.covers.value / k.covers.goal) * 100);
  const sparkData = data.revenue7d.flatMap((d) => [d.lunch, d.dinner]);
  const placesLeft = Math.max(0, k.covers.goal - k.covers.value);

  return (
    <div className="grid grid-cols-12 gap-3 sm:gap-4 mb-4">
      {/* Hero revenue */}
      <KpiLink to="/commandes" className="kpi hero col-span-12 lg:col-span-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.12em] text-ink-3 font-semibold">
              Chiffre d'affaires
            </div>
            <div className="display font-medium text-[38px] leading-none mt-[14px] mb-[10px] tracking-[-0.02em]">
              {formatEuros(rev)}
              <span className="text-[18px] text-ink-3 ml-[2px] font-normal"> €</span>
            </div>
            <div className="flex items-center gap-2">
              <Delta value={revDelta} />
              <span className="text-ink-3 text-[12px]">vs. période précédente</span>
            </div>
          </div>
          <div
            className="segmented"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {(["today", "week", "month"] as const).map((p) => (
              <button
                key={p}
                className={cn(period === p && "active")}
                onClick={() => setPeriod(p)}
              >
                {p === "today" ? "Jour" : p === "week" ? "Semaine" : "Mois"}
              </button>
            ))}
          </div>
        </div>
        {sparkData.length > 1 && <Spark data={sparkData} />}
      </KpiLink>

      {/* Couverts */}
      <KpiLink to="/reservations" className="kpi col-span-12 sm:col-span-6 lg:col-span-3">
        <div className="text-[11px] uppercase tracking-[0.12em] text-ink-3 font-semibold">
          Couverts · ce soir
        </div>
        <div className="display font-medium text-[38px] leading-none mt-[14px] mb-[10px]">
          {k.covers.value}
          <span className="text-[18px] text-ink-3 font-normal"> / {k.covers.goal}</span>
        </div>
        <Delta value={k.covers.delta} />
        <div className="flex gap-[3px] mt-3">
          {Array.from({ length: 16 }).map((_, i) => {
            const isFilled = i < Math.floor(progress / (100 / 16));
            return (
              <div
                key={i}
                className="flex-1 h-[6px] rounded-sm"
                style={{ background: isFilled ? "var(--ember)" : "var(--bg-3)" }}
              />
            );
          })}
        </div>
        <div className="text-[11.5px] text-ink-3 mt-[10px]">
          {progress}% de l'objectif · {placesLeft} places restantes
        </div>
      </KpiLink>

      {/* Panier moyen — sensible (marges), restreint au rôle owner+ */}
      <RoleGate
        resource="action.view_margins"
        fallback={
          <div className="kpi col-span-12 sm:col-span-6 lg:col-span-2 flex flex-col justify-center items-start gap-2 opacity-70">
            <div className="text-[11px] uppercase tracking-[0.12em] text-ink-3 font-semibold flex items-center gap-[6px]">
              <Lock size={11} />
              Panier moyen
            </div>
            <div className="text-[12px] text-ink-3 leading-snug">
              Visible avec un accès propriétaire.
            </div>
          </div>
        }
      >
        <KpiLink to="/commandes" className="kpi col-span-12 sm:col-span-6 lg:col-span-2">
          <div className="text-[11px] uppercase tracking-[0.12em] text-ink-3 font-semibold">
            Panier moyen
          </div>
          <div className="display font-medium text-[38px] leading-none mt-[14px] mb-[10px]">
            {k.avgTicket.value.toFixed(1).replace(".", ",")}
            <span className="text-[18px] text-ink-3 font-normal"> €</span>
          </div>
          <Delta value={k.avgTicket.delta} />
          <div className="text-[11.5px] text-ink-3 mt-[10px]">
            Sur les commandes du jour
          </div>
        </KpiLink>
      </RoleGate>

      {/* Occupation */}
      <KpiLink to="/reservations" className="kpi col-span-12 sm:col-span-12 lg:col-span-3">
        <div className="text-[11px] uppercase tracking-[0.12em] text-ink-3 font-semibold">
          Taux d'occupation
        </div>
        <div className="display font-medium text-[38px] leading-none mt-[14px] mb-[10px]">
          {k.occupancy.value}
          <span className="text-[18px] text-ink-3 font-normal"> %</span>
        </div>
        <Delta value={k.occupancy.delta} />
        <div className="flex gap-[3px] mt-3">
          {Array.from({ length: k.occupancy.tables.total }).map((_, i) => {
            const isOn = i < k.occupancy.tables.occupied;
            return (
              <div
                key={i}
                className="flex-1 h-[6px] rounded-sm"
                style={{ background: isOn ? "var(--ember)" : "var(--bg-3)" }}
              />
            );
          })}
        </div>
        <div className="text-[11.5px] text-ink-3 mt-[10px]">
          {k.occupancy.tables.occupied} / {k.occupancy.tables.total} tables occupées ·{" "}
          {k.occupancy.tables.total - k.occupancy.tables.occupied} libres
        </div>
      </KpiLink>
    </div>
  );
}

function Spark({ data, color = "var(--ember)" }: { data: number[]; color?: string }) {
  const w = 300;
  const h = 40;
  const pad = 2;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return [x, y] as const;
  });
  const path = pts.map((p, i) => (i === 0 ? "M" : "L") + p[0] + "," + p[1]).join(" ");
  const area = path + ` L${pts[pts.length - 1][0]},${h} L${pts[0][0]},${h} Z`;
  return (
    <svg
      className="absolute left-0 right-0 bottom-0 h-[40px] w-full opacity-80 pointer-events-none"
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="spark-grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark-grad)" />
      <path d={path} stroke={color} strokeWidth="1.5" fill="none" />
    </svg>
  );
}
