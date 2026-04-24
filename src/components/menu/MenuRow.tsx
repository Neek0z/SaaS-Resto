import type { MenuItem } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export function MenuRow({ m }: { m: MenuItem }) {
  return (
    <div
      className="grid items-center gap-3 py-[10px] px-2 border-b border-line text-[13px] hover:bg-bg-2 transition-colors cursor-pointer"
      style={{ gridTemplateColumns: "1fr 60px 80px 60px" }}
    >
      <div>
        <div className="font-medium">{m.name}</div>
        <div className="text-[10.5px] text-ink-4 uppercase tracking-[0.08em] mt-[2px] flex items-center gap-2">
          <span>{m.cat}</span>
          <span
            className={cn(
              "trend",
              m.trend > 0 ? "up" : m.trend < 0 ? "down" : "flat"
            )}
          >
            {m.trend > 0 ? "↑" : m.trend < 0 ? "↓" : "—"} {Math.abs(m.trend)}%
          </span>
        </div>
      </div>
      <div className="display text-[18px] text-ink-1 text-right">{m.sold}</div>
      <div>
        <div className="margin-bar">
          <span style={{ width: `${m.margin}%` }} />
        </div>
        <div className="text-[10px] text-ink-4 mt-[3px] mono">{m.margin}%</div>
      </div>
      <div className="text-right">
        <span className={cn("stock-pill", m.stock)}>
          {m.stock === "ok" ? "OK" : m.stock === "low" ? "Bas" : "Rupt."}
        </span>
      </div>
    </div>
  );
}

export function stockLabel(s: MenuItem["stock"]) {
  return s === "ok" ? "En stock" : s === "low" ? "Stock bas" : "Rupture";
}
