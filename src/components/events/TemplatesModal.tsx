import { Clock, Coins, Gift, Heart, Sparkles, Wine } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import type { EventPayload } from "@/lib/event-types";

type Template = {
  key: string;
  icon: typeof Clock;
  title: string;
  hint: string;
  payload: EventPayload;
};

const TEMPLATES: Template[] = [
  {
    key: "happy_hour",
    icon: Clock,
    title: "Happy Hour",
    hint: "Mardi → Vendredi · 17h–19h · -30% sur les boissons",
    payload: {
      title: "Happy Hour",
      description: "-30% sur les boissons de 17h à 19h",
      type: "happy_hour",
      discountType: "percent",
      discountValue: 30,
      loyaltyBonus: null,
      appliesTo: "all",
      appliesToId: null,
      daysOfWeek: [2, 3, 4, 5],
      startDate: null,
      endDate: null,
      startTime: "17:00",
      endTime: "19:00",
      displayOnCarte: true,
      color: "#4f8a9a",
      active: true,
    },
  },
  {
    key: "mercredi_famille",
    icon: Heart,
    title: "Mercredi famille",
    hint: "Tous les mercredis · -20% sur l'addition",
    payload: {
      title: "Mercredi famille",
      description: "-20% sur l'addition pour les familles",
      type: "reduction",
      discountType: "percent",
      discountValue: 20,
      loyaltyBonus: null,
      appliesTo: "all",
      appliesToId: null,
      daysOfWeek: [3],
      startDate: null,
      endDate: null,
      startTime: null,
      endTime: null,
      displayOnCarte: true,
      color: "#9b5a8b",
      active: true,
    },
  },
  {
    key: "menu_midi",
    icon: Sparkles,
    title: "Menu du midi",
    hint: "Lundi → Vendredi · Formule à 15€",
    payload: {
      title: "Menu du midi",
      description: "Formule entrée + plat + dessert à 15€, du lundi au vendredi",
      type: "menu_special",
      discountType: null,
      discountValue: 15,
      loyaltyBonus: null,
      appliesTo: "all",
      appliesToId: null,
      daysOfWeek: [1, 2, 3, 4, 5],
      startDate: null,
      endDate: null,
      startTime: "12:00",
      endTime: "14:30",
      displayOnCarte: true,
      color: "#6ab38e",
      active: true,
    },
  },
  {
    key: "double_points_lundi",
    icon: Coins,
    title: "Double points lundi",
    hint: "Tous les lundis · ×2 sur la fidélité",
    payload: {
      title: "Double points lundi",
      description: "Vos points fidélité doublés tous les lundis",
      type: "double_points",
      discountType: null,
      discountValue: null,
      loyaltyBonus: 2,
      appliesTo: "all",
      appliesToId: null,
      daysOfWeek: [1],
      startDate: null,
      endDate: null,
      startTime: null,
      endTime: null,
      displayOnCarte: true,
      color: "#d29528",
      active: true,
    },
  },
  {
    key: "soiree_oenologie",
    icon: Wine,
    title: "Soirée œnologie",
    hint: "Ponctuel · texte libre",
    payload: {
      title: "Soirée œnologie",
      description: "Dégustation guidée par notre sommelier, sur réservation",
      type: "offre_libre",
      discountType: null,
      discountValue: null,
      loyaltyBonus: null,
      appliesTo: "all",
      appliesToId: null,
      daysOfWeek: [],
      startDate: null,
      endDate: null,
      startTime: "19:30",
      endTime: "22:00",
      displayOnCarte: true,
      color: "#5b6ec4",
      active: false,
    },
  },
  {
    key: "anniversaire",
    icon: Gift,
    title: "Anniversaire client",
    hint: "Offre libre · dessert offert",
    payload: {
      title: "Anniversaire offert",
      description: "Un dessert offert pour fêter votre anniversaire au restaurant",
      type: "offre_libre",
      discountType: null,
      discountValue: null,
      loyaltyBonus: null,
      appliesTo: "all",
      appliesToId: null,
      daysOfWeek: [],
      startDate: null,
      endDate: null,
      startTime: null,
      endTime: null,
      displayOnCarte: true,
      color: "#e8733a",
      active: true,
    },
  },
];

export function TemplatesModal({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (payload: EventPayload) => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      width={620}
      title="Créer depuis un modèle"
      subtitle="Choisissez un modèle, ajustez ensuite les détails à votre établissement."
      footer={
        <div className="flex justify-end">
          <button className="btn-ghost" onClick={onClose}>
            Annuler
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        {TEMPLATES.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                onSelect(t.payload);
                onClose();
              }}
              className="text-left p-3 rounded-[10px] border border-line bg-bg-2 hover:border-line-2 hover:bg-bg-3 transition-all flex gap-3"
            >
              <span
                className="inline-grid place-items-center w-[36px] h-[36px] rounded-md flex-shrink-0"
                style={{
                  background: `${t.payload.color}22`,
                  color: t.payload.color,
                }}
              >
                <Icon size={16} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold leading-tight">{t.title}</div>
                <div className="text-[11px] text-ink-3 leading-snug mt-1">{t.hint}</div>
              </div>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}
