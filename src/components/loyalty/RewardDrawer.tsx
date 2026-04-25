import { useEffect, useState } from "react";
import { Gift, Save } from "lucide-react";
import { Drawer } from "@/components/ui/drawer";
import type { LoyaltyReward } from "@/lib/loyalty-types";

const FIELD =
  "bg-bg-2 border border-line rounded-[10px] px-3 py-[9px] text-[13px] text-ink-1 outline-none focus:border-line-2 transition-colors w-full";

type RewardPayload = {
  name: string;
  description: string | null;
  pointsCost: number;
  active: boolean;
};

export function RewardDrawer({
  open,
  onClose,
  reward,
  onCreate,
  onUpdate,
}: {
  open: boolean;
  onClose: () => void;
  reward: LoyaltyReward | null;
  onCreate: (payload: RewardPayload) => Promise<void> | void;
  onUpdate: (id: string, payload: RewardPayload) => Promise<void> | void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState(100);
  const [active, setActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(reward?.name ?? "");
      setDescription(reward?.description ?? "");
      setCost(reward?.pointsCost ?? 100);
      setActive(reward?.active ?? true);
      setError(null);
      setSubmitting(false);
    }
  }, [open, reward]);

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Nom requis.");
      return;
    }
    if (!Number.isFinite(cost) || cost < 0) {
      setError("Coût invalide.");
      return;
    }
    setSubmitting(true);
    try {
      const payload: RewardPayload = {
        name: trimmed,
        description: description.trim() || null,
        pointsCost: Math.round(cost),
        active,
      };
      if (reward) await onUpdate(reward.id, payload);
      else await onCreate(payload);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={460}
      title={reward ? "Éditer la récompense" : "Nouvelle récompense"}
      subtitle={reward ? `Coût actuel : ${reward.pointsCost} pts` : "Définissez nom et coût en points"}
      footer={
        <div className="flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>
            Annuler
          </button>
          <button
            className="btn-primary inline-flex items-center gap-2"
            onClick={submit}
            disabled={!name.trim() || submitting}
          >
            <Save size={13} />
            {submitting ? "Enregistrement…" : reward ? "Enregistrer" : "Créer"}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-grid place-items-center w-[28px] h-[28px] rounded-md bg-ember/15 text-ember-soft">
            <Gift size={14} />
          </span>
          <span className="text-[12px] text-ink-3">Affichée dans le drawer client</span>
        </div>

        <Field label="Nom">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex. Café offert"
            className={FIELD}
          />
        </Field>

        <Field label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Détaillez ce que le client recevra…"
            rows={3}
            className={FIELD + " resize-none"}
          />
        </Field>

        <Field label="Coût en points">
          <input
            type="number"
            min={0}
            step={50}
            value={cost}
            onChange={(e) => setCost(Number(e.target.value) || 0)}
            className={FIELD + " w-[160px]"}
          />
        </Field>

        <label className="flex items-center gap-3 mt-1 cursor-pointer">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="w-[16px] h-[16px] accent-ember"
          />
          <span className="text-[13px] text-ink-1">Active immédiatement</span>
        </label>

        {error && <div className="text-[12px] text-danger mt-1">{error}</div>}
      </div>
    </Drawer>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-[6px]">
      <label className="chip-uppercase">{label}</label>
      {children}
    </div>
  );
}
