import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  EyeOff,
  Pencil,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { useTables, type TableEntry, type TableZone } from "@/hooks/useTables";
import { countUpcomingByTable } from "@/lib/api/reservations";
import { NewTableModal } from "@/components/qrcode/NewTableModal";
import { EditTableModal } from "@/components/settings/EditTableModal";
import { ConfirmDelete } from "@/components/menu/ConfirmDelete";
import { cn } from "@/lib/utils";

const ZONE_LABEL: Record<TableZone, string> = {
  inside: "Salle",
  terrace: "Terrasse",
  bar: "Bar",
  private: "Privée",
};

type ZoneFilter = "all" | TableZone;

export function TablesForm() {
  const { restaurant } = useAuth();
  const { tables, loading, error, addTable, removeTable, editTable, moveTable } =
    useTables(restaurant?.id ?? null);
  const [zoneFilter, setZoneFilter] = useState<ZoneFilter>("all");
  const [showInactive, setShowInactive] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<TableEntry | null>(null);
  const [deleting, setDeleting] = useState<TableEntry | null>(null);
  const [upcoming, setUpcoming] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!restaurant?.id) return;
    let cancelled = false;
    void countUpcomingByTable(restaurant.id).then((map) => {
      if (!cancelled) setUpcoming(map);
    });
    return () => {
      cancelled = true;
    };
  }, [restaurant?.id, tables.length]);

  const numbers = useMemo(() => tables.map((t) => t.number), [tables]);

  const filtered = useMemo(() => {
    return tables.filter((t) => {
      if (zoneFilter !== "all" && t.zone !== zoneFilter) return false;
      if (!showInactive && !t.active) return false;
      return true;
    });
  }, [tables, zoneFilter, showInactive]);

  const stats = useMemo(() => {
    const active = tables.filter((t) => t.active).length;
    const totalCapacity = tables
      .filter((t) => t.active)
      .reduce((sum, t) => sum + t.capacity, 0);
    const byZone: Record<TableZone, number> = {
      inside: 0,
      terrace: 0,
      bar: 0,
      private: 0,
    };
    for (const t of tables) byZone[t.zone] = (byZone[t.zone] ?? 0) + 1;
    return { active, totalCapacity, byZone };
  }, [tables]);

  const confirmDelete = async () => {
    if (!deleting) return;
    await removeTable(deleting.id);
    setDeleting(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>
            Tables · <span className="text-ember-soft">configuration</span>
          </CardTitle>
          <button
            className="btn-primary inline-flex items-center gap-2"
            onClick={() => setCreating(true)}
            type="button"
          >
            <Plus size={13} />
            Nouvelle table
          </button>
        </CardHeader>

        <div className="text-[12px] text-ink-3 leading-relaxed">
          Gérez les tables physiques de votre établissement. Chaque table a une
          capacité (couverts max) et une zone. Les tables actives sont proposées
          aux clients lors d'une réservation publique et apparaissent dans le
          formulaire interne.
        </div>
      </Card>

      <div className="grid grid-cols-12 gap-3">
        <StatTile
          className="col-span-6 lg:col-span-3"
          label="Tables actives"
          value={stats.active}
          hint={`${tables.length} au total`}
          tone="ok"
        />
        <StatTile
          className="col-span-6 lg:col-span-3"
          label="Capacité totale"
          value={stats.totalCapacity}
          hint="couverts (actives)"
          tone="ember"
        />
        <StatTile
          className="col-span-6 lg:col-span-3"
          label="Salle / Terrasse"
          value={`${stats.byZone.inside} / ${stats.byZone.terrace}`}
          hint="par zone principale"
          tone="cream"
        />
        <StatTile
          className="col-span-6 lg:col-span-3"
          label="Bar / Privée"
          value={`${stats.byZone.bar} / ${stats.byZone.private}`}
          hint="zones secondaires"
          tone="cream"
        />
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="segmented">
            {(["all", "inside", "terrace", "bar", "private"] as const).map((z) => (
              <button
                key={z}
                className={cn(zoneFilter === z && "active")}
                onClick={() => setZoneFilter(z)}
                type="button"
              >
                {z === "all" ? "Toutes zones" : ZONE_LABEL[z]}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-[12px] text-ink-3 cursor-pointer ml-auto">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="accent-ember"
            />
            Afficher les inactives
          </label>
        </div>

        {error && (
          <div className="mb-3 text-[12px] text-danger inline-flex items-center gap-1">
            <AlertTriangle size={12} /> {error}
          </div>
        )}

        {loading && tables.length === 0 ? (
          <div className="py-12 text-center text-ink-3 text-[13px]">
            Chargement des tables…
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-ink-3 text-[13px] italic">
            {tables.length === 0
              ? "Aucune table. Créez votre première table pour commencer."
              : "Aucune table ne correspond aux filtres."}
          </div>
        ) : (
          <div className="flex flex-col gap-0">
            {filtered.map((t, i) => {
              const upcomingCount = upcoming[t.number] ?? 0;
              return (
                <div
                  key={t.id}
                  className={cn(
                    "grid items-center gap-3 py-3 border-b border-line last:border-b-0",
                    !t.active && "opacity-60"
                  )}
                  style={{
                    gridTemplateColumns: "auto 1fr 90px 110px 110px auto",
                  }}
                >
                  <div className="flex flex-col gap-[2px]">
                    <button
                      className="icon-btn w-[22px] h-[22px] disabled:opacity-30"
                      onClick={() => void moveTable(t.id, "up")}
                      disabled={i === 0}
                      title="Monter"
                      type="button"
                    >
                      <ArrowUp size={11} />
                    </button>
                    <button
                      className="icon-btn w-[22px] h-[22px] disabled:opacity-30"
                      onClick={() => void moveTable(t.id, "down")}
                      disabled={i === filtered.length - 1}
                      title="Descendre"
                      type="button"
                    >
                      <ArrowDown size={11} />
                    </button>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[14px] font-semibold text-ink-1 inline-flex items-center gap-2">
                      Table {t.number}
                      {!t.active && (
                        <span className="chip-uppercase !text-[9.5px] px-[5px] py-[1px] rounded bg-bg-3 text-amber border border-amber/40 inline-flex items-center gap-1">
                          <EyeOff size={9} /> inactive
                        </span>
                      )}
                    </div>
                    {upcomingCount > 0 && (
                      <div className="text-[11px] text-ember-soft mono mt-[2px]">
                        {upcomingCount} réservation{upcomingCount > 1 ? "s" : ""} à venir
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[12px] text-ink-2 mono">
                    <Users size={12} className="text-ink-3" />
                    {t.capacity} cv
                  </div>
                  <div className="text-[11.5px] text-ink-3">
                    <span className="chip-uppercase !text-[10.5px]">{ZONE_LABEL[t.zone]}</span>
                  </div>
                  <div>
                    <button
                      className={cn(
                        "text-[11.5px] mono px-2 py-[5px] rounded-full border transition-colors inline-flex items-center gap-1",
                        t.active
                          ? "border-ok/40 text-ok bg-ok/10"
                          : "border-line text-ink-4 bg-bg-2"
                      )}
                      onClick={() => void editTable(t.id, { active: !t.active })}
                      title={t.active ? "Désactiver" : "Activer"}
                      type="button"
                    >
                      <CheckCircle2 size={11} />
                      {t.active ? "Active" : "Inactive"}
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      className="icon-btn"
                      onClick={() => setEditing(t)}
                      title="Modifier"
                      type="button"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      className="icon-btn hover:text-danger"
                      onClick={() => setDeleting(t)}
                      title="Supprimer"
                      type="button"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <NewTableModal
        open={creating}
        onClose={() => setCreating(false)}
        onCreate={addTable}
        existingNumbers={numbers}
      />

      <EditTableModal
        open={editing !== null}
        table={editing}
        existingNumbers={numbers.filter((n) => n !== editing?.number)}
        onClose={() => setEditing(null)}
        onSave={editTable}
      />

      <ConfirmDelete
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={() => confirmDelete()}
        title={deleting ? `Supprimer la table ${deleting.number} ?` : ""}
        body={
          deleting
            ? upcoming[deleting.number]
              ? `Attention : ${upcoming[deleting.number]} réservation(s) à venir référencent cette table. Elles ne seront pas supprimées mais leur libellé restera dans la base.`
              : "La table sera supprimée définitivement."
            : ""
        }
      />
    </div>
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
        className="display font-medium text-[28px] leading-none mt-[10px] mb-[6px]"
        style={{ color: toneColor }}
      >
        {value}
      </div>
      <div className="text-[11px] text-ink-3">{hint}</div>
    </div>
  );
}
