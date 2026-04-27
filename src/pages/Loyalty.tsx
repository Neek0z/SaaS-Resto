import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowDownUp,
  Download,
  Gift,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
  UserPlus,
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { useLoyalty } from "@/hooks/useLoyalty";
import {
  TIER_COLOR,
  TIER_LABEL,
  type LoyaltyConfig,
  type LoyaltyCustomer,
  type LoyaltyReward,
  type LoyaltyTier,
} from "@/lib/loyalty-types";
import { CustomerDrawer } from "@/components/loyalty/CustomerDrawer";
import { NewCustomerModal } from "@/components/loyalty/NewCustomerModal";
import { RewardDrawer } from "@/components/loyalty/RewardDrawer";
import { LoyaltyEmailsPanel } from "@/components/loyalty/LoyaltyEmailsPanel";
import { ConfirmDelete } from "@/components/menu/ConfirmDelete";
import { cn } from "@/lib/utils";
import { downloadCsv, todayStamp, toCsv } from "@/lib/csv";

type Tab = "clients" | "rewards" | "config";
type TierFilter = "all" | LoyaltyTier;
type SortKey = "points" | "visits" | "lastVisit" | "spent";

const TABS: { key: Tab; label: string }[] = [
  { key: "clients", label: "Clients" },
  { key: "rewards", label: "Récompenses" },
  { key: "config", label: "Configuration" },
];

const FIELD =
  "bg-bg-2 border border-line rounded-[10px] px-3 py-[9px] text-[13px] text-ink-1 outline-none focus:border-line-2 transition-colors";

const euros = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
    });
  } catch {
    return iso;
  }
}

