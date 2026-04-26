import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  Calendar,
  CalendarDays,
  Copy,
  History,
  Pencil,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { useEvents } from "@/hooks/useEvents";
import {
  DAYS,
  EVENT_TYPE_LABEL,
  eventOccursOnDay,
  eventStatus,
  isActiveNow,
  isoDay,
  type EventPayload,
  type EventType,
  type RestaurantEvent,
} from "@/lib/event-types";
import { EventDrawer } from "@/components/events/EventDrawer";
import { EventBadge } from "@/components/events/EventBadge";
import { TemplatesModal } from "@/components/events/TemplatesModal";
import { ConfirmDelete } from "@/components/menu/ConfirmDelete";
import { cn } from "@/lib/utils";

type Tab = "actifs" | "historique";
type TypeFilter = "all" | EventType;

const TABS: { key: Tab; label: string; icon: typeof Calendar }[] = [
  { key: "actifs", label: "Actifs & à venir", icon: Calendar },
  { key: "historique", label: "Historique", icon: History },
];

const STATUS_LABEL: Record<"active" | "scheduled" | "expired", string> = {
  active: "Actif",
  scheduled: "Programmé",
  expired: "Expiré",
};

const STATUS_COLOR: Record<"active" | "scheduled" | "expired", string> = {
  active: "var(--ok)",
  scheduled: "var(--ember-soft)",
  expired: "var(--ink-4)",
};

function formatDateShort(iso: string | null): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
  });
}

function startOfWeek(d = new Date()): Date {
  const day = isoDay(d);
  const offset = day - 1;
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate() - offset);
  return start;
}

function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

function sameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export default function Events() {
  const {
    events,
    loading,
    error,
    addEvent,
    editEvent,
    toggleEvent,
    removeEvent,
    duplicateEvent,
    clearError,
  } = useEvents();

  const [params, setParams] = useSearchParams();
  const urlTab = params.get("tab");
  const [tab, setTab] = useState<Tab>(urlTab === "historique" ? "historique" : "actifs");

  const [drawer, setDrawer] = useState<
    | { mode: "closed" }
    | { mode: "create"; initial: EventPayload | null }
    | { mode: "edit"; event: RestaurantEvent }
  >({ mode: "closed" });
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<RestaurantEvent | null>(null);

  useEffect(() => {
    const next = new URLSearchParams(params);
    if (tab === "actifs") next.delete("tab");
    else next.set("tab", tab);
    if (next.toString() !== params.toString()) {
      setParams(next, { replace: true });
    }
  }, [tab, params, setParams]);

  const now = useMemo(() => new Date(), []);

  const partition = useMemo(() => {
    const active: RestaurantEvent[] = [];
    const expired: RestaurantEvent[] = [];
    for (const ev of events) {
      const status = eventStatus(ev, now);
      if (status === "expired") expired.push(ev);
      else active.push(ev);
    }
    return { active, expired };
  }, [events, now]);

  const kpis = useMemo(() => {
    const activeToday = events.filter((e) => isActiveNow(e, now)).length;
    const thisMonth = events.filter((e) => {
      const occursThisMonth = (() => {
        // Si récurrent : on regarde si le mois courant intersecte la plage start/end
        if (e.daysOfWeek.length > 0) {
          const start = e.startDate ? new Date(e.startDate) : null;
          const end = e.endDate ? new Date(e.endDate) : null;
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          if (start && start > monthEnd) return false;
          if (end && end < monthStart) return false;
          return true;
        }
        if (e.startDate && sameMonth(new Date(e.startDate), now)) return true;
        if (e.endDate && sameMonth(new Date(e.endDate), now)) return true;
        return false;
      })();
      return occursThisMonth && e.active;
    }).length;

    // Économies estimées : pour chaque event reduction actif, on suppose 30 couverts/jour
    // à 35€ moyens, sur les jours d'application — purement indicatif (mock).
    const estimatedSavings = events
      .filter((e) => e.active && e.type === "reduction")
      .reduce((sum, e) => {
        const days = e.daysOfWeek.length === 0 ? 7 : e.daysOfWeek.length;
        const dailyRevenue = 30 * 35;
        const reductionPct =
          e.discountType === "percent" ? (e.discountValue ?? 0) / 100 : 0;
        const flatPerCover = e.discountType === "amount" ? (e.discountValue ?? 0) : 0;
        const estimated =
          dailyRevenue * reductionPct * (days / 7) * 4.3 + flatPerCover * 30 * (days / 7) * 4.3;
        return sum + estimated;
      }, 0);

    return {
      activeToday,
      thisMonth,
      estimatedSavings: Math.round(estimatedSavings),
    };
  }, [events, now]);

  const openCreate = (initial: EventPayload | null = null) =>
    setDrawer({ mode: "create", initial });
  const openEdit = (ev: RestaurantEvent) => setDrawer({ mode: "edit", event: ev });

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5 pt-2">
        <div>
          <div className="chip-uppercase mb-1">CRM · Promotions</div>
          <h2 className="display font-medium text-[22px] sm:text-[26px] leading-tight m-0">
            Événements{" "}
            <em className="not-italic italic text-ember-soft font-normal">& offres</em>
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <TabsBar tab={tab} onChange={setTab} />
        </div>
      </div>

      {error && (
        <Card
          className="mb-4 border-danger/40"
          style={{ background: "rgba(224,80,80,0.05)" }}
        >
          <div className="flex items-center gap-2 text-danger text-[12.5px]">
            <AlertTriangle size={14} />
            <span>{error}</span>
            <button
              className="ml-auto btn-ghost text-[11px]"
              onClick={() => clearError()}
            >
              OK
            </button>
          </div>
        </Card>
      )}

      {tab === "actifs" && (
        <ActifsTab
          events={partition.active}
          allEvents={events}
          loading={loading}
          kpis={kpis}
          onCreate={() => openCreate()}
          onTemplates={() => setTemplatesOpen(true)}
          onEdit={openEdit}
          onToggle={toggleEvent}
          onDuplicate={duplicateEvent}
          onDelete={(ev) => setConfirmDelete(ev)}
        />
      )}

      {tab === "historique" && (
        <HistoriqueTab
          events={partition.expired}
          loading={loading}
          onEdit={openEdit}
          onDuplicate={duplicateEvent}
          onDelete={(ev) => setConfirmDelete(ev)}
          onReuse={(ev) => {
            const initial: EventPayload = {
              title: ev.title,
              description: ev.description,
              type: ev.type,
              discountType: ev.discountType,
              discountValue: ev.discountValue,
              loyaltyBonus: ev.loyaltyBonus,
              appliesTo: ev.appliesTo,
              appliesToId: ev.appliesToId,
              daysOfWeek: ev.daysOfWeek,
              startDate: null,
              endDate: null,
              startTime: ev.startTime,
              endTime: ev.endTime,
              displayOnCarte: ev.displayOnCarte,
              color: ev.color,
              active: true,
            };
            openCreate(initial);
          }}
        />
      )}

      <EventDrawer
        open={drawer.mode !== "closed"}
        onClose={() => setDrawer({ mode: "closed" })}
        event={drawer.mode === "edit" ? drawer.event : null}
        initial={drawer.mode === "create" ? drawer.initial : null}
        existingEvents={events}
        onCreate={addEvent}
        onUpdate={editEvent}
      />

      <TemplatesModal
        open={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
        onSelect={(payload) => openCreate(payload)}
      />

      <ConfirmDelete
        open={confirmDelete !== null}
        title="Supprimer cet événement ?"
        body={
          confirmDelete
            ? `« ${confirmDelete.title} » sera retiré définitivement.`
            : ""
        }
        onClose={() => setConfirmDelete(null)}
        onConfirm={async () => {
          if (confirmDelete) await removeEvent(confirmDelete.id);
        }}
      />
    </>
  );
}

