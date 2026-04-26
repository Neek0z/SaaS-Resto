import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CalendarPlus, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useReservations } from "@/hooks/useReservations";
import { useTables, type TableEntry } from "@/hooks/useTables";
import { useAuth } from "@/contexts/AuthContext";
import type { Reservation, ResaStatus, NewReservation } from "@/lib/reservation-types";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ResaRow } from "@/components/reservations/ResaRow";
import { ReservationDrawer } from "@/components/reservations/ReservationDrawer";
import { NewReservationModal } from "@/components/reservations/NewReservationModal";
import { ReservationsPlanning } from "@/components/reservations/ReservationsPlanning";
import { cn } from "@/lib/utils";

type Service = "all" | "lunch" | "dinner";
type StatusFilter = "all" | ResaStatus;

const LUNCH_HOURS = ["12:00", "12:30", "13:00", "13:30", "14:00", "14:30"];
const DINNER_HOURS = ["19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00"];

function shiftDate(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function todayIso(): string {
  const d = new Date();
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function formatDateLabel(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function Reservations() {
  const { reservations, loading, error, date, setDate, add, update, remove } = useReservations();
  const { restaurant } = useAuth();
  const { tables } = useTables(restaurant?.id ?? null);
  const activeTables = useMemo(() => tables.filter((t) => t.active), [tables]);
  const [service, setService] = useState<Service>("dinner");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [prefill, setPrefill] = useState<{ table?: string; time?: string }>({});
  const selected = reservations.find((r) => r.id === selectedId) ?? null;

  const handleStatusChange = (id: string, nextStatus: ResaStatus) => {
    void update(id, { status: nextStatus });
  };

  const handleCreate = async (input: NewReservation) => {
    const created = await add(input);
    if (created) setNewOpen(false);
  };

  const handleDelete = async (id: string) => {
    await remove(id);
    setSelectedId(null);
  };

  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    const state = location.state as
      | { openNew?: boolean; openId?: string; date?: string }
      | null;
    if (state?.openNew) {
      setNewOpen(true);
      navigate(location.pathname, { replace: true, state: null });
    } else if (state?.openId) {
      if (state.date && state.date !== date) setDate(state.date);
      setSelectedId(state.openId);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location, navigate, date, setDate]);

  const filtered = useMemo(() => {
    return reservations.filter((r) => {
      if (service === "lunch" && Number(r.time.split(":")[0]) >= 17) return false;
      if (service === "dinner" && Number(r.time.split(":")[0]) < 17) return false;
      if (status !== "all" && r.status !== status) return false;
      if (query) {
        const q = query.toLowerCase();
        if (
          !r.name.toLowerCase().includes(q) &&
          !r.table.toLowerCase().includes(q) &&
          !r.note.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [reservations, service, status, query]);

  const stats = useMemo(() => {
    const total = reservations.length;
    const covers = reservations.reduce((s, r) => s + r.covers, 0);
    const seated = reservations.filter((r) => r.status === "seated").length;
    const confirmed = reservations.filter((r) => r.status === "confirmed").length;
    const pending = reservations.filter((r) => r.status === "pending").length;
    const noshow = reservations.filter((r) => r.status === "noshow").length;
    return { total, covers, seated, confirmed, pending, noshow };
  }, [reservations]);

  const groupedByHour = useMemo(() => {
    const hours = service === "lunch" ? LUNCH_HOURS : DINNER_HOURS;
    return hours.map((h) => ({
      hour: h,
      rows: filtered.filter((r) => matchesHour(r.time, h)),
    }));
  }, [filtered, service]);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5 pt-2">
        <div>
          <div className="chip-uppercase mb-1">Plan de salle · Live</div>
          <h2 className="display font-medium text-[22px] sm:text-[26px] leading-tight m-0">
            Réservations <em className="not-italic italic text-ember-soft font-normal">du jour</em>
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {date !== todayIso() && (
            <button
              className="text-[11px] text-ink-3 hover:text-ember-soft mono uppercase tracking-[0.08em] px-2"
              onClick={() => setDate(todayIso())}
              title="Revenir à aujourd'hui"
              type="button"
            >
              Aujourd&apos;hui
            </button>
          )}
          <button
            className="icon-btn"
            title="Jour précédent"
            onClick={() => setDate(shiftDate(date, -1))}
            type="button"
          >
            <ChevronLeft size={14} />
          </button>
          <label className="relative inline-flex items-center px-3 py-[7px] bg-bg-1 border border-line rounded-[10px] text-[13px] mono cursor-pointer hover:border-ember/40 transition-colors">
            <span className="capitalize">{formatDateLabel(date)}</span>
            <input
              type="date"
              value={date}
              onChange={(e) => {
                if (e.target.value) setDate(e.target.value);
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              aria-label="Choisir une date"
            />
          </label>
          <button
            className="icon-btn"
            title="Jour suivant"
            onClick={() => setDate(shiftDate(date, 1))}
            type="button"
          >
            <ChevronRight size={14} />
          </button>
          <button className="btn-primary ml-2" onClick={() => setNewOpen(true)}>
            <CalendarPlus size={13} />
            Nouvelle résa
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-[10px] border border-danger/40 bg-danger/10 text-danger text-[12px]">
          {error}
        </div>
      )}

      <div className="grid grid-cols-12 gap-3 sm:gap-4 mb-4">
        <StatTile className="col-span-6 sm:col-span-4 lg:col-span-2" label="Total résas" value={stats.total} hint={`${stats.covers} couverts`} tone="cream" />
        <StatTile className="col-span-6 sm:col-span-4 lg:col-span-2" label="À valider" value={stats.pending} hint="Demandes QR" tone="ember-soft" />
        <StatTile className="col-span-6 sm:col-span-4 lg:col-span-2" label="Installées" value={stats.seated} hint="À table" tone="ok" />
        <StatTile className="col-span-6 sm:col-span-4 lg:col-span-2" label="Confirmées" value={stats.confirmed} hint="À venir" tone="ember" />
        <StatTile className="col-span-6 sm:col-span-4 lg:col-span-2" label="No-shows" value={stats.noshow} hint="À recontacter" tone="danger" />
        <StatTile
          className="col-span-6 sm:col-span-4 lg:col-span-2"
          label="Remplissage"
          value={`${Math.round((stats.covers / 60) * 100)}%`}
          hint="cible 60 cv"
          tone="ember"
        />
      </div>

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
            {(["all", "pending", "confirmed", "seated", "noshow"] as const).map((s) => (
              <button
                key={s}
                className={cn(status === s && "active")}
                onClick={() => setStatus(s)}
              >
                {s === "all"
                  ? "Tous"
                  : s === "pending"
                  ? `À valider${stats.pending > 0 ? ` (${stats.pending})` : ""}`
                  : s === "seated"
                  ? "Installées"
                  : s === "confirmed"
                  ? "Confirmées"
                  : "No-shows"}
              </button>
            ))}
          </div>

          <div className="w-full sm:w-[260px] sm:ml-auto flex items-center gap-2 bg-bg-2 border border-line rounded-[10px] px-3 py-[7px] text-[13px]">
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

      <div className="grid grid-cols-12 gap-3 sm:gap-4 mb-4">
        <Card className="col-span-12 lg:col-span-8">
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
          ) : reservations.length === 0 ? (
            <div className="py-16 text-center text-ink-3 text-[13px]">
              Aucune réservation pour ce jour.
              <button
                className="block mx-auto mt-3 btn-primary"
                onClick={() => setNewOpen(true)}
              >
                <CalendarPlus size={13} /> Ajouter la première
              </button>
            </div>
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
                      rows.map((r) => (
                        <ResaRow key={r.id} r={r} onClick={() => setSelectedId(r.id)} />
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="col-span-12 lg:col-span-4">
          <CardHeader>
            <CardTitle>
              Plan · <span className="text-ember-soft">occupation tables</span>
            </CardTitle>
          </CardHeader>
          <FloorPlan
            tables={tables}
            resas={reservations}
            onSelect={(r) => setSelectedId(r.id)}
          />
          <div className="mt-4 flex items-center gap-3 text-[11px] text-ink-3 flex-wrap">
            <LegendDot color="var(--ok)" label="Installée" />
            <LegendDot color="var(--ember)" label="Confirmée" />
            <LegendDot color="var(--ember-soft)" label="À valider" />
            <LegendDot color="var(--danger)" label="No-show" />
            <LegendDot color="var(--bg-3)" label="Libre" />
          </div>
        </Card>
      </div>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>
            Planning · <span className="text-ember-soft">disponibilité tables</span>
          </CardTitle>
          <span className="text-[11px] text-ink-4 mono uppercase tracking-[0.08em]">
            {activeTables.length} table{activeTables.length > 1 ? "s" : ""} · 11h–24h
          </span>
        </CardHeader>
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="min-w-[720px]">
            <ReservationsPlanning
              date={date}
              tables={activeTables}
              resas={reservations}
              onSelectResa={(r) => setSelectedId(r.id)}
              onCreateAt={(table, time) => {
                setPrefill({ table, time });
                setNewOpen(true);
              }}
            />
          </div>
        </div>
      </Card>

      <ReservationDrawer
        resa={selected}
        onClose={() => setSelectedId(null)}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
      />
      <NewReservationModal
        open={newOpen}
        onClose={() => {
          setNewOpen(false);
          setPrefill({});
        }}
        onCreate={handleCreate}
        defaultDate={date}
        defaultTable={prefill.table}
        defaultTime={prefill.time}
        tables={activeTables}
        existingReservations={reservations}
      />
    </>
  );
}

function matchesHour(t: string, hour: string) {
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
  tone: "ember" | "ember-soft" | "ok" | "danger" | "cream";
  className?: string;
}) {
  const toneColor =
    tone === "ember"
      ? "var(--ember)"
      : tone === "ember-soft"
      ? "var(--ember-soft)"
      : tone === "ok"
      ? "var(--ok)"
      : tone === "danger"
      ? "var(--danger)"
      : "var(--ink-1)";
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

function FloorPlan({
  tables,
  resas,
  onSelect,
}: {
  tables: TableEntry[];
  resas: Reservation[];
  onSelect?: (r: Reservation) => void;
}) {
  const priority: Record<ResaStatus, number> = {
    seated: 4,
    confirmed: 3,
    pending: 2,
    noshow: 1,
  };
  const byTable = new Map<string, Reservation>();
  resas.forEach((r) => {
    const existing = byTable.get(r.table);
    if (!existing || priority[r.status] > priority[existing.status]) {
      byTable.set(r.table, r);
    }
  });

  if (tables.length === 0) {
    return (
      <div className="py-10 text-center text-[12px] text-ink-4 italic">
        Aucune table configurée.
        <br />
        Ajoutez-en depuis « QR codes ».
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-2">
      {tables.map((t) => {
        const r = byTable.get(t.number);
        const bg =
          r?.status === "seated"
            ? "bg-ok/15 border-ok/40 text-ok"
            : r?.status === "confirmed"
            ? "bg-ember/10 border-ember-deep/40 text-ember-soft"
            : r?.status === "pending"
            ? "bg-ember-soft/10 border-ember-soft/40 text-ember-soft"
            : r?.status === "noshow"
            ? "bg-danger/10 border-danger/40 text-danger"
            : "bg-bg-2 border-line text-ink-4";
        return (
          <div
            key={t.id}
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
            title={
              r
                ? `${r.name} · ${r.time} · ${r.covers} cv`
                : `Libre · ${t.capacity} cv`
            }
          >
            <div className="mono text-[13px] font-bold">{t.number}</div>
            {r ? (
              <div className="text-[9px] mt-[2px] mono">{r.time}</div>
            ) : (
              <div className="text-[9px] mt-[2px] text-ink-4">{t.capacity}cv</div>
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