export default function Loyalty() {
  const loyalty = useLoyalty();
  const {
    customers,
    rewards,
    config,
    loading,
    error,
    kpis,
    addCustomer,
    addPointsManually,
    redeemReward,
    addReward,
    editReward,
    toggleReward,
    removeReward,
    saveConfig,
    clearError,
  } = loyalty;

  const [params, setParams] = useSearchParams();
  const urlTab = params.get("tab");
  const [tab, setTab] = useState<Tab>(
    urlTab === "rewards" || urlTab === "config" ? urlTab : "clients"
  );
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) ?? null;

  useEffect(() => {
    const next = new URLSearchParams(params);
    if (tab === "clients") next.delete("tab");
    else next.set("tab", tab);
    if (next.toString() !== params.toString()) {
      setParams(next, { replace: true });
    }
  }, [tab, params, setParams]);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5 pt-2">
        <div>
          <div className="chip-uppercase mb-1">CRM · Programme de fidélité</div>
          <h2 className="display font-medium text-[22px] sm:text-[26px] leading-tight m-0">
            {config.programName}{" "}
            <em className="not-italic italic text-ember-soft font-normal">& clients</em>
          </h2>
        </div>
        <TabsBar tab={tab} onChange={setTab} />
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

      {tab === "clients" && (
        <ClientsTab
          customers={customers}
          loading={loading}
          kpis={kpis}
          onSelect={setSelectedCustomerId}
          onAddCustomer={addCustomer}
        />
      )}

      {tab === "rewards" && (
        <RewardsTab
          rewards={rewards}
          loading={loading}
          onAdd={addReward}
          onEdit={editReward}
          onToggle={toggleReward}
          onRemove={removeReward}
        />
      )}

      {tab === "config" && <ConfigTab config={config} onSave={saveConfig} />}

      <CustomerDrawer
        customer={selectedCustomer}
        rewards={rewards}
        config={config}
        onClose={() => setSelectedCustomerId(null)}
        onRedeem={redeemReward}
        onAdjustPoints={addPointsManually}
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
// Onglet 1 — Clients
// =============================================================
function ClientsTab({
  customers,
  loading,
  kpis,
  onSelect,
  onAddCustomer,
}: {
  customers: LoyaltyCustomer[];
  loading: boolean;
  kpis: { total: number; activeMonth: number; pointsThisMonth: number; retention: number };
  onSelect: (id: string) => void;
  onAddCustomer: (payload: {
    name: string;
    email: string | null;
    phone: string | null;
  }) => Promise<LoyaltyCustomer | null>;
}) {
  const [tier, setTier] = useState<TierFilter>("all");
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("points");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [newOpen, setNewOpen] = useState(false);

  const filtered = useMemo(() => {
    const list = customers.filter((c) => {
      if (tier !== "all" && c.tier !== tier) return false;
      if (query) {
        const q = query.toLowerCase();
        const hay = `${c.name} ${c.email ?? ""} ${c.phone ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    return [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "points") cmp = a.points - b.points;
      else if (sortKey === "visits") cmp = a.visitCount - b.visitCount;
      else if (sortKey === "spent") cmp = a.totalSpent - b.totalSpent;
      else if (sortKey === "lastVisit") {
        const av = a.lastVisit ? new Date(a.lastVisit).getTime() : 0;
        const bv = b.lastVisit ? new Date(b.lastVisit).getTime() : 0;
        cmp = av - bv;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [customers, tier, query, sortKey, sortDir]);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(k);
      setSortDir("desc");
    }
  };

  const exportCsv = () => {
    const rows = filtered.map((c) => ({
      name: c.name,
      email: c.email ?? "",
      phone: c.phone ?? "",
      tier: TIER_LABEL[c.tier],
      points: c.points,
      total_spent: c.totalSpent,
      visit_count: c.visitCount,
      last_visit: c.lastVisit ? c.lastVisit.slice(0, 10) : "",
      created_at: c.createdAt.slice(0, 10),
    }));
    const csv = toCsv(rows, [
      { key: "name", header: "Nom" },
      { key: "email", header: "Email" },
      { key: "phone", header: "Téléphone" },
      { key: "tier", header: "Palier" },
      { key: "points", header: "Points" },
      { key: "total_spent", header: "Dépense totale (€)" },
      { key: "visit_count", header: "Visites" },
      { key: "last_visit", header: "Dernière visite" },
      { key: "created_at", header: "Inscrit le" },
    ]);
    downloadCsv(`clients-fidelite-${todayStamp()}.csv`, csv);
  };

  return (
    <>
      {/* KPIs */}
      <div className="grid grid-cols-12 gap-4 mb-4">
        <KpiTile
          className="col-span-3"
          label="Membres inscrits"
          value={kpis.total.toLocaleString("fr-FR")}
          hint="Total tous paliers"
          tone="cream"
        />
        <KpiTile
          className="col-span-3"
          label="Actifs ce mois"
          value={kpis.activeMonth.toLocaleString("fr-FR")}
          hint="Au moins une visite ce mois"
          tone="ember"
        />
        <KpiTile
          className="col-span-3"
          label="Points distribués"
          value={kpis.pointsThisMonth.toLocaleString("fr-FR")}
          hint="Depuis le 1er du mois"
          tone="ok"
        />
        <KpiTile
          className="col-span-3"
          label="Taux de rétention"
          value={`${kpis.retention}%`}
          hint="Clients revenus / total"
          tone="cream"
        />
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="segmented">
            <button
              className={cn(tier === "all" && "active")}
              onClick={() => setTier("all")}
            >
              Tous paliers
            </button>
            {(["bronze", "silver", "gold", "platine"] as LoyaltyTier[]).map((t) => (
              <button
                key={t}
                className={cn(tier === t && "active")}
                onClick={() => setTier(t)}
              >
                {TIER_LABEL[t]}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2 bg-bg-2 border border-line rounded-[10px] px-3 py-[7px] w-[280px] text-[13px]">
            <Search size={14} className="text-ink-3" />
            <input
              className="flex-1 bg-transparent border-0 outline-none text-ink-1 placeholder:text-ink-3"
              placeholder="Nom, email, téléphone…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button
                className="text-ink-4 hover:text-ink-2 text-[11px]"
                onClick={() => setQuery("")}
              >
                ×
              </button>
            )}
          </div>

          <button
            className="btn-ghost inline-flex items-center gap-2"
            onClick={exportCsv}
            disabled={filtered.length === 0}
            title="Exporter la liste filtrée au format CSV"
            type="button"
          >
            <Download size={13} />
            Exporter CSV
          </button>

          <button
            className="btn-primary inline-flex items-center gap-2"
            onClick={() => setNewOpen(true)}
            type="button"
          >
            <UserPlus size={13} />
            Ajouter un client
          </button>
        </div>
      </Card>

      {/* Liste */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filtered.length} {filtered.length > 1 ? "clients" : "client"} ·{" "}
            <span className="text-ember-soft">
              {tier === "all" ? "tous paliers" : TIER_LABEL[tier].toLowerCase()}
            </span>
          </CardTitle>
          <span className="text-[11px] text-ink-4 mono uppercase tracking-[0.08em]">
            Clic colonne pour trier
          </span>
        </CardHeader>

        {loading ? (
          <div className="py-16 text-center text-ink-3 text-[13px]">Chargement…</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-ink-4 text-[13px] italic">
            Aucun client ne correspond aux filtres.
          </div>
        ) : (
          <div className="flex flex-col">
            <div
              className="grid items-center gap-3 px-2 py-2 text-[10px] uppercase tracking-[0.08em] font-semibold text-ink-4 border-b border-line"
              style={{
                gridTemplateColumns: "1.8fr 0.9fr 0.8fr 0.8fr 1fr 0.9fr",
              }}
            >
              <div>Client</div>
              <div>Palier</div>
              <SortHeader
                active={sortKey === "points"}
                dir={sortDir}
                onClick={() => toggleSort("points")}
                align="right"
              >
                Points
              </SortHeader>
              <SortHeader
                active={sortKey === "visits"}
                dir={sortDir}
                onClick={() => toggleSort("visits")}
                align="right"
              >
                Visites
              </SortHeader>
              <SortHeader
                active={sortKey === "spent"}
                dir={sortDir}
                onClick={() => toggleSort("spent")}
                align="right"
              >
                Dépense
              </SortHeader>
              <SortHeader
                active={sortKey === "lastVisit"}
                dir={sortDir}
                onClick={() => toggleSort("lastVisit")}
                align="right"
              >
                Dernier passage
              </SortHeader>
            </div>
            {filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => onSelect(c.id)}
                className="grid items-center gap-3 px-2 py-[10px] border-b border-line last:border-b-0 hover:bg-bg-2/60 focus:outline-none focus:bg-bg-2 cursor-pointer transition-colors text-left"
                style={{
                  gridTemplateColumns: "1.8fr 0.9fr 0.8fr 0.8fr 1fr 0.9fr",
                }}
                type="button"
              >
                <div className="flex items-center gap-[10px] min-w-0">
                  <div className="avatar-circle w-8 h-8 text-[11px]">
                    {avatarFor(c.name)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold leading-tight truncate">
                      {c.name}
                    </div>
                    <div className="text-[11px] text-ink-4 truncate">
                      {c.email ?? c.phone ?? "—"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-[6px]">
                  <span
                    className="inline-block w-[8px] h-[8px] rounded-full"
                    style={{ background: TIER_COLOR[c.tier] }}
                  />
                  <span
                    className="text-[12px] font-semibold"
                    style={{ color: TIER_COLOR[c.tier] }}
                  >
                    {TIER_LABEL[c.tier]}
                  </span>
                </div>
                <div className="text-right mono text-[13px] font-semibold text-ember-soft">
                  {c.points.toLocaleString("fr-FR")}
                </div>
                <div className="text-right mono text-[12.5px] text-ink-2">
                  {c.visitCount}
                </div>
                <div className="text-right mono text-[12.5px] text-ink-2">
                  {euros.format(c.totalSpent)}
                </div>
                <div className="text-right text-[11px] text-ink-3 mono">
                  {formatDate(c.lastVisit)}
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>

      <NewCustomerModal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        onCreate={async (p) => {
          await onAddCustomer(p);
        }}
      />
    </>
  );
}

// =============================================================
// Onglet 2 — Récompenses
// =============================================================
function RewardsTab({
  rewards,
  loading,
  onAdd,
  onEdit,
  onToggle,
  onRemove,
}: {
  rewards: LoyaltyReward[];
  loading: boolean;
  onAdd: (payload: {
    name: string;
    description: string | null;
    pointsCost: number;
    active: boolean;
  }) => Promise<LoyaltyReward | null>;
  onEdit: (
    id: string,
    payload: {
      name: string;
      description: string | null;
      pointsCost: number;
      active: boolean;
    }
  ) => Promise<void>;
  onToggle: (id: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  const [drawer, setDrawer] = useState<
    { mode: "closed" } | { mode: "create" } | { mode: "edit"; reward: LoyaltyReward }
  >({ mode: "closed" });
  const [confirmDelete, setConfirmDelete] = useState<LoyaltyReward | null>(null);

  return (
    <>
      <Card className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="display text-[16px] font-medium leading-tight">
              Catalogue des récompenses
            </div>
            <div className="text-[11.5px] text-ink-3 mt-1">
              Activez/désactivez en un clic. Les récompenses inactives n'apparaissent plus
              côté client.
            </div>
          </div>
          <button
            className="btn-primary inline-flex items-center gap-2"
            onClick={() => setDrawer({ mode: "create" })}
            type="button"
          >
            <Plus size={13} />
            Nouvelle récompense
          </button>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {rewards.length} {rewards.length > 1 ? "récompenses" : "récompense"} ·{" "}
            <span className="text-ember-soft">
              {rewards.filter((r) => r.active).length} active
              {rewards.filter((r) => r.active).length > 1 ? "s" : ""}
            </span>
          </CardTitle>
        </CardHeader>

        {loading ? (
          <div className="py-12 text-center text-ink-3 text-[13px]">Chargement…</div>
        ) : rewards.length === 0 ? (
          <div className="py-12 text-center text-ink-4 text-[13px] italic">
            Aucune récompense. Créez-en une pour démarrer.
          </div>
        ) : (
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}
          >
            {rewards.map((r) => (
              <div
                key={r.id}
                className={cn(
                  "p-3 bg-bg-2 rounded-[10px] border border-line transition-colors hover:border-line-2",
                  !r.active && "opacity-60"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Gift size={13} className="text-ember-soft" />
                  <span className="mono text-[11px] text-ember font-semibold">
                    {r.pointsCost.toLocaleString("fr-FR")} pts
                  </span>
                  <ToggleDot
                    active={r.active}
                    onChange={() => void onToggle(r.id)}
                    className="ml-auto"
                  />
                </div>
                <div className="text-[13px] font-semibold leading-tight mb-1">
                  {r.name}
                </div>
                {r.description && (
                  <div className="text-[11px] text-ink-3 leading-snug mb-2 line-clamp-2">
                    {r.description}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10.5px] text-ink-4 mono">
                    {r.claimedCount} réclamation{r.claimedCount > 1 ? "s" : ""}
                  </span>
                  <button
                    className="ml-auto icon-btn w-[24px] h-[24px]"
                    onClick={() => setDrawer({ mode: "edit", reward: r })}
                    title="Éditer"
                    type="button"
                  >
                    <Pencil size={11} />
                  </button>
                  <button
                    className="icon-btn w-[24px] h-[24px] hover:text-danger"
                    onClick={() => setConfirmDelete(r)}
                    title="Supprimer"
                    type="button"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <RewardDrawer
        open={drawer.mode !== "closed"}
        onClose={() => setDrawer({ mode: "closed" })}
        reward={drawer.mode === "edit" ? drawer.reward : null}
        onCreate={async (p) => {
          await onAdd(p);
        }}
        onUpdate={onEdit}
      />

      <ConfirmDelete
        open={confirmDelete !== null}
        title="Supprimer cette récompense ?"
        body={
          confirmDelete
            ? `« ${confirmDelete.name} » sera retirée du catalogue.`
            : ""
        }
        onClose={() => setConfirmDelete(null)}
        onConfirm={async () => {
          if (confirmDelete) await onRemove(confirmDelete.id);
        }}
      />
    </>
  );
}

// =============================================================
// Onglet 3 — Configuration
// =============================================================
function ConfigTab({
  config,
  onSave,
}: {
  config: LoyaltyConfig;
  onSave: (next: LoyaltyConfig) => Promise<void>;
}) {
  const [draft, setDraft] = useState<LoyaltyConfig>(config);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    setDraft(config);
  }, [config]);

  const dirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(config),
    [draft, config]
  );

  const update = <K extends keyof LoyaltyConfig>(key: K, value: LoyaltyConfig[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setSavedAt(null);
  };

  const submit = async () => {
    setSaving(true);
    try {
      await onSave(draft);
      setSavedAt(Date.now());
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-12 gap-4">
      <Card className="col-span-7">
        <CardHeader>
          <CardTitle>Programme</CardTitle>
          <ToggleDot
            active={draft.active}
            onChange={(v) => update("active", v)}
            label={draft.active ? "Actif" : "Désactivé"}
          />
        </CardHeader>

        <div className="flex flex-col gap-4">
          <Field label="Nom du programme">
            <input
              value={draft.programName}
              onChange={(e) => update("programName", e.target.value)}
              placeholder="Club Sévère, Les Fidèles…"
              className={FIELD}
            />
          </Field>

          <Field label="Message de bienvenue">
            <textarea
              value={draft.welcomeMessage ?? ""}
              onChange={(e) => update("welcomeMessage", e.target.value || null)}
              rows={3}
              placeholder="Affiché à l'inscription du client"
              className={FIELD + " resize-none"}
            />
          </Field>

          <Field label="Règle d'accumulation">
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-ink-2">1 € dépensé =</span>
              <input
                type="number"
                min={0}
                step={1}
                value={draft.pointsPerEuro}
                onChange={(e) =>
                  update("pointsPerEuro", Number(e.target.value) || 0)
                }
                className={FIELD + " w-[100px]"}
              />
              <span className="text-[13px] text-ink-2">points</span>
            </div>
            <div className="text-[11px] text-ink-4 mt-1">
              Défaut : 10 points par euro.
            </div>
          </Field>
        </div>
      </Card>

      <Card className="col-span-5">
        <CardHeader>
          <CardTitle>Seuils des paliers</CardTitle>
        </CardHeader>

        <div className="flex flex-col gap-4">
          <TierThreshold
            color={TIER_COLOR.bronze}
            label={TIER_LABEL.bronze}
            min={0}
            max={Math.max(0, draft.thresholdSilver - 1)}
            disabled
          />
          <TierThreshold
            color={TIER_COLOR.silver}
            label={TIER_LABEL.silver}
            min={draft.thresholdSilver}
            max={Math.max(draft.thresholdSilver, draft.thresholdGold - 1)}
            onChangeMin={(v) => update("thresholdSilver", v)}
          />
          <TierThreshold
            color={TIER_COLOR.gold}
            label={TIER_LABEL.gold}
            min={draft.thresholdGold}
            max={null}
            onChangeMin={(v) => update("thresholdGold", v)}
          />
        </div>

        <div className="text-[11px] text-ink-4 mt-3">
          Le palier Bronze démarre toujours à 0. Argent et Or sont les seuils que
          le client doit atteindre.
        </div>
      </Card>

      <div className="col-span-12 flex items-center justify-end gap-3">
        {savedAt && !dirty && (
          <span className="text-[12px] text-ok">Modifications enregistrées.</span>
        )}
        <button
          className="btn-primary inline-flex items-center gap-2"
          onClick={() => void submit()}
          disabled={!dirty || saving}
          type="button"
        >
          <Save size={13} />
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>

      <LoyaltyEmailsPanel />
    </div>
  );
}

function TierThreshold({
  color,
  label,
  min,
  max,
  onChangeMin,
  disabled = false,
}: {
  color: string;
  label: string;
  min: number;
  max: number | null;
  onChangeMin?: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 w-[110px]">
        <span
          className="inline-block w-[10px] h-[10px] rounded-full"
          style={{ background: color }}
        />
        <span className="text-[13px] font-semibold" style={{ color }}>
          {label}
        </span>
      </div>
      <div className="flex-1 flex items-center gap-2">
        <input
          type="number"
          min={0}
          step={50}
          value={min}
          disabled={disabled}
          onChange={(e) =>
            onChangeMin?.(Math.max(0, Number(e.target.value) || 0))
          }
          className={FIELD + " w-[110px] disabled:opacity-60"}
        />
        <span className="text-[12px] text-ink-3">à</span>
        <span className="text-[12px] mono text-ink-2 min-w-[60px]">
          {max === null ? "∞" : max.toLocaleString("fr-FR")} pts
        </span>
      </div>
    </div>
  );
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
        className="display font-medium text-[34px] leading-none mt-[12px] mb-[8px]"
        style={{ color: toneColor }}
      >
        {value}
      </div>
      <div className="text-[11.5px] text-ink-3">{hint}</div>
    </div>
  );
}

function SortHeader({
  children,
  active,
  dir,
  onClick,
  align = "left",
}: {
  children: React.ReactNode;
  active: boolean;
  dir: "asc" | "desc";
  onClick: () => void;
  align?: "left" | "right";
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 transition-colors hover:text-ink-2",
        active && "text-ember-soft",
        align === "right" && "justify-end"
      )}
      type="button"
    >
      {children}
      {active ? (
        <span className="mono text-[9px]">{dir === "asc" ? "↑" : "↓"}</span>
      ) : (
        <ArrowDownUp size={9} className="opacity-40" />
      )}
    </button>
  );
}

function ToggleDot({
  active,
  onChange,
  label,
  className,
}: {
  active: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
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
      {label && (
        <span className="text-[12px] text-ink-3 mono uppercase tracking-[0.06em]">
          {label}
        </span>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-[6px]">
      <label className="chip-uppercase">{label}</label>
      {children}
    </div>
  );
}

function avatarFor(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
