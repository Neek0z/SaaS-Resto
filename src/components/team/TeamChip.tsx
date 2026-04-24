import type { TeamMember } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export function TeamChip({ m, showHours = false }: { m: TeamMember; showHours?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-[10px] p-[10px] rounded-[10px] bg-bg-2 border border-line transition-all hover:bg-bg-3 hover:-translate-y-[1px]",
        m.status === "late" && "border-danger/30 bg-danger/5"
      )}
    >
      <div className="avatar-circle w-8 h-8 text-[11px]">{m.avatar}</div>
      <div className="min-w-0 flex-1">
        <div className="text-[12.5px] font-semibold leading-tight truncate">{m.name}</div>
        <div className="text-[10.5px] text-ink-3 mt-[2px]">{m.role}</div>
        {showHours && (
          <div className="text-[10px] text-ink-4 mono mt-[2px]">{m.hours}</div>
        )}
      </div>
      <span
        className={cn(
          "w-[7px] h-[7px] rounded-full flex-shrink-0",
          m.status === "service" && "bg-ok",
          m.status === "break" && "bg-amber",
          m.status === "late" && "bg-danger"
        )}
      />
    </div>
  );
}
