import { useEffect, useMemo, useState } from "react";
import { Users } from "lucide-react";
import type { Reservation, ResaStatus } from "@/lib/reservation-types";
import type { TableEntry, TableZone } from "@/hooks/useTables";

const START_H = 11;
const END_H = 24;
const TOTAL = END_H - START_H;

const ZONE_LABEL: Record<TableZone, string> = {
  inside: "Salle",
  terrace: "Terrasse",
  bar: "Bar",
  private: "Privée",
};

const STATUS_STYLE: Record<
  ResaStatus,
  { bg: string; border: string; label: string }
> = {
  seated: {
    bg: "rgba(74,164,108,0.30)",
    border: "rgba(74,164,108,0.65)",
    label: "Installée",
  },
  confirmed: {
    bg: "rgba(232,115,58,0.30)",
    border: "rgba(232,115,58,0.65)",
    label: "Confirmée",
  },
  pending: {
    bg: "rgba(232,196,113,0.25)",
    border: "rgba(232,196,113,0.65)",
    label: "À valider",
  },
  noshow: {
    bg: "rgba(216,71,71,0.20)",
    border: "rgba(216,71,71,0.55)",
    label: "No-show",
  },
};

function timeToHours(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h + (m || 0) / 60;
}

function pct(h: number): number {
  return ((h - START_H) / TOTAL) * 100;
}

function clampPct(h: number): number {
  return Math.max(0, Math.min(100, pct(h)));
}

function currentHour(): number {
  const d = new Date();
  return d.getHours() + d.getMinutes() / 60;
}

function isSameDay(iso: string): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return iso === today;
}

