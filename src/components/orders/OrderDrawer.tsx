import { Clock, Users, MapPin, CheckCircle2, Flame, XCircle, Printer, Receipt } from "lucide-react";
import type { Order, OrderStatus } from "@/lib/mock-data";
import { Drawer } from "@/components/ui/drawer";
import { channelLabel, statusLabel } from "./OrderRow";
import { cn, formatEuros } from "@/lib/utils";

export function OrderDrawer({
  order,
  onClose,
  onStatusChange,
}: {
  order: Order | null;
  onClose: () => void;
  onStatusChange?: (id: string, status: OrderStatus) => void;
}) {
  const open = order !== null;

  const subtotal = order?.total ?? 0;
  const tva = subtotal * 0.1;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={order ? order.table : ""}
      subtitle={
        order ? (
          <span className="mono">
            {order.id} · {channelLabel(order.channel)} · {order.time}
          </span>
        ) : undefined
      }
      footer={
        order ? (
          <div className="flex gap-2">
            <button className="btn-ghost flex-1 inline-flex items-center justify-center gap-2">
              <Printer size={13} />
              Imprimer
            </button>
            <button className="btn-primary flex-1 inline-flex items-center justify-center gap-2">
              <Receipt size={13} />
              Encaisser
            </button>
          </div>
        ) : undefined
      }
    >
      {order && (
        <div className="flex flex-col gap-4">
          {/* Meta */}
          <div className="grid grid-cols-3 gap-2">
            <MetaTile icon={Users} label="Couverts" value={`${order.covers}`} />
            <MetaTile icon={MapPin} label="Serveur" value={order.waiter} />
            <MetaTile icon={Clock} label="Depuis" value={order.time} />
          </div>

          {/* Status + actions */}
          <div className="p-3 bg-bg-2 rounded-[10px] border border-line">
            <div className="flex items-center justify-between mb-3">
              <div className="chip-uppercase">Statut</div>
              <span className={cn("status-pill", order.status)}>
                {statusLabel(order.status)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <StatusButton
                active={order.status === "preparing"}
                icon={Flame}
                label="En cuisine"
                onClick={() => onStatusChange?.(order.id, "preparing")}
              />
              <StatusButton
                active={order.status === "served"}
                icon={CheckCircle2}
                label="Marquer servie"
                tone="ok"
                onClick={() => onStatusChange?.(order.id, "served")}
              />
              <StatusButton
                active={order.status === "pending"}
                icon={Clock}
                label="En attente"
                onClick={() => onStatusChange?.(order.id, "pending")}
              />
              <StatusButton
                active={order.status === "cancelled"}
                icon={XCircle}
                label="Annuler"
                tone="danger"
                onClick={() => onStatusChange?.(order.id, "cancelled")}
              />
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="chip-uppercase mb-2">Articles</div>
            <div className="flex flex-col">
              {order.items.map((item, i) => (
                <div
                  key={`${item}-${i}`}
                  className="flex items-center justify-between py-[9px] border-b border-line last:border-b-0"
                >
                  <div className="text-[13px] text-ink-1">{item}</div>
                  <div className="mono text-[11.5px] text-ink-3">
                    {formatEuros(Math.round(order.total / order.items.length))} €
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="p-3 bg-bg-2 rounded-[10px] border border-line">
            <div className="flex justify-between text-[12px] text-ink-3 mb-1">
              <span>Sous-total HT</span>
              <span className="mono">{formatEuros(subtotal - tva)} €</span>
            </div>
            <div className="flex justify-between text-[12px] text-ink-3 mb-2">
              <span>TVA 10%</span>
              <span className="mono">{formatEuros(Math.round(tva))} €</span>
            </div>
            <div className="flex justify-between items-baseline border-t border-line pt-2">
              <span className="chip-uppercase">Total TTC</span>
              <span className="display text-[22px] font-medium text-ember-soft">
                {formatEuros(order.total)} €
              </span>
            </div>
          </div>

          {order.pickup && (
            <div className="p-3 rounded-[10px] border border-line bg-amber/5">
              <div className="text-[11px] text-amber uppercase tracking-[0.08em] font-semibold mb-1">
                Retrait prévu
              </div>
              <div className="display text-[20px] font-medium">{order.pickup}</div>
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
}

function MetaTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string;
}) {
  return (
    <div className="p-[10px] bg-bg-2 rounded-[10px] border border-line">
      <div className="flex items-center gap-[6px] mb-1">
        <Icon size={11} className="text-ink-4" />
        <span className="chip-uppercase !text-[10px]">{label}</span>
      </div>
      <div className="text-[14px] font-semibold">{value}</div>
    </div>
  );
}

function StatusButton({
  active,
  icon: Icon,
  label,
  tone,
  onClick,
}: {
  active: boolean;
  icon: typeof Flame;
  label: string;
  tone?: "ok" | "danger";
  onClick: () => void;
}) {
  const color =
    tone === "ok" ? "var(--ok)" : tone === "danger" ? "var(--danger)" : "var(--ember-soft)";
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-[10px] py-[9px] rounded-[8px] border text-[12px] font-semibold transition-all",
        active
          ? "bg-bg-3 border-line-2"
          : "bg-bg-1 border-line hover:bg-bg-2 hover:border-line-2"
      )}
      style={{ color: active ? color : "var(--ink-2)" }}
    >
      <Icon size={13} />
      {label}
    </button>
  );
}
