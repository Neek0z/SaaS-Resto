import { useState } from "react";
import { MessageSquarePlus, Star } from "lucide-react";
import { REVIEW_SOURCES, type NewReview, type ReviewSource } from "@/lib/review-types";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

const SCALE_BY_SOURCE: Record<ReviewSource, number> = {
  Google: 5,
  TripAdvisor: 5,
  TheFork: 10,
};

export function NewReviewModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: NewReview) => Promise<void>;
}) {
  const [source, setSource] = useState<ReviewSource>("Google");
  const [author, setAuthor] = useState("");
  const [rating, setRating] = useState(5);
  const [scale, setScale] = useState(5);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setSource("Google");
    setAuthor("");
    setRating(5);
    setScale(5);
    setText("");
  };

  const handleSourceChange = (s: ReviewSource) => {
    setSource(s);
    const newScale = SCALE_BY_SOURCE[s];
    setScale(newScale);
    if (rating > newScale) setRating(newScale);
  };

  const submit = async () => {
    if (!author.trim() || !text.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit({
        source,
        author: author.trim(),
        rating,
        scale,
        text: text.trim(),
      });
      reset();
    } finally {
      setSubmitting(false);
    }
  };

  const stars = scale === 10 ? Array.from({ length: 10 }, (_, i) => i + 1) : [1, 2, 3, 4, 5];

  return (
    <Modal
      open={open}
      onClose={onClose}
      width={560}
      title="Nouvel avis"
      subtitle="Saisir manuellement un avis client"
      footer={
        <div className="flex gap-2 justify-end">
          <button className="btn-ghost" onClick={onClose}>
            Annuler
          </button>
          <button
            className="btn-primary inline-flex items-center gap-2"
            onClick={submit}
            disabled={!author.trim() || !text.trim() || submitting}
          >
            <MessageSquarePlus size={13} />
            {submitting ? "Enregistrement…" : "Ajouter l'avis"}
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="chip-uppercase block mb-[6px]">Plateforme</label>
          <div className="segmented">
            {REVIEW_SOURCES.map((s) => (
              <button
                key={s}
                className={cn(source === s && "active")}
                onClick={() => handleSourceChange(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="col-span-2">
          <label className="chip-uppercase block mb-[6px]">Auteur</label>
          <input
            autoFocus
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Nom du client"
            className="w-full bg-bg-2 border border-line rounded-[10px] px-3 py-[9px] text-[13px] text-ink-1 outline-none focus:border-line-2 transition-colors"
          />
        </div>

        <div className="col-span-2">
          <label className="chip-uppercase block mb-[6px]">
            Note · {rating} / {scale}
          </label>
          <div className="flex items-center gap-1 flex-wrap">
            {stars.map((n) => (
              <button
                key={n}
                onClick={() => setRating(n)}
                className={cn(
                  "w-8 h-8 flex items-center justify-center rounded-[6px] border transition-all",
                  n <= rating
                    ? "bg-amber/15 border-amber text-amber"
                    : "bg-bg-2 border-line text-ink-4 hover:bg-bg-3"
                )}
                aria-label={`${n} sur ${scale}`}
              >
                <Star size={14} fill={n <= rating ? "currentColor" : "none"} />
              </button>
            ))}
          </div>
        </div>

        <div className="col-span-2">
          <label className="chip-uppercase block mb-[6px]">Commentaire</label>
          <textarea
            rows={5}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Texte de l'avis…"
            className="w-full bg-bg-2 border border-line rounded-[10px] px-3 py-[9px] text-[13px] text-ink-1 outline-none focus:border-line-2 transition-colors resize-none leading-[1.5]"
          />
          <div className="flex justify-between text-[10.5px] text-ink-4 mt-1 mono">
            <span>{text.length} caractères</span>
            <span>Échelle {scale} pts</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