// =============================================================
// Tabs bar
// =============================================================
function TabsBar({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <div className="segmented">
      {TABS.map((t) => (
        <button
          key={t.key}
          className={cn(tab === t.key && "active")}
          onClick={() => onChange(t.key)}
          type="button"
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// =============================================================
// Onglet 1 — Actifs & à venir
// =============================================================
function ActifsTab({
  events,
  allEvents,
  loading,
  kpis,
  onCreate,
  onTemplates,
  onEdit,
  onToggle,
  onDuplicate,
  onDelete,
}: {
  events: RestaurantEvent[];
  allEvents: RestaurantEvent[];
  loading: boolean;
  kpis: { activeToday: number; thisMonth: number; estimatedSavings: number };
  onCreate: () => void;
  onTemplates: () => void;
  onEdit: (ev: RestaurantEvent) => void;
  onToggle: (id: string) => Promise<void>;
  onDuplicate: (id: string) => Promise<RestaurantEvent | null>;
  onDelete: (ev: RestaurantEvent) => void;
}) {
  return (
    <>
      {/* KPIs */}
      <div className="grid grid-cols-12 gap-4 mb-4">
        <KpiTile
          className="col-span-4"
          label="Actifs aujourd'hui"
          value={kpis.activeToday.toString()}
          hint="Événements en cours d'application"
          tone="ok"
        />
        <KpiTile
          className="col-span-4"
          label="Programmés ce mois"
          value={kpis.thisMonth.toString()}
          hint="Y compris événements récurrents"
          tone="ember"
        />
        <KpiTile
          className="col-span-4"
          label="Estimation économies"
          value={`${kpis.estimatedSavings.toLocaleString("fr-FR")}€`}
          hint="Indicatif · base de calcul standard"
          tone="cream"
        />
      </div>

      {/* Actions */}
      <Card className="mb-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="display text-[16px] font-medium leading-tight">
              Vos événements
            </div>
            <div className="text-[11.5px] text-ink-3 mt-1">
              Gérez les promotions, les happy hours et les offres spéciales.
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="btn-ghost inline-flex items-center gap-2"
              onClick={onTemplates}
              type="button"
            >
              <Sparkles size={13} />
              Modèles rapides
            </button>
            <button
              className="btn-primary inline-flex items-center gap-2"
              onClick={onCreate}
              type="button"
            >
              <Plus size={13} />
              Nouvel événement
            </button>
          </div>
        </div>
      </Card>

      {/* Calendrier hebdo */}
      <WeekCalendar
        events={allEvents.filter((e) => e.active)}
        onEventClick={onEdit}
      />

      {/* Liste */}
      <Card>
        <CardHeader>
          <CardTitle>
            {events.length} {events.length > 1 ? "événements" : "événement"} ·{" "}
            <span className="text-ember-soft">actifs ou programmés</span>
          </CardTitle>
        </CardHeader>

        {loading ? (
          <div className="py-12 text-center text-ink-3 text-[13px]">Chargement…</div>
        ) : events.length === 0 ? (
          <div className="py-12 text-center text-ink-4 text-[13px] italic">
            Aucun événement actif. Créez-en un pour démarrer.
          </div>
        ) : (
          <EventsList
            events={events}
            onEdit={onEdit}
            onToggle={onToggle}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
          />
        )}
      </Card>
    </>
  );
}

// =============================================================
// Onglet 2 — Historique
// =============================================================
function HistoriqueTab({
  events,
  loading,
  onEdit,
  onDuplicate,
  onDelete,
  onReuse,
}: {
  events: RestaurantEvent[];
  loading: boolean;
  onEdit: (ev: RestaurantEvent) => void;
  onDuplicate: (id: string) => Promise<RestaurantEvent | null>;
  onDelete: (ev: RestaurantEvent) => void;
  onReuse: (ev: RestaurantEvent) => void;
}) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [monthFilter, setMonthFilter] = useState<string>("all"); // YYYY-MM ou "all"

  const months = useMemo(() => {
    const set = new Set<string>();
    for (const e of events) {
      const ref = e.endDate ?? e.startDate ?? e.createdAt.slice(0, 10);
      if (ref) set.add(ref.slice(0, 7));
    }
    return Array.from(set).sort().reverse();
  }, [events]);

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (typeFilter !== "all" && e.type !== typeFilter) return false;
      if (monthFilter !== "all") {
        const ref = e.endDate ?? e.startDate ?? e.createdAt.slice(0, 10);
        if (!ref.startsWith(monthFilter)) return false;
      }
      return true;
    });
  }, [events, typeFilter, monthFilter]);

  return (
    <>
      <Card className="mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="segmented">
            <button
              className={cn(typeFilter === "all" && "active")}
              onClick={() => setTypeFilter("all")}
            >
              Tous types
            </button>
            {(["reduction", "happy_hour", "menu_special", "double_points", "offre_libre"] as EventType[]).map(
              (t) => (
                <button
                  key={t}
                  className={cn(typeFilter === t && "active")}
                  onClick={() => setTypeFilter(t)}
                >
                  {EVENT_TYPE_LABEL[t]}
                </button>
              )
            )}
          </div>

          <select
            className="bg-bg-2 border border-line rounded-[10px] px-3 py-[7px] text-[12.5px] text-ink-2 outline-none focus:border-line-2 ml-auto"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
          >
            <option value="all">Tous les mois</option>
            {months.map((m) => {
              const [y, mn] = m.split("-").map(Number);
              const label = new Date(y, mn - 1, 1).toLocaleDateString("fr-FR", {
                month: "long",
                year: "numeric",
              });
              return (
                <option key={m} value={m}>
                  {label}
                </option>
              );
            })}
          </select>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {filtered.length} événement{filtered.length > 1 ? "s" : ""} expiré
            {filtered.length > 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>

        {loading ? (
          <div className="py-12 text-center text-ink-3 text-[13px]">Chargement…</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-ink-4 text-[13px] italic">
            Aucun événement dans l'historique.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((ev) => (
              <div
                key={ev.id}
                className="flex items-center gap-3 p-3 rounded-[10px] bg-bg-2 border border-line opacity-80"
              >
                <EventBadge event={ev} size="md" />
                <div className="flex-1 min-w-0 text-[11.5px] text-ink-4">
                  {formatDateShort(ev.startDate)} → {formatDateShort(ev.endDate)}
                </div>
                <button
                  className="btn-ghost inline-flex items-center gap-1 text-[11.5px]"
                  onClick={() => onReuse(ev)}
                  title="Réutiliser ce modèle"
                  type="button"
                >
                  <RotateCcw size={12} />
                  Réutiliser
                </button>
                <button
                  className="icon-btn w-[26px] h-[26px]"
                  onClick={() => onEdit(ev)}
                  title="Voir / éditer"
                  type="button"
                >
                  <Pencil size={11} />
                </button>
                <button
                  className="icon-btn w-[26px] h-[26px]"
                  onClick={() => void onDuplicate(ev.id)}
                  title="Dupliquer"
                  type="button"
                >
                  <Copy size={11} />
                </button>
                <button
                  className="icon-btn w-[26px] h-[26px] hover:text-danger"
                  onClick={() => onDelete(ev)}
                  title="Supprimer"
                  type="button"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}

// =============================================================
// Calendrier hebdomadaire
// =============================================================
function WeekCalendar({
  events,
  onEventClick,
}: {
  events: RestaurantEvent[];
  onEventClick: (ev: RestaurantEvent) => void;
}) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek());
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );
  const today = new Date();
  const todayKey = today.toDateString();

  const eventsByDay = useMemo(() => {
    return days.map((d) => events.filter((e) => eventOccursOnDay(e, d)));
  }, [days, events]);

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="inline-flex items-center gap-2">
          <CalendarDays size={13} />
          Semaine du {weekStart.toLocaleDateString("fr-FR", { day: "2-digit", month: "long" })}
        </CardTitle>
        <div className="flex items-center gap-2">
          <button
            className="icon-btn w-[26px] h-[26px]"
            onClick={() => setWeekStart(addDays(weekStart, -7))}
            type="button"
            title="Semaine précédente"
          >
            ‹
          </button>
          <button
            className="btn-ghost text-[11.5px]"
            onClick={() => setWeekStart(startOfWeek())}
            type="button"
          >
            Aujourd'hui
          </button>
          <button
            className="icon-btn w-[26px] h-[26px]"
            onClick={() => setWeekStart(addDays(weekStart, 7))}
            type="button"
            title="Semaine suivante"
          >
            ›
          </button>
        </div>
      </CardHeader>

      <div className="grid grid-cols-7 gap-1">
        {days.map((d, i) => {
          const isToday = d.toDateString() === todayKey;
          const dayEvents = eventsByDay[i];
          return (
            <div
              key={d.toISOString()}
              className={cn(
                "rounded-[10px] border bg-bg-2 min-h-[140px] flex flex-col",
                isToday ? "border-ember/60" : "border-line"
              )}
            >
              <div
                className={cn(
                  "px-2 py-1.5 border-b text-[10.5px] uppercase tracking-[0.06em] font-semibold flex items-center justify-between",
                  isToday ? "border-ember/40 text-ember-soft" : "border-line text-ink-4"
                )}
              >
                <span>{DAYS[i].short}</span>
                <span className="mono text-[11px]">{d.getDate()}</span>
              </div>
              <div className="flex-1 p-1.5 flex flex-col gap-1 overflow-hidden">
                {dayEvents.length === 0 ? (
                  <span className="text-[10.5px] text-ink-4 italic m-auto">—</span>
                ) : (
                  dayEvents.slice(0, 4).map((ev) => (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={() => onEventClick(ev)}
                      className="text-left px-[6px] py-[4px] rounded-[6px] text-[10.5px] font-semibold leading-tight transition-all hover:opacity-80 truncate"
                      style={{
                        background: `${ev.color}22`,
                        color: ev.color,
                        borderLeft: `2px solid ${ev.color}`,
                      }}
                      title={ev.title}
                    >
                      <div className="truncate">{ev.title}</div>
                      {(ev.startTime || ev.endTime) && (
                        <div className="text-[9.5px] opacity-80 mono mt-[1px]">
                          {ev.startTime ?? "—"}–{ev.endTime ?? "—"}
                        </div>
                      )}
                    </button>
                  ))
                )}
                {dayEvents.length > 4 && (
                  <span className="text-[9.5px] text-ink-4 mono">
                    +{dayEvents.length - 4} autres
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// =============================================================
// Liste d'événements (utilisée onglet 1)
// =============================================================
function EventsList({
  events,
  onEdit,
  onToggle,
  onDuplicate,
  onDelete,
}: {
  events: RestaurantEvent[];
  onEdit: (ev: RestaurantEvent) => void;
  onToggle: (id: string) => Promise<void>;
  onDuplicate: (id: string) => Promise<RestaurantEvent | null>;
  onDelete: (ev: RestaurantEvent) => void;
}) {
  const sorted = useMemo(() => {
    return [...events].sort((a, b) => {
      const aRef = a.startDate ?? a.createdAt.slice(0, 10);
      const bRef = b.startDate ?? b.createdAt.slice(0, 10);
      return aRef.localeCompare(bRef);
    });
  }, [events]);

  return (
    <div className="flex flex-col gap-2">
      {sorted.map((ev) => {
        const status = eventStatus(ev);
        return (
          <div
            key={ev.id}
            className={cn(
              "flex items-center gap-3 p-3 rounded-[10px] bg-bg-2 border border-line transition-colors hover:border-line-2",
              !ev.active && "opacity-60"
            )}
          >
            <EventBadge event={ev} size="md" />

            <div className="flex-1 min-w-0">
              <div className="text-[11px] text-ink-3 leading-snug">
                {recurrenceLabel(ev)}
              </div>
              {ev.description && (
                <div className="text-[11px] text-ink-4 truncate mt-[1px]">
                  {ev.description}
                </div>
              )}
            </div>

            <span
              className="text-[10.5px] mono uppercase tracking-[0.06em] font-semibold px-2 py-[2px] rounded-md flex-shrink-0"
              style={{
                background: `${STATUS_COLOR[status]}22`,
                color: STATUS_COLOR[status],
              }}
            >
              {STATUS_LABEL[status]}
            </span>

            <ToggleDot active={ev.active} onChange={() => void onToggle(ev.id)} />

            <button
              className="icon-btn w-[26px] h-[26px]"
              onClick={() => onEdit(ev)}
              title="Éditer"
              type="button"
            >
              <Pencil size={11} />
            </button>
            <button
              className="icon-btn w-[26px] h-[26px]"
              onClick={() => void onDuplicate(ev.id)}
              title="Dupliquer"
              type="button"
            >
              <Copy size={11} />
            </button>
            <button
              className="icon-btn w-[26px] h-[26px] hover:text-danger"
              onClick={() => onDelete(ev)}
              title="Supprimer"
              type="button"
            >
              <Trash2 size={11} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

function recurrenceLabel(ev: RestaurantEvent): string {
  const parts: string[] = [];
  if (ev.daysOfWeek.length > 0) {
    if (ev.daysOfWeek.length === 7) parts.push("Tous les jours");
    else if (
      ev.daysOfWeek.length === 5 &&
      ev.daysOfWeek.every((d) => d <= 5)
    )
      parts.push("Lundi → vendredi");
    else if (
      ev.daysOfWeek.length === 2 &&
      ev.daysOfWeek.includes(6) &&
      ev.daysOfWeek.includes(7)
    )
      parts.push("Week-end");
    else
      parts.push(
        ev.daysOfWeek
          .map((n) => DAYS.find((d) => d.num === n)?.short ?? "")
          .filter(Boolean)
          .join(" · ")
      );
  } else if (ev.startDate || ev.endDate) {
    parts.push(`${formatDateShort(ev.startDate)} → ${formatDateShort(ev.endDate)}`);
  } else {
    parts.push("Sans planification");
  }
  if (ev.startTime && ev.endTime) parts.push(`${ev.startTime}–${ev.endTime}`);
  return parts.join(" · ");
}

// =============================================================
// Helpers UI
// =============================================================
function KpiTile({
  label,
  value,
  hint,
  tone,
  className,
}: {
  label: string;
  value: string;
  hint: string;
  tone: "ember" | "ok" | "danger" | "cream";
  className?: string;
}) {
  const toneColor =
    tone === "ember"
      ? "var(--ember-soft)"
      : tone === "ok"
      ? "var(--ok)"
      : tone === "danger"
      ? "var(--danger)"
      : "var(--ink-1)";
  return (
    <div className={cn("kpi", className)}>
      <div className="chip-uppercase">{label}</div>
      <div
        className="display font-medium text-[34px] leading-none mt-[12px] mb-[8px]"
        style={{ color: toneColor }}
      >
        {value}
      </div>
      <div className="text-[11.5px] text-ink-3">{hint}</div>
    </div>
  );
}

function ToggleDot({
  active,
  onChange,
}: {
  active: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onChange(!active);
      }}
      className={cn(
        "relative w-[28px] h-[16px] rounded-full transition-colors flex-shrink-0",
        active ? "bg-ember" : "bg-bg-3 border border-line"
      )}
      title={active ? "Actif" : "Inactif"}
    >
      <span
        className={cn(
          "absolute top-[2px] w-[10px] h-[10px] rounded-full bg-cream transition-all",
          active ? "left-[15px]" : "left-[2px]"
        )}
      />
    </button>
  );
}
