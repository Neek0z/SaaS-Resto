import type { Order } from "@/lib/order-types";
import { cn, formatEuros } from "@/lib/utils";

function relativeTime(iso: string): string {
  const t = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, Math.round((now - t) / 1000));
  if (diff < 60) return `il y a ${diff}s`;
  const min = Math.round(diff / 60);
  if (min < 60) return `il y a ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `il y a ${h}h`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export function OrderRow({
  order,
  onClick,
}: {
  order: Order;
  onClick?: (o: Order) => void;
}) {
  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={() => onClick?.(order)}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick(order);
        }
      }}
      className="grid items-center gap-3 p-[12px_10px] rounded-[10px] border border-transparent transition-all cursor-pointer hover:bg-bg-2 hover:border-line focus:outline-none focus:bg-bg-2 focus:border-line"
      style={{ gridTemplateColumns: "58px 1fr auto auto" }}
    >
      <div className="mono text-[11px] text-ink-3 bg-bg-2 px-[7px] py-[3px] rounded text-center">
        {order.displayId}
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-2 text-[13.5px] font-semibold mb-[3px] whitespace-nowrap overflow-hidden">
          <span className="flex-shrink-0">{order.table}</span>
          <span className={cn("channel-pill", order.channel)}>
            {channelLabel(order.channel)}
          </span>
          {order.priority === "high" && (
            <span
              className="channel-pill"
              style={{ color: "var(--danger)" }}
            >
              Urgent
            </span>
          )}
        </div>
        <div className="text-[12px] text-ink-3 truncate max-w-[420px]">
          {order.covers} cv · {order.items.join(", ")}
        </div>
      </div>

      <div className="text-right text-[11px] text-ink-3">
        <span className="block display text-[16px] text-ink-1 font-medium mb-[2px]">
          {formatEuros(order.total)} €
        </span>
        {order.waiter && order.waiter !== "—"
          ? `Serveur: ${order.waiter}`
          : order.pickup
          ? `Retrait ${order.pickup}`
          : relativeTime(order.createdAt)}
      </div>

      <span className={cn("status-pill", order.status)}>
        {statusLabel(order.status)}
      </span>
    </div>
  );
}

export function channelLabel(c: Order["channel"]) {
  return c === "cc" ? "Click & Collect" : c === "delivery" ? "Livraison" : "Salle";
}

export function statusLabel(s: Order["status"]) {
  return s === "pending"
    ? "À préparer"
    : s === "preparing"
    ? "En cuisine"
    : s === "served"
    ? "Servie"
    : "Annulée";
}
