import { useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  Coins,
  Gift,
  Mail,
  Phone,
  Star,
  TrendingUp,
} from "lucide-react";
import { Drawer } from "@/components/ui/drawer";
import { useLoyaltyTransactions } from "@/hooks/useLoyaltyTransactions";
import {
  TIER_COLOR,
  TIER_LABEL,
  nextTier,
  type LoyaltyConfig,
  type LoyaltyCustomer,
  type LoyaltyReward,
} from "@/lib/loyalty-types";
import { AdjustPointsModal } from "./AdjustPointsModal";
import { SendMessageModal } from "./SendMessageModal";

const euros = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
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

export function CustomerDrawer({
  customer,
  rewards,
  config,
  onClose,
  onRedeem,
  onAdjustPoints,
}: {
  customer: LoyaltyCustomer | null;
  rewards: LoyaltyReward[];
  config: LoyaltyConfig;
  onClose: () => void;
  onRedeem: (customerId: string, rewardId: string) => Promise<void> | void;
  onAdjustPoints: (
    customerId: string,
    points: number,
    reason: string
  ) => Promise<void> | void;
}) {
  const open = customer !== null;
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);

  const { transactions, loading: txLoading } = useLoyaltyTransactions(
    customer?.id ?? null
  );

  const next = customer
    ? nextTier(customer.tier, config)
    : { next: null, at: 0 };
  const pctToNext =
    customer && next.next
      ? Math.min(100, Math.round((customer.points / next.at) * 100))
      : 100;

  const available = customer
    ? rewards.filter((r) => r.active && customer.points >= r.pointsCost)
    : [];
  const locked = customer
    ? rewards.filter((r) => r.active && customer.points < r.pointsCost)
    : [];

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        width={480}
        title={customer?.name ?? ""}
        subtitle={
          customer ? (
            <span className="mono">{customer.email ?? "Pas d'email"}</span>
          ) : undefined
        }
        footer={
          customer ? (
            <div className="flex gap-2">
              <button
                className="btn-ghost flex-1 inline-flex items-center justify-center gap-2"
                onClick={() => setMessageOpen(true)}
                type="button"
              >
                <Mail size={13} />
                Envoyer un message
              </button>
              <button
                className="btn-primary flex-1 inline-flex items-center justify-center gap-2"
                onClick={() => setAdjustOpen(true)}
                type="button"
              >
                <Coins size={13} />
                Ajuster points
              </button>
            </div>
          ) : undefined
        }
      >
        {customer && (
          <div className="flex flex-col gap-4">
            {/* Hero */}
            <div className="p-4 rounded-[12px] border border-line-2 bg-gradient-to-br from-bg-2 to-bg-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="avatar-circle w-12 h-12 text-[14px]">
                  {avatarFor(customer.name)}
                </div>
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

              {next.next ? (
                <>
                  <div className="text-[11px] text-ink-3 mb-1 flex justify-between mono">
                    <span>Vers {TIER_LABEL[next.next]}</span>
                    <span>
                      {customer.points.toLocaleString("fr-FR")} /{" "}
                      {next.at.toLocaleString("fr-FR")}
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
                    {Math.max(0, next.at - customer.points).toLocaleString("fr-FR")} pts
                    restants
                  </div>
                </>
              ) : (
                <div className="text-[11px] text-ember-soft font-semibold">
                  ★ Palier maximum atteint
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
              <StatBox
                icon={Calendar}
                label="Visites"
                value={`${customer.visitCount}`}
              />
              <StatBox
                icon={TrendingUp}
                label="Dépense"
                value={euros.format(customer.totalSpent)}
              />
              <StatBox
                icon={Star}
                label="Téléphone"
                value={customer.phone ?? "—"}
                small
              />
            </div>

            <div className="text-[11.5px] text-ink-4">
              Dernière visite ·{" "}
              <span className="text-ink-2">{formatDate(customer.lastVisit)}</span>{" "}
              · inscrit le{" "}
              <span className="text-ink-2">{formatDate(customer.createdAt)}</span>
            </div>

            {/* Récompenses disponibles */}
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
                      <Gift
                        size={16}
                        className="text-ember-soft flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-[12.5px] font-semibold">{r.name}</div>
                        <div className="text-[11px] text-ink-3">
                          {r.pointsCost.toLocaleString("fr-FR")} pts
                          {r.description ? ` · ${r.description}` : ""}
                        </div>
                      </div>
                      <button
                        className="btn-ghost !text-[11px]"
                        onClick={() => void onRedeem(customer.id, r.id)}
                        type="button"
                      >
                        Offrir
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
                        {r.pointsCost.toLocaleString("fr-FR")} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Historique */}
            <div>
              <div className="chip-uppercase mb-2">Historique des transactions</div>
              {txLoading ? (
                <div className="text-[12px] text-ink-4 p-3 bg-bg-2 rounded-[10px] border border-line">
                  Chargement…
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-[12px] text-ink-4 italic p-3 bg-bg-2 rounded-[10px] border border-line">
                  Aucune transaction enregistrée.
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {transactions.map((t) => {
                    const earn = t.type === "earn";
                    return (
                      <div
                        key={t.id}
                        className="flex items-center gap-3 px-3 py-[9px] bg-bg-2 rounded-[8px] border border-line"
                      >
                        <span
                          className="inline-grid place-items-center w-[24px] h-[24px] rounded-md flex-shrink-0"
                          style={{
                            background: earn
                              ? "rgba(106,179,142,0.15)"
                              : "rgba(232,115,58,0.15)",
                            color: earn
                              ? "var(--ok)"
                              : "var(--ember-soft)",
                          }}
                        >
                          {earn ? (
                            <ArrowUpRight size={12} />
                          ) : (
                            <ArrowDownLeft size={12} />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-[12.5px] text-ink-1 truncate">
                            {t.description ?? (earn ? "Points gagnés" : "Points utilisés")}
                          </div>
                          <div className="text-[10.5px] text-ink-4 mono">
                            {formatDateTime(t.createdAt)}
                          </div>
                        </div>
                        <span
                          className="mono text-[12.5px] font-semibold flex-shrink-0"
                          style={{ color: earn ? "var(--ok)" : "var(--ember-soft)" }}
                        >
                          {t.points > 0 ? "+" : ""}
                          {t.points.toLocaleString("fr-FR")} pts
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {customer.phone && (
              <div className="flex items-center gap-2 text-[11.5px] text-ink-3 border-t border-line pt-3">
                <Phone size={12} />
                <span className="mono text-ink-2">{customer.phone}</span>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {customer && (
        <>
          <AdjustPointsModal
            open={adjustOpen}
            onClose={() => setAdjustOpen(false)}
            customerName={customer.name}
            onSubmit={(p, reason) => onAdjustPoints(customer.id, p, reason)}
          />
          <SendMessageModal
            open={messageOpen}
            onClose={() => setMessageOpen(false)}
            customerName={customer.name}
            customerEmail={customer.email}
            programName={config.programName}
          />
        </>
      )}
    </>
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
      <div
        className={
          small
            ? "text-[11.5px] text-ink-2 truncate mono"
            : "text-[14px] font-semibold"
        }
      >
        {value}
      </div>
    </div>
  );
}
