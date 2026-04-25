import { useEffect, useState } from "react";
import { Coins } from "lucide-react";
import { Modal } from "@/components/ui/modal";

const FIELD =
  "bg-bg-2 border border-line rounded-[10px] px-3 py-[9px] text-[13px] text-ink-1 outline-none focus:border-line-2 transition-colors";

export function AdjustPointsModal({
  open,
  onClose,
  customerName,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  customerName: string;
  onSubmit: (points: number, reason: string) => Promise<void> | void;
}) {
  const [points, setPoints] = useState(100);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setPoints(100);
      setReason("");
      setSubmitting(false);
      setError(null);
    }
  }, [open]);

  const submit = async () => {
    const trimmed = reason.trim();
    if (!trimmed) {
      setError("Motif requis.");
      return;
    }
    if (!Number.isFinite(points) || points === 0) {
      setError("Saisissez un nombre de points (positif ou négatif).");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(Math.round(points), trimmed);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      width={420}
      title="Ajuster les points"
      subtitle={`Pour ${customerName}`}
      footer={
        <div className="flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>
            Annuler
          </button>
          <button
            className="btn-primary inline-flex items-center gap-2"
            onClick={submit}
            disabled={!reason.trim() || submitting}
          >
            <Coins size={13} />
            {submitting ? "Enregistrement…" : "Ajouter"}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <Field label="Points (négatif pour retirer)">
          <input
            autoFocus
            type="number"
            value={points}
            onChange={(e) => setPoints(Number(e.target.value))}
            className={FIELD + " w-[160px]"}
          />
        </Field>
        <Field label="Motif">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex. Cadeau anniversaire, geste commercial…"
            rows={3}
            className={FIELD + " resize-none"}
          />
        </Field>
        {error && <div className="text-[12px] text-danger">{error}</div>}
        <div className="text-[11px] text-ink-4">
          Une transaction sera enregistrée dans l'historique du client.
        </div>
      </div>
    </Modal>
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
