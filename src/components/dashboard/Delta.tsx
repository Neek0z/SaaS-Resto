import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function Delta({ value, invert = false }: { value: number; invert?: boolean }) {
  if (value === 0) {
    return (
      <span className="kpi-delta" style={{ background: "var(--bg-3)", color: "var(--ink-3)" }}>
        — 0%
      </span>
    );
  }
  const up = value > 0;
  const good = invert ? !up : up;
  return (
    <span className={cn("kpi-delta", good ? "up" : "down")}>
      {up ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}
