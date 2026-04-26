import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search, UserPlus } from "lucide-react";
import { useTeam } from "@/hooks/useTeam";
import {
  KIND_LABEL,
  type ResolvedTeamMember,
  type TeamMemberKind,
} from "@/lib/team-types";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamChip } from "@/components/team/TeamChip";
import { SchedulePlanning } from "@/components/team/SchedulePlanning";
import { TeamMemberModal } from "@/components/team/TeamMemberModal";
import { cn } from "@/lib/utils";

type KindFilter = "all" | TeamMemberKind;

function todayIso(): string {
  const d = new Date();
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function shiftDate(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
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

const KIND_FILTERS: Record<KindFilter, string> = {
  all: "Tous les postes",
  service: KIND_LABEL.service,
  kitchen: KIND_LABEL.kitchen,
  bar: KIND_LABEL.bar,
  late: KIND_LABEL.late,
};

export default function Team() {
  const [date, setDate] = useState<string>(todayIso());
  const { team, loading, error, add, update, remove, upsertShift, deleteShift } =
    useTeam(date);
  const [kind, setKind] = useState<KindFilter>("all");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<ResolvedTeamMember | null>(null);
  const [creating, setCreating] = useState(false);

  const stats = useMemo(() => {
    const planned = team.filter((m) => m.shift !== null);
    const service = planned.filter((m) => m.shift!.status === "service").length;
    const onBreak = planned.filter((m) => m.shift!.status === "break").length;
    const late = planned.filter((m) => m.shift!.status === "late").length;
    const totalHours = planned.reduce(
      (s, m) => s + (m.shift!.end - m.shift!.start),
      0
    );
    return { service, onBreak, late, totalHours, total: planned.length };
  }, [team]);

  const filtered = useMemo(() => {
    return team.filter((m) => {
      if (kind !== "all" && m.kind !== kind) return false;
      if (query) {
        const q = query.toLowerCase();
        if (!m.name.toLowerCase().includes(q) && !m.role.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [team, kind, query]);

  const modalOpen = creating || editing !== null;
  const closeModal = () => {
    setCreating(false);
    setEditing(null);
  };

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5 pt-2">
        <div>
          <div className="chip-uppercase mb-1">Ressources humaines · Service du soir</div>
          <h2 className="display font-medium text-[22px] sm:text-[26px] leading-tight m-0">
            Équipe <em className="not-italic italic text-ember-soft font-normal">& planning</em>
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
          <button
            className="btn-primary inline-flex items-center gap-2 ml-2"
            onClick={() => setCreating(true)}
          >
            <UserPlus size={14} />
            Ajouter un membre
          </button>
        </div>
      </div>

      {error && (
        <Card className="mb-4 border-danger/40">
          <div className="text-[12px] text-danger">{error}</div>
        </Card>
      )}

      <div className="grid grid-cols-12 gap-4 mb-4">
        <StatTile className="col-span-3" label="En poste" value={stats.service} hint="Actuellement sur le service" tone="ok" />
        <StatTile className="col-span-3" label="En pause" value={stats.onBreak} hint="Pauses en cours" tone="amber" />
        <StatTile className="col-span-3" label="Retard" value={stats.late} hint="À contacter" tone="danger" />
        <StatTile
          className="col-span-3"
          label="Volume"
          value={`${stats.totalHours.toFixed(0)}h`}
          hint={`${stats.total} membre${stats.total > 1 ? "s" : ""} planifié${stats.total > 1 ? "s" : ""}`}
          tone="cream"
        />
      </div>

      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="segmented">
            {(Object.keys(KIND_FILTERS) as KindFilter[]).map((k) => (
              <button key={k} className={cn(kind === k && "active")} onClick={() => setKind(k)}>
                {KIND_FILTERS[k]}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2 bg-bg-2 border border-line rounded-[10px] px-3 py-[7px] w-[260px] text-[13px]">
            <Search size={14} className="text-ink-3" />
            <input
              className="flex-1 bg-transparent border-0 outline-none text-ink-1 placeholder:text-ink-3"
              placeholder="Nom, poste…"
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

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>
            {filtered.length} {filtered.length > 1 ? "membres" : "membre"} ·{" "}
            <span className="text-ember-soft">{KIND_FILTERS[kind].toLowerCase()}</span>
          </CardTitle>
          <span className="text-[11px] text-ink-4 mono uppercase tracking-[0.08em]">
            {team.length > 0 ? "Cliquez un membre pour modifier" : ""}
          </span>
        </CardHeader>

        {loading && team.length === 0 ? (
          <div className="py-16 text-center text-ink-3 text-[13px]">Chargement…</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-ink-3 text-[13px]">
            {team.length === 0
              ? "Aucun membre. Ajoutez votre première équipe pour commencer."
              : "Aucun membre ne correspond aux filtres."}
          </div>
        ) : (
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}
          >
            {filtered.map((m) => (
              <button
                key={m.id}
                onClick={() => setEditing(m)}
                className="text-left"
                aria-label={`Modifier ${m.name}`}
              >
                <TeamChip m={m} showHours />
              </button>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Planning · <span className="text-ember-soft capitalize">{formatDateLabel(date)}</span>
          </CardTitle>
          <span className="text-[11px] text-ink-4 mono uppercase tracking-[0.08em]">
            12:00 → 02:00
          </span>
        </CardHeader>

        {loading && team.length === 0 ? (
          <div className="py-16 text-center text-ink-3 text-[13px]">Chargement…</div>
        ) : (
          <SchedulePlanning team={filtered} date={date} />
        )}
      </Card>

      <TeamMemberModal
        open={modalOpen}
        member={editing}
        date={date}
        onClose={closeModal}
        onCreate={add}
        onUpdate={update}
        onDelete={remove}
        onUpsertShift={upsertShift}
        onDeleteShift={deleteShift}
      />
    </>
  );
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
  tone: "ember" | "ok" | "amber" | "danger" | "cream";
  className?: string;
}) {
  const toneColor =
    tone === "ember"
      ? "var(--ember-soft)"
      : tone === "ok"
      ? "var(--ok)"
      : tone === "amber"
      ? "var(--amber)"
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
