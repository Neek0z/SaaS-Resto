import type { Reservation } from "@/lib/reservation-types";
import { cn } from "@/lib/utils";

export function ResaRow({
  r,
  current = false,
  onClick,
}: {
  r: Reservation;
  current?: boolean;
  onClick?: (r: Reservation) => void;
}) {
  const borderClass =
    r.status === "seated"
      ? "border-l-ok"
      : r.status === "confirmed"
      ? "border-l-ember"
      : r.status === "pending"
      ? "border-l-ember-soft"
      : "border-l-danger opacity-60";

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={() => onClick?.(r)}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick(r);
        }
      }}
      className={cn(
        "grid items-center gap-3 p-[10px] rounded-lg border-l-2 transition-colors cursor-pointer hover:bg-bg-2 focus:outline-none focus:bg-bg-2",
        borderClass
      )}
      style={{ gridTemplateColumns: "58px 1fr auto" }}
    >
      <div
        className={cn(
          "mono text-[13px] font-medium",
          current ? "text-ember font-bold" : "text-ink-2"
        )}
      >
        {r.time}
      </div>

      <div>
        <div className="text-[13px] font-medium text-ink-1 flex items-center gap-2">
          {r.name}
          {current && (
            <span className="mono text-[9px] uppercase tracking-wider text-ember-soft bg-ember/10 px-[5px] py-[1px] rounded border border-ember-deep/40">
              maintenant
            </span>
          )}
        </div>
        <div className="text-[11.5px] text-ink-3 mt-[2px] flex gap-2 items-center flex-wrap">
          <span>
            {r.covers} cv · {statusLabel(r.status)}
          </span>
          {r.note && <span className="text-ember-soft/70">· {r.note}</span>}
        </div>
      </div>

      <div className="mono text-[11px] bg-bg-3 px-[7px] py-[2px] rounded text-ink-2">
        {r.table}
      </div>
    </div>
  );
}

export function statusLabel(s: Reservation["status"]) {
  if (s === "seated") return "Installée";
  if (s === "confirmed") return "Confirmée";
  if (s === "pending") return "En attente";
  return "No-show";
}
