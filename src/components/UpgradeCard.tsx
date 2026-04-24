import { useNavigate } from "react-router-dom";
import { Lock, Sparkles } from "lucide-react";
import {
  FEATURE_LABELS,
  PLAN_LABELS,
  PLAN_PRICES,
  type Feature,
  type Plan,
} from "@/config/plans";

export function UpgradeCard({
  feature,
  requiredPlan,
}: {
  feature?: Feature;
  requiredPlan: Plan;
}) {
  const navigate = useNavigate();
  const price = PLAN_PRICES[requiredPlan];
  const label = feature ? FEATURE_LABELS[feature] : "Cette fonctionnalité";

  return (
    <div className="relative overflow-hidden rounded-[14px] border border-ember-deep/40 bg-gradient-to-br from-bg-2 to-bg-1 p-6">
      <div
        className="absolute inset-0 opacity-[0.08] pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 20% 0%, var(--ember), transparent 60%)",
        }}
      />
      <div className="relative">
        <div className="flex items-center gap-[6px] mb-3">
          <Lock size={12} className="text-ember-soft" />
          <span className="chip-uppercase !text-ember-soft">Fonctionnalité verrouillée</span>
        </div>

        <h3 className="display font-medium text-[22px] leading-tight m-0 mb-2">
          {label}{" "}
          <em className="not-italic italic text-ember-soft font-normal">
            est inclus dans {PLAN_LABELS[requiredPlan]}.
          </em>
        </h3>

        <p className="text-[13px] text-ink-3 max-w-[420px] mb-5">
          Passez au plan {PLAN_LABELS[requiredPlan]} pour débloquer {label.toLowerCase()} et
          l'ensemble des outils associés.
        </p>

        <div className="flex items-end gap-4 mb-5">
          <div>
            <div className="display text-[32px] font-medium leading-none">
              {price.monthly}€
              <span className="text-[14px] text-ink-3 font-normal"> / mois</span>
            </div>
            <div className="text-[11px] text-ink-4 mono mt-1">
              ou {price.yearly}€ / an · 2 mois offerts
            </div>
          </div>
        </div>

        <button
          className="btn-primary inline-flex items-center gap-2"
          onClick={() => navigate("/parametres?tab=abonnement")}
        >
          <Sparkles size={13} />
          Passer au plan {PLAN_LABELS[requiredPlan]}
        </button>
      </div>
    </div>
  );
}
