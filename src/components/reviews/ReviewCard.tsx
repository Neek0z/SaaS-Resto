import { MessageSquareReply, Trash2 } from "lucide-react";
import type { Review } from "@/lib/review-types";
import { Stars } from "./Stars";
import { cn } from "@/lib/utils";

function formatRelative(iso: string): string {
  try {
    const d = new Date(iso);
    const diffMs = Date.now() - d.getTime();
    const minutes = Math.round(diffMs / 60000);
    if (minutes < 60) return `il y a ${Math.max(1, minutes)} min`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `il y a ${hours} h`;
    const days = Math.round(hours / 24);
    if (days < 7) return `il y a ${days} j`;
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  } catch {
    return "";
  }
}

export function ReviewCard({
  review,
  onReply,
  onDelete,
  compact = false,
}: {
  review: Review;
  onReply?: (r: Review) => void;
  onDelete?: (r: Review) => void;
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
        <div className="text-[11px] text-ink-4 ml-auto">{formatRelative(review.createdAt)}</div>
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

      {review.replied && review.replyText && (
        <div className="mt-3 p-[10px] rounded-[8px] border border-line bg-bg-1">
          <div className="chip-uppercase mb-1 !text-ok">Votre réponse</div>
          <div className="text-[12.5px] text-ink-2 leading-[1.55] whitespace-pre-line">
            {review.replyText}
          </div>
        </div>
      )}

      {!compact && (onReply || onDelete) && (
        <div className="mt-3 pt-3 border-t border-line flex justify-end gap-2">
          {onDelete && (
            <button
              className="btn-ghost inline-flex items-center gap-2 text-danger"
              onClick={() => onDelete(review)}
              title="Supprimer cet avis"
            >
              <Trash2 size={12} />
              Supprimer
            </button>
          )}
          {onReply && !review.replied && (
            <button
              className="btn-ghost inline-flex items-center gap-2"
              onClick={() => onReply(review)}
            >
              <MessageSquareReply size={12} />
              Rédiger une réponse
            </button>
          )}
          {onReply && review.replied && (
            <button
              className="btn-ghost inline-flex items-center gap-2"
              onClick={() => onReply(review)}
            >
              <MessageSquareReply size={12} />
              Modifier la réponse
            </button>
          )}
        </div>
      )}
    </div>
  );
}
