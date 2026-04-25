import { Calendar, Clock, Coins, Gift, Sparkles, Tag } from "lucide-react";
import type { EventType, RestaurantEvent } from "@/lib/event-types";
import { summarizeEvent } from "@/lib/event-types";
import { cn } from "@/lib/utils";

const ICONS: Record<EventType, typeof Calendar> = {
  reduction: Tag,
  happy_hour: Clock,
  menu_special: Sparkles,
  double_points: Coins,
  offre_libre: Gift,
};

export function EventBadge({
  event,
  size = "md",
  showSummary = false,
  className,
}: {
  event: Pick<
    RestaurantEvent,
    | "title"
    | "type"
    | "color"
    | "description"
    | "discountType"
    | "discountValue"
    | "loyaltyBonus"
    | "appliesTo"
    | "startTime"
    | "endTime"
  >;
  size?: "sm" | "md" | "lg";
  showSummary?: boolean;
  className?: string;
}) {
  const Icon = ICONS[event.type];
  const padding = size === "sm" ? "px-2 py-[3px]" : size === "lg" ? "px-3 py-2" : "px-[10px] py-[5px]";
  const fontSize = size === "sm" ? "text-[10.5px]" : size === "lg" ? "text-[13px]" : "text-[11.5px]";
  const iconSize = size === "sm" ? 10 : size === "lg" ? 14 : 12;
  return (
    <div
      className={cn(
        "inline-flex items-center gap-[6px] rounded-md font-semibold border",
        padding,
        fontSize,
        className
      )}
      style={{
        background: `${event.color}22`,
        color: event.color,
        borderColor: `${event.color}55`,
      }}
    >
      <Icon size={iconSize} className="flex-shrink-0" />
      <span className="truncate">{event.title}</span>
      {showSummary && (
        <span className="opacity-80 font-normal text-[0.92em] truncate">
          · {summarizeEvent(event as RestaurantEvent)}
        </span>
      )}
    </div>
  );
}
