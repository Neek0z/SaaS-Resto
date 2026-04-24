import { MessageSquareReply } from "lucide-react";
import type { Review } from "@/lib/mock-data";
import { Stars } from "./Stars";
import { cn } from "@/lib/utils";

export function ReviewCard({
  review,
  onReply,
  compact = false,
}: {
  review: Review;
  onReply?: (r: Review) => void;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "p-3 bg-bg-2 rounded-lg border border-line transition-colors hover:bg-bg-3 hover:border-line-2",
        compact ? "mb-2" : "mb-0"
      )}
    >
      <div className="flex items-center gap-2 mb-[6px]">
        <div className="avatar-circle w-6 h-6 text-[10px]">{review.author[0]}</div>
        <div className="text-[13px] font-semibold">{review.author}</div>
        <span className="chip-uppercase text-[10px] !tracking-[0.08em]">
          · {review.source}
        </span>
        <div className="text-[11px] text-ink-4 ml-auto">{review.time}</div>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <Stars rating={review.rating} scale={review.scale} />
        <span className="mono text-[11px] text-ink-3">
          {review.rating}/{review.scale}
        </span>
        {!review.replied && (
          <span className="ml-auto channel-pill" style={{ color: "var(--danger)" }}>
            À répondre
          </span>
        )}
        {review.replied && (
          <span className="ml-auto channel-pill" style={{ color: "var(--ok)" }}>
            Répondu
          </span>
        )}
      </div>

      <div className="text-[13px] text-ink-2 leading-[1.55]">{review.text}</div>

      {!compact && !review.replied && onReply && (
        <div className="mt-3 pt-3 border-t border-line flex justify-end">
          <button
            className="btn-ghost inline-flex items-center gap-2"
            onClick={() => onReply(review)}
          >
            <MessageSquareReply size={12} />
            Rédiger une réponse
          </button>
        </div>
      )}
    </div>
  );
}