export function ReservationsPlanning({
  date,
  tables,
  resas,
  onSelectResa,
  onCreateAt,
}: {
  date: string;
  tables: TableEntry[];
  resas: Reservation[];
  onSelectResa: (r: Reservation) => void;
  onCreateAt: (table: string, time: string) => void;
}) {
  const [now, setNow] = useState<number>(() => currentHour());
  useEffect(() => {
    const id = setInterval(() => setNow(currentHour()), 60_000);
    return () => clearInterval(id);
  }, []);

  const showNow = isSameDay(date) && now >= START_H && now <= END_H;

  const sortedTables = useMemo(() => {
    const order: Record<TableZone, number> = {
      inside: 0,
      terrace: 1,
      bar: 2,
      private: 3,
    };
    return [...tables].sort((a, b) => {
      const za = order[a.zone];
      const zb = order[b.zone];
      if (za !== zb) return za - zb;
      return a.displayOrder - b.displayOrder;
    });
  }, [tables]);

  const resasByTable = useMemo(() => {
    const map = new Map<string, Reservation[]>();
    for (const r of resas) {
      if (r.status === "noshow") continue;
      const arr = map.get(r.table) ?? [];
      arr.push(r);
      map.set(r.table, arr);
    }
    return map;
  }, [resas]);

  const HOURS = Array.from({ length: TOTAL + 1 }, (_, i) => START_H + i);

  if (sortedTables.length === 0) {
    return (
      <div className="py-12 text-center text-[13px] text-ink-3 italic">
        Aucune table active configurée.
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header axis */}
      <div
        className="grid sticky top-0 bg-bg-1 z-[2] border-b border-line"
        style={{ gridTemplateColumns: "150px 1fr" }}
      >
        <div className="text-[10px] mono uppercase tracking-[0.12em] text-ink-4 px-2 py-2">
          Tables · {sortedTables.length}
        </div>
        <div className="relative h-[28px]">
          {HOURS.map((h) => (
            <div
              key={h}
              className="absolute top-0 bottom-0 text-[10px] text-ink-4 mono"
              style={{ left: `${pct(h)}%`, transform: "translateX(-50%)" }}
            >
              {String(h % 24).padStart(2, "0")}h
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="relative">
        {sortedTables.map((t) => {
          const tableResas = resasByTable.get(t.number) ?? [];
          return (
            <div
              key={t.id}
              className="grid items-center border-b border-line last:border-b-0"
              style={{ gridTemplateColumns: "150px 1fr", minHeight: 44 }}
            >
              <div className="flex items-center gap-2 px-2 py-1 min-w-0">
                <div className="mono text-[12.5px] font-bold text-ink-1 shrink-0">
                  T{t.number}
                </div>
                <div className="min-w-0">
                  <div className="text-[10.5px] text-ink-3 inline-flex items-center gap-1 mono uppercase tracking-[0.06em]">
                    <Users size={9} />
                    {t.capacity}cv
                  </div>
                  <div className="text-[10px] text-ink-4 truncate">
                    {ZONE_LABEL[t.zone]}
                  </div>
                </div>
              </div>

              <div className="relative h-[36px]">
                {/* Grid lines */}
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="absolute top-0 bottom-0 border-l border-line/30"
                    style={{ left: `${pct(h)}%` }}
                  />
                ))}

                {/* Empty-slot click overlay (per hour) */}
                {HOURS.slice(0, -1).map((h) => {
                  const hStart = h;
                  const hEnd = h + 1;
                  return (
                    <button
                      key={`slot-${h}`}
                      type="button"
                      className="absolute top-0 bottom-0 hover:bg-ember/[0.06] focus:bg-ember/10 focus:outline-none transition-colors"
                      style={{
                        left: `${pct(hStart)}%`,
                        width: `${pct(hEnd) - pct(hStart)}%`,
                      }}
                      onClick={() =>
                        onCreateAt(
                          t.number,
                          `${String(h).padStart(2, "0")}:00`
                        )
                      }
                      title={`Nouvelle résa · table ${t.number} · ${String(
                        h
                      ).padStart(2, "0")}:00`}
                      aria-label={`Créer une réservation à ${h}h pour la table ${t.number}`}
                    />
                  );
                })}

                {/* Reservation blocks */}
                {tableResas.map((r) => {
                  const startH = timeToHours(r.time);
                  const dur = (r.durationMinutes || 90) / 60;
                  const left = clampPct(startH);
                  const width = Math.max(
                    1.5,
                    clampPct(startH + dur) - left
                  );
                  const style = STATUS_STYLE[r.status];
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectResa(r);
                      }}
                      className="absolute top-1/2 -translate-y-1/2 h-[26px] rounded-[6px] px-2 text-left overflow-hidden hover:brightness-125 focus:outline-none focus:ring-2 focus:ring-ember/50 transition-all"
                      style={{
                        left: `${left}%`,
                        width: `${width}%`,
                        background: style.bg,
                        border: `1px solid ${style.border}`,
                      }}
                      title={`${r.name} · ${r.time} · ${r.covers} cv · ${style.label}`}
                    >
                      <div className="flex items-center gap-1 text-[10.5px] font-semibold text-ink-1 leading-tight whitespace-nowrap">
                        <span className="mono">{r.time}</span>
                        <span className="opacity-60">·</span>
                        <span className="truncate">{r.name}</span>
                      </div>
                      <div className="text-[9px] text-ink-2 mono leading-tight">
                        {r.covers}cv
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* "Now" vertical line */}
        {showNow && (
          <div
            className="absolute top-0 bottom-0 pointer-events-none z-[1]"
            style={{
              left: `calc(150px + (100% - 150px) * ${pct(now) / 100})`,
            }}
          >
            <div className="absolute top-0 bottom-0 w-px bg-ember" />
            <div
              className="absolute -top-[20px] text-[9.5px] mono text-ember font-semibold bg-bg-1 px-1 rounded"
              style={{ transform: "translateX(-50%)" }}
            >
              {String(Math.floor(now)).padStart(2, "0")}:
              {String(Math.round((now - Math.floor(now)) * 60)).padStart(2, "0")}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 mt-3 text-[11px] text-ink-3">
        {(Object.keys(STATUS_STYLE) as ResaStatus[])
          .filter((s) => s !== "noshow")
          .map((s) => (
            <span key={s} className="inline-flex items-center gap-1">
              <span
                className="inline-block w-[10px] h-[10px] rounded-sm"
                style={{
                  background: STATUS_STYLE[s].bg,
                  border: `1px solid ${STATUS_STYLE[s].border}`,
                }}
              />
              {STATUS_STYLE[s].label}
            </span>
          ))}
        <span className="text-ink-4 ml-auto italic">
          Clique sur un créneau libre pour créer
        </span>
      </div>
    </div>
  );
}
