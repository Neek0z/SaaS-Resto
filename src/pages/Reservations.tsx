import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CalendarPlus, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { listReservations } from "@/lib/api/reservations";
import type { Reservation, ResaStatus } from "@/lib/mock-data";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ResaRow } from "@/components/reservations/ResaRow";
import { ReservationDrawer } from "@/components/reservations/ReservationDrawer";
import { NewReservationModal } from "@/components/reservations/NewReservationModal";
import { cn } from "@/lib/utils";

type Service = "all" | "lunch" | "dinner";
type StatusFilter = "all" | ResaStatus;

const LUNCH_HOURS = ["12:00", "12:30", "13:00", "13:30", "14:00", "14:30"];
const DINNER_HOURS = ["19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00"];

export default function Reservations() {
  const [resas, setResas] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [service, setService] = useState<Service>("dinner");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const [dateLabel] = useState("Vendredi 24 avril 2026");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const keyOf = (r: Reservation) => `${r.time}-${r.table}`;
  const selected = resas.find((r) => keyOf(r) === selectedKey) ?? null;

  const updateStatus = (key: string, status: ResaStatus) => {
    setResas((prev) => prev.map((r) => (keyOf(r) === key ? { ...r, status } : r)));
  };

  const addResa = (r: Reservation) => {
    setResas((prev) => [...prev, r].sort((a, b) => a.time.localeCompare(b.time)));
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        setResas(await listReservations());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    const state = location.state as { openNew?: boolean } | null;
    if (state?.openNew) {
      setNewOpen(true);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location, navigate]);

  const filtered = useMemo(() => {
    return resas.filter((r) => {
      if (service === "lunch" && !LUNCH_HOURS.some((h) => r.time.startsWith(h.slice(0, 2)))) return false;
      if (service === "dinner" && Number(r.time.split(":")[0]) < 17) return false;
      if (service === "lunch" && Number(r.time.split(":")[0]) >= 17) return false;
      if (status !== "all" && r.status !== status) return false;
      if (query) {
        const q = query.toLowerCase();
        if (
          !r.name.toLowerCase().includes(q) &&
          !r.table.toLowerCase().includes(q) &&
          !(r.note ?? "").toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [resas, service, status, query]);

  const stats = useMemo(() => {
    const total = resas.length;
    const covers = resas.reduce((s, r) => s + r.covers, 0);
    const seated = resas.filter((r) => r.status === "seated").length;
    const confirmed = resas.filter((r) => r.status === "confirmed").length;
    const noshow = resas.filter((r) => r.status === "noshow").length;
    return { total, covers, seated, confirmed, noshow };
  }, [resas]);

  // Group filtered resas by hour slot for timeline
  const groupedByHour = useMemo(() => {
    const hours = service === "lunch" ? LUNCH_HOURS : DINNER_HOURS;
    return hours.map((h) => ({
      hour: h,
      rows: filtered.filter((r) => r.time.startsWith(h.slice(0, 2)) && matchesHour(r.time, h)),
    }));
  }, [filtered, service]);

  return (
    <>
      <div className="flex items-end justify-between mb-5 pt-2">
        <div>
          <div className="chip-uppercase mb-1">Plan de salle · Live</div>
          <h2 className="display font-medium text-[26px] leading-tight m-0">
            Réservations <em className="not-italic italic text-ember-soft font-normal">du jour</em>
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button className="icon-btn" title="Jour précédent">
            <ChevronLeft size={14} />
          </button>
          <div className="px-4 py-[7px] bg-bg-1 border border-line rounded-[10px] text-[13px] mono">
            {dateLabel}
          </div>
          <button className="icon-btn" title="Jour suivant">
            <ChevronRight size={14} />
          </button>
          <button className="btn-primary ml-2" onClick={() => setNewOpen(true)}>
            <CalendarPlus size={13} />
            Nouvelle résa
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-12 gap-4 mb-4">
        <StatTile className="col-span-3" label="Total résas" value={stats.total} hint={`${stats.covers} couverts`} tone="cream" />
        <StatTile className="col-span-2" label="Installées" value={stats.seated} hint="À table" tone="ok" />
        <StatTile className="col-span-2" label="Confirmées" value={stats.confirmed} hint="À venir" tone="ember" />
        <StatTile className="col-span-2" label="No-shows" value={stats.noshow} hint="À recontacter" tone="danger" />
        <StatTile
          className="col-span-3"
          label="Taux de remplissage"
          value={`${Math.round((stats.covers / 60) * 100)}%`}
          hint="60 couverts cibles ce service"
          tone="ember"
        />
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="segmented">
            {(["all", "lunch", "dinner"] as const).map((s) => (
              <button
                key={s}
                className={cn(service === s && "active")}
                onClick={() => setService(s)}
              >
                {s === "all" ? "Journée" : s === "lunch" ? "Déjeuner" : "Dîner"}
              </button>
            ))}
          </div>

          <span className="text-ink-4 text-[11px]">|</span>

          <div className="segmented">
            {(["all", "seated", "confirmed", "noshow"] as const).map((s) => (
              <button
                key={s}
                className={cn(status === s && "active")}
                onClick={() => setStatus(s)}
              >
                {s === "all"
                  ? "Tous"
                  : s === "seated"
                  ? "Installées"
                  : s === "confirmed"
                  ? "Confirmées"
                  : "No-shows"}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2 bg-bg-2 border border-line rounded-[10px] px-3 py-[7px] w-[260px] text-[13px]">
            <Search size={14} className="text-ink-3" />
            <input
              className="flex-1 bg-transparent border-0 outline-none text-ink-1 placeholder:text-ink-3"
              placeholder="Nom, table, note…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button className="text-ink-4 hover:text-ink-2 text-[11px]" onClick={() => setQuery("")}>
                ×
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Two-column: timeline + floor plan */}
      <div className="grid grid-cols-12 gap-4 mb-4">
        <Card className="col-span-8">
          <CardHeader>
            <CardTitle>
              Timeline · <span className="text-ember-soft">{service === "lunch" ? "service midi" : service === "dinner" ? "service du soir" : "journée"}</span>
            </CardTitle>
            <span className="text-[11px] text-ink-4 mono uppercase tracking-[0.08em]">
              {filtered.length} résa{filtered.length > 1 ? "s" : ""}
            </span>
          </CardHeader>

          {loading ? (
            <div className="py-16 text-center text-ink-3 text-[13px]">Chargement…</div>
          ) : (
            <div className="flex flex-col gap-3">
              {groupedByHour.map(({ hour, rows }) => (
                <div key={hour} className="grid gap-3" style={{ gridTemplateColumns: "60px 1fr" }}>
                  <div className="mono text-[11px] text-ink-4 pt-3 uppercase tracking-[0.1em] border-r border-line pr-2">
                    {hour}
                  </div>
                  <div className="flex flex-col gap-[2px] min-h-[36px]">
                    {rows.length === 0 ? (
                      <div className="text-[11px] text-ink-4 italic pt-2">—</div>
                    ) : (
                      rows.map((r, i) => (
                        <ResaRow key={`${r.time}-${i}`} r={r} onClick={() => setSelectedKey(keyOf(r))} />
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>
              Plan · <span className="text-ember-soft">occupation tables</span>
            </CardTitle>
          </CardHeader>
          <FloorPlan resas={resas} onSelect={(r) => setSelectedKey(keyOf(r))} />
          <div className="mt-4 flex items-center gap-3 text-[11px] text-ink-3 flex-wrap">
            <LegendDot color="var(--ok)" label="Installée" />
            <LegendDot color="var(--ember)" label="Confirmée" />
            <LegendDot color="var(--danger)" label="No-show" />
            <LegendDot color="var(--bg-3)" label="Libre" />
          </div>
        </Card>
      </div>

      <ReservationDrawer
        resa={selected}
        onClose={() => setSelectedKey(null)}
        onStatusChange={updateStatus}
      />
      <NewReservationModal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        onCreate={addResa}
      />
    </>
  );
}

function matchesHour(t: string, hour: string) {
  // t like "19:45", hour like "19:30" → bucket by 30-min slot
  const [th, tm] = t.split(":").map(Number);
  const [hh, hm] = hour.split(":").map(Number);
  if (th !== hh) return false;
  return tm >= hm && tm < hm + 30;
}

function StatTile({
  label,
  value,
  hint,
  tone,
  className,
}: {
  label: string;
  value: string | number;
  hint: string;
  tone: "ember" | "ok" | "danger" | "cream";
  className?: string;
}) {
  const toneColor =
    tone === "ember" ? "var(--ember-soft)" : tone === "ok" ? "var(--ok)" : tone === "danger" ? "var(--danger)" : "var(--ink-1)";
  return (
    <div className={cn("kpi", className)}>
      <div className="chip-uppercase">{label}</div>
      <div className="display font-medium text-[32px] leading-none mt-[12px] mb-[8px]" style={{ color: toneColor }}>
        {value}
      </div>
      <div className="text-[11.5px] text-ink-3">{hint}</div>
    </div>
  );
}

function FloorPlan({ resas, onSelect }: { resas: Reservation[]; onSelect?: (r: Reservation) => void }) {
  // Build a simple grid of tables T1..T20 with status color
  const tables = Array.from({ length: 20 }, (_, i) => `T${i + 1}`);
  const byTable = new Map<string, Reservation>();
  resas.forEach((r) => {
    // keep the most advanced status (seated > confirmed > noshow)
    const existing = byTable.get(r.table);
    if (!existing) byTable.set(r.table, r);
    else if (existing.status === "noshow" || (existing.status === "confirmed" && r.status === "seated")) {
      byTable.set(r.table, r);
    }
  });

  return (
    <div className="grid grid-cols-4 gap-2">
      {tables.map((t) => {
        const r = byTable.get(t);
        const bg =
          r?.status === "seated"
            ? "bg-ok/15 border-ok/40 text-ok"
            : r?.status === "confirmed"
            ? "bg-ember/10 border-ember-deep/40 text-ember-soft"
            : r?.status === "noshow"
            ? "bg-danger/10 border-danger/40 text-danger"
            : "bg-bg-2 border-line text-ink-4";
        return (
          <div
            key={t}
            role={r ? "button" : undefined}
            tabIndex={r ? 0 : undefined}
            onClick={() => r && onSelect?.(r)}
            onKeyDown={(e) => {
              if (r && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                onSelect?.(r);
              }
            }}
            className={cn(
              "aspect-square rounded-lg border flex flex-col items-center justify-center transition-all hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-ember/40",
              bg,
              r ? "cursor-pointer hover:-translate-y-[1px]" : "cursor-default"
            )}
            title={r ? `${r.name} · ${r.time} · ${r.covers} cv` : "Libre"}
          >
            <div className="mono text-[13px] font-bold">{t}</div>
            {r ? (
              <div className="text-[9px] mt-[2px] mono">{r.time}</div>
            ) : (
              <div className="text-[9px] mt-[2px] text-ink-4">Libre</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-[5px]">
      <span className="w-2 h-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
