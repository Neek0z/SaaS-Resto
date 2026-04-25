import { useEffect, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import type { Review } from "@/lib/review-types";
import { Modal } from "@/components/ui/modal";
import { Stars } from "./Stars";

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

const TEMPLATES_POSITIVE = [
  "Bonjour {name}, un grand merci pour votre retour chaleureux. Nous sommes ravis d'avoir partagé ce moment avec vous — toute l'équipe vous attend déjà pour votre prochaine visite. Marc Sévère.",
  "Merci infiniment {name} ! C'est grâce à des clients comme vous que nous continuons à donner le meilleur chaque soir. À très bientôt à Maison Sévère.",
];

const TEMPLATES_NEUTRAL = [
  "Bonjour {name}, merci pour ce retour nuancé. Votre remarque sera transmise à l'équipe — nous serions ravis de vous accueillir à nouveau pour vous faire vivre notre meilleure version. Marc Sévère.",
];

const TEMPLATES_NEGATIVE = [
  "Bonjour {name}, nous sommes sincèrement désolés que votre expérience n'ait pas été à la hauteur de nos standards. Pourriez-vous nous contacter à contact@maison-severe.fr ? Nous aimerions comprendre et nous rattraper. Marc Sévère.",
  "Bonjour {name}, votre retour nous peine et nous le prenons très au sérieux. L'équipe a été briefée ce matin. Nous espérons pouvoir vous recevoir à nouveau et vous faire changer d'avis. Marc Sévère.",
];

export function ReplyModal({
  review,
  onClose,
  onSend,
}: {
  review: Review | null;
  onClose: () => void;
  onSend?: (review: Review, text: string) => void;
}) {
  const open = review !== null;
  const [text, setText] = useState("");

  useEffect(() => {
    if (review) setText(review.replyText ?? "");
  }, [review]);

  const templates =
    review && review.rating >= 4
      ? TEMPLATES_POSITIVE
      : review && review.rating === 3
      ? TEMPLATES_NEUTRAL
      : TEMPLATES_NEGATIVE;

  const applyTemplate = (tpl: string) => {
    if (!review) return;
    const firstName = review.author.split(" ")[0];
    setText(tpl.replace("{name}", firstName));
  };

  const send = () => {
    if (!review || !text.trim()) return;
    onSend?.(review, text.trim());
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      width={620}
      title="Répondre à l'avis"
      subtitle={review ? `${review.author} · ${review.source} · ${formatDate(review.createdAt)}` : undefined}
      footer={
        <div className="flex justify-between items-center gap-2">
          <div className="text-[10.5px] text-ink-4 mono">
            La réponse sera publiée en votre nom public.
          </div>
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={onClose}>
              Annuler
            </button>
            <button
              className="btn-primary inline-flex items-center gap-2"
              onClick={send}
              disabled={!text.trim()}
            >
              <Send size={13} />
              Publier
            </button>
          </div>
        </div>
      }
    >
      {review && (
        <div className="flex flex-col gap-4">
          {/* Original review */}
          <div className="p-3 bg-bg-2 rounded-[10px] border border-line">
            <div className="flex items-center gap-2 mb-2">
              <div className="avatar-circle w-7 h-7 text-[11px]">{review.author[0]}</div>
              <div>
                <div className="text-[12.5px] font-semibold">{review.author}</div>
                <div className="flex items-center gap-2">
                  <Stars rating={review.rating} scale={review.scale} size={11} />
                  <span className="text-[10.5px] text-ink-4 mono">
                    {review.rating}/{review.scale}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-[12.5px] text-ink-2 leading-[1.55]">{review.text}</div>
          </div>

          {/* Templates */}
          <div>
            <div className="chip-uppercase mb-2 flex items-center gap-[6px]">
              <Sparkles size={11} />
              Modèles suggérés
            </div>
            <div className="flex flex-col gap-2">
              {templates.map((tpl, i) => (
                <button
                  key={i}
                  className="text-left p-[10px] bg-bg-2 rounded-[8px] border border-line text-[12px] text-ink-3 hover:text-ink-1 hover:border-line-2 hover:bg-bg-3 transition-all"
                  onClick={() => applyTemplate(tpl)}
                >
                  {tpl.replace("{name}", review.author.split(" ")[0])}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="chip-uppercase mb-2">Votre réponse</div>
            <textarea
              rows={6}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Rédigez votre réponse…"
              className="w-full bg-bg-2 border border-line rounded-[10px] px-3 py-[10px] text-[13px] text-ink-1 outline-none focus:border-line-2 transition-colors resize-none leading-[1.5]"
            />
            <div className="flex justify-between text-[10.5px] text-ink-4 mt-1 mono">
              <span>{text.length} caractères</span>
              <span>Max 1000</span>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
