import { useEffect, useState } from "react";
import type { TeamMember } from "@/lib/team-types";
import { cn } from "@/lib/utils";

const START_H = 12;
const END_H = 26; // 02:00 next day
const TOTAL = END_H - START_H; // 14 hours

function currentHour(): number {
  const d = new Date();
  return d.getHours() + d.getMinutes() / 60;
}

const HOURS = Array.from({ length: TOTAL + 1 }, (_, i) => START_H + i);

function fmt(h: number) {
  const hh = ((Math.floor(h) % 24) + 24) % 24;
  const mm = Math.round((h - Math.floor(h)) * 60);
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function pct(h: number) {
  return ((h - START_H) / TOTAL) * 100;
}

const KIND_BG: Record<TeamMember["kind"], string> = {
  service:
    "linear-gradient(90deg, rgba(198,93,26,0.35) 0%, rgba(198,93,26,0.55) 100%)",
  kitchen:
    "linear-gradient(90deg, rgba(210,149,40,0.30) 0%, rgba(210,149,40,0.55) 100%)",
  bar: "linear-gradient(90deg, rgba(194,86,60,0.30) 0%, rgba(194,86,60,0.55) 100%)",
  late: "repeating-linear-gradient(45deg, rgba(216,71,71,0.35), rgba(216,71,71,0.35) 6px, rgba(216,71,71,0.15) 6px, rgba(216,71,71,0.15) 12px)",
};

const KIND_BORDER: Record<TeamMember["kind"], string> = {
  service: "rgba(198,93,26,0.55)",
  kitchen: "rgba(210,149,40,0.55)",
  bar: "rgba(194,86,60,0.55)",
  late: "rgba(216,71,71,0.55)",
};

export function SchedulePlanning({ team }: { team: TeamMember[] }) {
  const [now, setNow] = useState<number>(() => currentHour());
  useEffect(() => {
    const id = setInterval(() => setNow(currentHour()), 60_000);
    return () => clearInterval(id);
  }, []);
  const showNow = now >= START_H && now <= END_H;
  return (
    <div className="flex flex-col gap-0">
      {/* Hour axis */}
      <div
        className="relative border-b border-line"
        style={{ gridTemplateColumns: `160px 1fr`, display: "grid" }}
      >
        <div />
        <div className="relative h-[28px]">
          {HOURS.map((h) => (
            <div
              key={h}
              className="absolute top-0 bottom-0 text-[10px] text-ink-4 mono"
              style={{ left: `${pct(h)}%`, transform: "translateX(-50%)" }}
            >
              {fmt(h)}
            </div>
          ))}
        </div>
      </div>

      {/* Rows */}
      <div className="relative">
        {team.map((m) => (
          <div
            key={m.name}
            className="grid items-center border-b border-line last:border-b-0"
            style={{ gridTemplateColumns: "160px 1fr", minHeight: 44 }}
          >
            <div className="flex items-center gap-2 pr-2">
              <div className="avatar-circle w-6 h-6 text-[10px]">{m.avatar}</div>
              <div className="min-w-0">
                <div className="text-[12px] font-semibold leading-tight truncate">
                  {m.name}
                </div>
                <div className="text-[10px] text-ink-4">{m.role}</div>
              </div>
            </div>

            <div className="relative h-[30px]">
              {/* Grid lines */}
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="absolute top-0 bottom-0 border-l border-line/40"
                  style={{ left: `${pct(h)}%` }}
                />
              ))}

              {/* Shift bar */}
              <div
                className="absolute top-1/2 -translate-y-1/2 h-[16px] rounded-[6px]"
                style={{
                  left: `${pct(m.start)}%`,
                  width: `${pct(m.end) - pct(m.start)}%`,
                  background: KIND_BG[m.kind],
                  border: `1px solid ${KIND_BORDER[m.kind]}`,
                }}
              />

              {/* Break overlay */}
              {m.breakStart !== null && m.breakEnd !== null && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-[16px] rounded-[4px]"
                  style={{
                    left: `${pct(m.breakStart)}%`,
                    width: `${pct(m.breakEnd) - pct(m.breakStart)}%`,
                    background:
                      "repeating-linear-gradient(45deg, rgba(232,196,113,0.3), rgba(232,196,113,0.3) 4px, rgba(232,196,113,0.1) 4px, rgba(232,196,113,0.1) 8px)",
                    border: "1px solid rgba(232,196,113,0.45)",
                  }}
                />
              )}
            </div>
          </div>
        ))}

        {/* "Now" vertical line */}
        {showNow && (
          <div
            className="absolute top-0 bottom-0 pointer-events-none"
            style={{ left: `calc(160px + ${pct(now)}% - ${pct(now) * 1.6}px)` }}
          >
            <div className="absolute top-0 bottom-0 w-px bg-ember" />
            <div
              className="absolute -top-[10px] text-[9.5px] mono text-ember font-semibold bg-bg-1 px-1 rounded"
              style={{ transform: "translateX(-50%)" }}
            >
              {fmt(now)}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 mt-3 text-[11px] text-ink-3">
        <LegendSwatch color={KIND_BORDER.service} bg={KIND_BG.service} label="Salle" />
        <LegendSwatch color={KIND_BORDER.kitchen} bg={KIND_BG.kitchen} label="Cuisine" />
        <LegendSwatch color={KIND_BORDER.bar} bg={KIND_BG.bar} label="Bar" />
        <LegendSwatch color={KIND_BORDER.late} bg={KIND_BG.late} label="En retard" />
        <span className={cn("ml-auto")}>
          <span className="inline-block w-[10px] h-[10px] mr-1 align-middle rounded-sm" style={{ background: "repeating-linear-gradient(45deg, rgba(232,196,113,0.4), rgba(232,196,113,0.4) 3px, rgba(232,196,113,0.1) 3px, rgba(232,196,113,0.1) 6px)" }} />
          Pause
        </span>
      </div>
    </div>
  );
}

function LegendSwatch({ color, bg, label }: { color: string; bg: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span
        className="inline-block w-[10px] h-[10px] rounded-sm"
        style={{ background: bg, border: `1px solid ${color}` }}
      />
      {label}
    </span>
  );
}
