import { useEffect, useMemo, useState } from "react";
import { Search, UserPlus } from "lucide-react";
import { listTeam } from "@/lib/api/team";
import type { TeamMember } from "@/lib/mock-data";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamChip } from "@/components/team/TeamChip";
import { SchedulePlanning } from "@/components/team/SchedulePlanning";
import { cn } from "@/lib/utils";

type KindFilter = "all" | TeamMember["kind"];

const KIND_LABELS: Record<KindFilter, string> = {
  all: "Tous les postes",
  service: "Salle",
  kitchen: "Cuisine",
  bar: "Bar",
  late: "En retard",
};

export default function Team() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [kind, setKind] = useState<KindFilter>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        setTeam(await listTeam());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const stats = useMemo(() => {
    const service = team.filter((m) => m.status === "service").length;
    const onBreak = team.filter((m) => m.status === "break").length;
    const late = team.filter((m) => m.status === "late").length;
    const totalHours = team.reduce((s, m) => s + (m.end - m.start), 0);
    return { service, onBreak, late, totalHours, total: team.length };
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

  return (
    <>
      <div className="flex items-end justify-between mb-5 pt-2">
        <div>
          <div className="chip-uppercase mb-1">Ressources humaines · Service du soir</div>
          <h2 className="display font-medium text-[26px] leading-tight m-0">
            Équipe <em className="not-italic italic text-ember-soft font-normal">& planning</em>
          </h2>
        </div>
        <button className="btn-primary inline-flex items-center gap-2">
          <UserPlus size={14} />
          Ajouter un membre
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-12 gap-4 mb-4">
        <StatTile className="col-span-3" label="En poste" value={stats.service} hint="Actuellement sur le service" tone="ok" />
        <StatTile className="col-span-3" label="En pause" value={stats.onBreak} hint="Pauses en cours" tone="amber" />
        <StatTile className="col-span-3" label="Retard" value={stats.late} hint="À contacter" tone="danger" />
        <StatTile
          className="col-span-3"
          label="Volume"
          value={`${stats.totalHours.toFixed(0)}h`}
          hint={`${stats.total} membres planifiés`}
          tone="cream"
        />
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="segmented">
            {(Object.keys(KIND_LABELS) as KindFilter[]).map((k) => (
              <button key={k} className={cn(kind === k && "active")} onClick={() => setKind(k)}>
                {KIND_LABELS[k]}
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

      {/* Team grid */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>
            {filtered.length} {filtered.length > 1 ? "membres" : "membre"} ·{" "}
            <span className="text-ember-soft">{KIND_LABELS[kind].toLowerCase()}</span>
          </CardTitle>
          <span className="text-[11px] text-ink-4 mono uppercase tracking-[0.08em]">
            Mise à jour il y a 2 min
          </span>
        </CardHeader>

        {loading ? (
          <div className="py-16 text-center text-ink-3 text-[13px]">Chargement…</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-ink-3 text-[13px]">
            Aucun membre ne correspond aux filtres.
          </div>
        ) : (
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}
          >
            {filtered.map((m) => (
              <TeamChip key={m.name} m={m} showHours />
            ))}
          </div>
        )}
      </Card>

      {/* Schedule Gantt */}
      <Card>
        <CardHeader>
          <CardTitle>
            Planning · <span className="text-ember-soft">service du soir</span>
          </CardTitle>
          <span className="text-[11px] text-ink-4 mono uppercase tracking-[0.08em]">
            12:00 → 02:00
          </span>
        </CardHeader>

        {loading ? (
          <div className="py-16 text-center text-ink-3 text-[13px]">Chargement…</div>
        ) : (
          <SchedulePlanning team={filtered} />
        )}
      </Card>
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
