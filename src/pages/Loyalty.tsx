import { useEffect, useMemo, useState } from "react";
import { Search, Gift, Plus, Mail } from "lucide-react";
import { listCustomers, listRewards, getLoyaltyOverview } from "@/lib/api/loyalty";
import type { LoyaltyCustomer, LoyaltyReward, LoyaltyTier } from "@/lib/mock-data";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Delta } from "@/components/dashboard/Delta";
import { CustomerDrawer } from "@/components/loyalty/CustomerDrawer";
import { cn, formatEuros } from "@/lib/utils";

type TierFilter = "all" | LoyaltyTier;

const TIER_LABEL: Record<LoyaltyTier, string> = {
  bronze: "Bronze",
  silver: "Argent",
  gold: "Or",
  platine: "Platine",
};

const TIER_COLOR: Record<LoyaltyTier, string> = {
  bronze: "#8a6a41",
  silver: "#b8b3a8",
  gold: "#d29528",
  platine: "#e8c471",
};

export default function Loyalty() {
  const [customers, setCustomers] = useState<LoyaltyCustomer[]>([]);
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [tier, setTier] = useState<TierFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = customers.find((c) => c.id === selectedId) ?? null;

  const redeemReward = (c: LoyaltyCustomer, r: LoyaltyReward) => {
    setCustomers((prev) =>
      prev.map((x) => (x.id === c.id ? { ...x, points: x.points - r.cost } : x))
    );
    setRewards((prev) =>
      prev.map((x) => (x.id === r.id ? { ...x, claimed: x.claimed + 1 } : x))
    );
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [c, r] = await Promise.all([listCustomers(), listRewards()]);
        setCustomers(c);
        setRewards(r);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const overview = getLoyaltyOverview();

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      if (tier !== "all" && c.tier !== tier) return false;
      if (query) {
        const q = query.toLowerCase();
        if (!c.name.toLowerCase().includes(q) && !c.email.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [customers, tier, query]);

  const totalTierCount = overview.tiers.reduce((s, t) => s + t.count, 0);

  return (
    <>
      <div className="flex items-end justify-between mb-5 pt-2">
        <div>
          <div className="chip-uppercase mb-1">CRM · Programme de fidélité</div>
          <h2 className="display font-medium text-[26px] leading-tight m-0">
            Fidélité <em className="not-italic italic text-ember-soft font-normal">& clients</em>
          </h2>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost inline-flex items-center gap-2">
            <Mail size={13} />
            Campagne email
          </button>
          <button className="btn-primary inline-flex items-center gap-2">
            <Plus size={13} />
            Ajouter un client
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-12 gap-4 mb-4">
        <div className="kpi hero col-span-4">
          <div className="flex items-start justify-between">
            <div className="chip-uppercase">Membres · total</div>
            <Delta value={overview.membersDelta} />
          </div>
          <div className="display font-medium text-[42px] leading-none mt-[14px] mb-[8px]">
            {overview.members.toLocaleString("fr-FR")}
          </div>
          <div className="text-[11.5px] text-ink-3">
            {overview.active30d} actifs · 30 j · {overview.retention}% rétention
          </div>
        </div>
        <StatTile className="col-span-3" label="Récompenses réclamées" value={overview.redeemed30d} hint="Sur les 30 derniers jours" tone="ember" />
        <StatTile className="col-span-3" label="Visites moyennes" value={overview.avgVisits.toFixed(1)} hint="Par membre · 90 j" tone="cream" />
        <StatTile className="col-span-2" label="Rétention" value={`${overview.retention}%`} hint="Taux 90 j" tone="ok" />
      </div>

      {/* Tiers breakdown + rewards */}
      <div className="grid grid-cols-12 gap-4 mb-4">
        <Card className="col-span-5">
          <CardHeader>
            <CardTitle>
              Paliers · <span className="text-ember-soft">répartition</span>
            </CardTitle>
            <span className="text-[11px] text-ink-4 mono uppercase tracking-[0.08em]">
              {totalTierCount} membres
            </span>
          </CardHeader>

          <div className="flex flex-col gap-3">
            {overview.tiers.map((t) => {
              const pct = (t.count / totalTierCount) * 100;
              return (
                <div key={t.key}>
                  <div className="flex items-center gap-2 mb-[6px]">
                    <span
                      className="inline-block w-[10px] h-[10px] rounded-full"
                      style={{ background: t.color }}
                    />
                    <span className="text-[12.5px] font-semibold">{t.label}</span>
                    <span className="text-[10.5px] text-ink-4 mono">
                      ≥ {t.threshold.toLocaleString("fr-FR")} pts
                    </span>
                    <span className="ml-auto mono text-[12px] text-ink-2">{t.count}</span>
                  </div>
                  <div className="h-[8px] rounded-full bg-bg-3 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: t.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="col-span-7">
          <CardHeader>
            <CardTitle>
              Récompenses · <span className="text-ember-soft">actives</span>
            </CardTitle>
            <button className="btn-ghost inline-flex items-center gap-2">
              <Plus size={12} />
              Nouvelle récompense
            </button>
          </CardHeader>

          <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
            {rewards.map((r) => (
              <div
                key={r.id}
                className="p-3 bg-bg-2 rounded-[10px] border border-line hover:bg-bg-3 hover:border-line-2 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Gift size={13} className="text-ember-soft" />
                  <span className="mono text-[11px] text-ember font-semibold">
                    {r.cost.toLocaleString("fr-FR")} pts
                  </span>
                  <span
                    className="ml-auto text-[10px] mono uppercase tracking-[0.08em]"
                    style={{ color: r.active ? "var(--ok)" : "var(--ink-4)" }}
                  >
                    {r.active ? "● actif" : "○ inactif"}
                  </span>
                </div>
                <div className="text-[13px] font-semibold leading-tight mb-1">{r.name}</div>
                <div className="text-[11px] text-ink-3 leading-snug mb-2">{r.description}</div>
                <div className="text-[10.5px] text-ink-4 mono">{r.claimed} réclamations</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Filters + customers */}
      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="segmented">
            <button className={cn(tier === "all" && "active")} onClick={() => setTier("all")}>
              Tous paliers
            </button>
            {(["bronze", "silver", "gold", "platine"] as LoyaltyTier[]).map((t) => (
              <button key={t} className={cn(tier === t && "active")} onClick={() => setTier(t)}>
                {TIER_LABEL[t]}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2 bg-bg-2 border border-line rounded-[10px] px-3 py-[7px] w-[260px] text-[13px]">
            <Search size={14} className="text-ink-3" />
            <input
              className="flex-1 bg-transparent border-0 outline-none text-ink-1 placeholder:text-ink-3"
              placeholder="Nom, email…"
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

      <Card>
        <CardHeader>
          <CardTitle>
            {filtered.length} {filtered.length > 1 ? "clients" : "client"} ·{" "}
            <span className="text-ember-soft">
              {tier === "all" ? "tous paliers" : TIER_LABEL[tier].toLowerCase()}
            </span>
          </CardTitle>
        </CardHeader>

        {loading ? (
          <div className="py-16 text-center text-ink-3 text-[13px]">Chargement…</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-ink-3 text-[13px]">
            Aucun client ne correspond aux filtres.
          </div>
        ) : (
          <div className="flex flex-col">
            <div
              className="grid items-center gap-3 px-2 py-2 text-[10px] uppercase tracking-[0.08em] font-semibold text-ink-4 border-b border-line"
              style={{ gridTemplateColumns: "1.8fr 1fr 0.8fr 1fr 1.2fr 1fr 0.6fr" }}
            >
              <div>Client</div>
              <div>Palier</div>
              <div className="text-right mono">Points</div>
              <div className="text-right mono">Visites</div>
              <div className="text-right mono">Dépense</div>
              <div>Préféré</div>
              <div />
            </div>
            {filtered.map((c) => (
              <div
                key={c.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedId(c.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedId(c.id);
                  }
                }}
                className="grid items-center gap-3 px-2 py-[10px] border-b border-line last:border-b-0 hover:bg-bg-2/60 focus:outline-none focus:bg-bg-2 cursor-pointer transition-colors"
                style={{ gridTemplateColumns: "1.8fr 1fr 0.8fr 1fr 1.2fr 1fr 0.6fr" }}
              >
                <div className="flex items-center gap-[10px] min-w-0">
                  <div className="avatar-circle w-8 h-8 text-[11px]">{c.avatar}</div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold leading-tight truncate">{c.name}</div>
                    <div className="text-[11px] text-ink-4 truncate">{c.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-[6px]">
                  <span
                    className="inline-block w-[8px] h-[8px] rounded-full"
                    style={{ background: TIER_COLOR[c.tier] }}
                  />
                  <span className="text-[12px] font-semibold" style={{ color: TIER_COLOR[c.tier] }}>
                    {TIER_LABEL[c.tier]}
                  </span>
                </div>
                <div className="text-right mono text-[13px] font-semibold text-ember-soft">
                  {c.points.toLocaleString("fr-FR")}
                </div>
                <div className="text-right mono text-[12.5px] text-ink-2">{c.visits}</div>
                <div className="text-right mono text-[12.5px] text-ink-2">
                  {formatEuros(c.spent)} €
                </div>
                <div className="text-[11.5px] text-ink-3 truncate">{c.favorite}</div>
                <div className="text-right text-[10.5px] text-ink-4 mono">{c.lastVisit}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <CustomerDrawer
        customer={selected}
        rewards={rewards}
        onClose={() => setSelectedId(null)}
        onRedeem={redeemReward}
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
