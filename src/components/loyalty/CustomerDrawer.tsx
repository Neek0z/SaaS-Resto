import { Mail, Phone, Gift, Star, TrendingUp, Calendar } from "lucide-react";
import type { LoyaltyCustomer, LoyaltyReward, LoyaltyTier } from "@/lib/mock-data";
import { Drawer } from "@/components/ui/drawer";
import { formatEuros } from "@/lib/utils";

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

const NEXT_TIER: Record<LoyaltyTier, { next: LoyaltyTier | null; at: number }> = {
  bronze: { next: "silver", at: 500 },
  silver: { next: "gold", at: 1500 },
  gold: { next: "platine", at: 3500 },
  platine: { next: null, at: 0 },
};

export function CustomerDrawer({
  customer,
  rewards,
  onClose,
  onRedeem,
}: {
  customer: LoyaltyCustomer | null;
  rewards: LoyaltyReward[];
  onClose: () => void;
  onRedeem?: (customer: LoyaltyCustomer, reward: LoyaltyReward) => void;
}) {
  const open = customer !== null;

  const next = customer ? NEXT_TIER[customer.tier] : { next: null, at: 0 };
  const pctToNext =
    customer && next.next
      ? Math.min(100, Math.round((customer.points / next.at) * 100))
      : 100;

  const available = rewards.filter((r) => r.active && customer && customer.points >= r.cost);
  const locked = rewards.filter((r) => r.active && customer && customer.points < r.cost);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={customer?.name ?? ""}
      subtitle={customer ? <span className="mono">{customer.email}</span> : undefined}
      footer={
        customer ? (
          <div className="flex gap-2">
            <button className="btn-ghost flex-1 inline-flex items-center justify-center gap-2">
              <Mail size={13} />
              Email
            </button>
            <button className="btn-primary flex-1 inline-flex items-center justify-center gap-2">
              <Phone size={13} />
              Contacter
            </button>
          </div>
        ) : undefined
      }
    >
      {customer && (
        <div className="flex flex-col gap-4">
          {/* Profile hero */}
          <div className="p-4 rounded-[12px] border border-line-2 bg-gradient-to-br from-bg-2 to-bg-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="avatar-circle w-12 h-12 text-[14px]">{customer.avatar}</div>
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block w-[10px] h-[10px] rounded-full"
                    style={{ background: TIER_COLOR[customer.tier] }}
                  />
                  <span
                    className="text-[13px] font-semibold"
                    style={{ color: TIER_COLOR[customer.tier] }}
                  >
                    {TIER_LABEL[customer.tier]}
                  </span>
                </div>
                <div className="display text-[22px] font-medium leading-tight mt-1">
                  {customer.points.toLocaleString("fr-FR")} pts
                </div>
              </div>
            </div>

            {next.next && (
              <>
                <div className="text-[11px] text-ink-3 mb-1 flex justify-between mono">
                  <span>Vers {TIER_LABEL[next.next]}</span>
                  <span>
                    {customer.points.toLocaleString("fr-FR")} / {next.at.toLocaleString("fr-FR")}
                  </span>
                </div>
                <div className="h-[8px] rounded-full bg-bg-3 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${pctToNext}%`,
                      background: TIER_COLOR[next.next],
                    }}
                  />
                </div>
                <div className="text-[10.5px] text-ink-4 mono mt-1">
                  {(next.at - customer.points).toLocaleString("fr-FR")} pts restants
                </div>
              </>
            )}
            {!next.next && (
              <div className="text-[11px] text-ember-soft font-semibold">
                ★ Palier maximum atteint
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            <StatBox icon={Calendar} label="Visites" value={`${customer.visits}`} />
            <StatBox icon={TrendingUp} label="Dépense" value={`${formatEuros(customer.spent)} €`} />
            <StatBox icon={Star} label="Favori" value={customer.favorite} small />
          </div>

          <div className="text-[11.5px] text-ink-4">
            Dernière visite · <span className="text-ink-2">{customer.lastVisit}</span>
          </div>

          {/* Available rewards */}
          <div>
            <div className="chip-uppercase mb-2">Récompenses disponibles</div>
            {available.length === 0 ? (
              <div className="text-[12px] text-ink-4 italic p-3 bg-bg-2 rounded-[10px] border border-line">
                Aucune récompense atteignable pour le moment.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {available.map((r) => (
                  <div
                    key={r.id}
                    className="p-3 bg-bg-2 rounded-[10px] border border-line flex items-center gap-3"
                  >
                    <Gift size={16} className="text-ember-soft flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[12.5px] font-semibold">{r.name}</div>
                      <div className="text-[11px] text-ink-3">
                        {r.cost.toLocaleString("fr-FR")} pts
                      </div>
                    </div>
                    <button
                      className="btn-ghost !text-[11px]"
                      onClick={() => onRedeem?.(customer, r)}
                    >
                      Réclamer
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {locked.length > 0 && (
            <div>
              <div className="chip-uppercase mb-2">À venir</div>
              <div className="flex flex-col gap-2 opacity-60">
                {locked.map((r) => (
                  <div
                    key={r.id}
                    className="p-[9px] bg-bg-2 rounded-[8px] border border-line flex items-center gap-2"
                  >
                    <Gift size={13} className="text-ink-4" />
                    <span className="text-[12px] text-ink-3 flex-1">{r.name}</span>
                    <span className="text-[10.5px] mono text-ink-4">
                      {r.cost.toLocaleString("fr-FR")} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
}

function StatBox({
  icon: Icon,
  label,
  value,
  small = false,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    <div className="p-[10px] bg-bg-2 rounded-[10px] border border-line">
      <div className="flex items-center gap-[6px] mb-1">
        <Icon size={11} className="text-ink-4" />
        <span className="chip-uppercase !text-[10px]">{label}</span>
      </div>
      <div className={small ? "text-[11.5px] text-ink-2 truncate" : "text-[14px] font-semibold"}>
        {value}
      </div>
    </div>
  );
}
