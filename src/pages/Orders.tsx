import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ClipboardList, RefreshCw, Search } from "lucide-react";
import { useOrders } from "@/hooks/useOrders";
import { useAuth } from "@/contexts/AuthContext";
import { processLoyaltyEmails } from "@/lib/api/loyalty-emails";
import type { OrderChannel, OrderStatus, NewOrder } from "@/lib/order-types";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderRow, channelLabel, statusLabel } from "@/components/orders/OrderRow";
import { OrderDrawer } from "@/components/orders/OrderDrawer";
import { NewOrderModal } from "@/components/orders/NewOrderModal";
import { cn, formatEuros } from "@/lib/utils";

type ChannelFilter = "all" | OrderChannel;
type StatusFilter = "all" | OrderStatus;

export default function Orders() {
  const { orders, loading, error, reload, add, update, setStatus: setOrderStatus, remove } = useOrders();
  const { restaurant } = useAuth();
  const [channel, setChannel] = useState<ChannelFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const selected = orders.find((o) => o.id === selectedId) ?? null;

  const handleStatusChange = (id: string, next: OrderStatus) => {
    const order = orders.find((o) => o.id === id);
    void setOrderStatus(id, next).then(() => {
      // Si une commande passe à "servie" avec un client fidélité,
      // l'auto-crédit serveur peut déclencher un palier → drain best-effort.
      if (next === "served" && order?.loyaltyCustomerId && restaurant?.id) {
        void processLoyaltyEmails(restaurant.id).catch(() => {});
      }
    });
  };

  const handleLoyaltyChange = (id: string, loyaltyCustomerId: string | null) => {
    void update(id, { loyaltyCustomerId });
  };

  const handleCreate = async (input: NewOrder) => {
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
    const state = location.state as { openNew?: boolean; openId?: string } | null;
    if (state?.openNew) {
      setNewOpen(true);
      navigate(location.pathname, { replace: true, state: null });
    } else if (state?.openId) {
      setSelectedId(state.openId);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location, navigate]);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (channel !== "all" && o.channel !== channel) return false;
      if (status !== "all" && o.status !== status) return false;
      if (query) {
        const q = query.toLowerCase();
        if (
          !o.displayId.toLowerCase().includes(q) &&
          !o.table.toLowerCase().includes(q) &&
          !o.items.join(" ").toLowerCase().includes(q) &&
          !o.waiter.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [orders, channel, status, query]);

  const stats = useMemo(() => {
    const byStatus = orders.reduce<Record<string, number>>((acc, o) => {
      acc[o.status] = (acc[o.status] ?? 0) + 1;
      return acc;
    }, {});
    const revenue = orders
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + o.total, 0);
    const urgent = orders.filter(
      (o) => o.priority === "high" && o.status !== "served" && o.status !== "cancelled"
    ).length;
    return { byStatus, revenue, urgent };
  }, [orders]);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5 pt-2">
        <div>
          <div className="chip-uppercase mb-1">Salle & cuisine · Temps réel</div>
          <h2 className="display font-medium text-[22px] sm:text-[26px] leading-tight m-0">
            Commandes <em className="not-italic italic text-ember-soft font-normal">en service</em>
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            className="btn-ghost inline-flex items-center gap-2"
            onClick={() => void reload()}
            disabled={loading}
          >
            <RefreshCw size={13} className={cn(loading && "animate-spin")} />
            Actualiser
          </button>
          <button className="btn-primary inline-flex items-center gap-2" onClick={() => setNewOpen(true)}>
            <ClipboardList size={13} />
            Nouvelle commande
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-[10px] border border-danger/40 bg-danger/10 text-danger text-[12px]">
          {error}
        </div>
      )}

      <div className="grid grid-cols-12 gap-3 sm:gap-4 mb-4">
        <StatTile
          className="col-span-6 lg:col-span-3"
          label="En cours"
          value={(stats.byStatus.preparing ?? 0) + (stats.byStatus.pending ?? 0)}
          hint={`${stats.byStatus.pending ?? 0} à préparer · ${stats.byStatus.preparing ?? 0} en cuisine`}
          tone="ember"
        />
        <StatTile
          className="col-span-6 lg:col-span-3"
          label="Servies"
          value={stats.byStatus.served ?? 0}
          hint="Terminées ce service"
          tone="ok"
        />
        <StatTile
          className="col-span-6 lg:col-span-3"
          label="Urgentes"
          value={stats.urgent}
          hint="Priorité haute en attente"
          tone="danger"
        />
        <StatTile
          className="col-span-6 lg:col-span-3"
          label="CA du service"
          value={`${formatEuros(stats.revenue)} €`}
          hint="Hors annulations"
          tone="cream"
          big
        />
      </div>

      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <FilterGroup
            value={channel}
            onChange={setChannel}
            options={[
              { id: "all", label: "Tous canaux" },
              { id: "salle", label: "Salle" },
              { id: "cc", label: "Click & Collect" },
              { id: "delivery", label: "Livraison" },
            ]}
          />
          <span className="text-ink-4 text-[11px]">|</span>
          <FilterGroup
            value={status}
            onChange={setStatus}
            options={[
              { id: "all", label: "Tous statuts" },
              { id: "pending", label: "À préparer" },
              { id: "preparing", label: "En cuisine" },
              { id: "served", label: "Servies" },
              { id: "cancelled", label: "Annulées" },
            ]}
          />

          <div className="w-full sm:w-[260px] sm:ml-auto flex items-center gap-2 bg-bg-2 border border-line rounded-[10px] px-3 py-[7px] text-[13px]">
            <Search size={14} className="text-ink-3" />
            <input
              className="flex-1 bg-transparent border-0 outline-none text-ink-1 placeholder:text-ink-3"
              placeholder="Table, plat, serveur, ID…"
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
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {filtered.length} commande{filtered.length > 1 ? "s" : ""} ·{" "}
            <span className="text-ember-soft">
              {channel === "all" ? "tous canaux" : channelLabel(channel)}
              {status !== "all" ? ` · ${statusLabel(status).toLowerCase()}` : ""}
            </span>
          </CardTitle>
          <span className="text-[11px] text-ink-4 mono uppercase tracking-[0.08em]">
            Cliquer une ligne pour détail
          </span>
        </CardHeader>

        {loading ? (
          <div className="py-16 text-center text-ink-3 text-[13px]">Chargement…</div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center text-ink-3 text-[13px]">
            Aucune commande pour ce service.
            <button
              className="block mx-auto mt-3 btn-primary"
              onClick={() => setNewOpen(true)}
            >
              <ClipboardList size={13} /> Créer la première
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-ink-3 text-[13px]">
            Aucune commande ne correspond aux filtres.
          </div>
        ) : (
          <div className="flex flex-col gap-[2px]">
            {filtered.map((o) => (
              <OrderRow key={o.id} order={o} onClick={(ord) => setSelectedId(ord.id)} />
            ))}
          </div>
        )}
      </Card>

      <OrderDrawer
        order={selected}
        onClose={() => setSelectedId(null)}
        onStatusChange={handleStatusChange}
        onLoyaltyChange={handleLoyaltyChange}
        onDelete={handleDelete}
      />
      <NewOrderModal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        onCreate={handleCreate}
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
  big,
}: {
  label: string;
  value: string | number;
  hint: string;
  tone: "ember" | "ok" | "danger" | "cream";
  className?: string;
  big?: boolean;
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
        className={cn("display font-medium leading-none mt-[12px] mb-[8px]", big ? "text-[30px]" : "text-[34px]")}
        style={{ color: toneColor }}
      >
        {value}
      </div>
      <div className="text-[11.5px] text-ink-3">{hint}</div>
    </div>
  );
}

function FilterGroup<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { id: T; label: string }[];
}) {
  return (
    <div className="segmented">
      {options.map((o) => (
        <button
          key={o.id}
          className={cn(value === o.id && "active")}
          onClick={() => onChange(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
