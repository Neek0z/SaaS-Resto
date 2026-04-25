import { useEffect, useState } from "react";
import { UserPlus } from "lucide-react";
import { Modal } from "@/components/ui/modal";

export function NewCustomerModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: {
    name: string;
    email: string | null;
    phone: string | null;
  }) => Promise<void> | void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setName("");
      setEmail("");
      setPhone("");
      setSubmitting(false);
      setError(null);
    }
  }, [open]);

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Nom requis.");
      return;
    }
    setSubmitting(true);
    try {
      await onCreate({
        name: trimmed,
        email: email.trim() || null,
        phone: phone.trim() || null,
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de la création.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      width={460}
      title="Nouveau client"
      subtitle="Inscrit dans le programme fidélité"
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
            <UserPlus size={13} />
            {submitting ? "Création…" : "Créer"}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <Field label="Nom complet">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Marie Dupont"
            className="bg-bg-2 border border-line rounded-[10px] px-3 py-[9px] text-[13px] text-ink-1 outline-none focus:border-line-2 transition-colors"
          />
        </Field>
        <Field label="Email (optionnel)">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="marie@exemple.fr"
            className="bg-bg-2 border border-line rounded-[10px] px-3 py-[9px] text-[13px] text-ink-1 outline-none focus:border-line-2 transition-colors"
          />
        </Field>
        <Field label="Téléphone (optionnel)">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="06 12 34 56 78"
            className="bg-bg-2 border border-line rounded-[10px] px-3 py-[9px] text-[13px] text-ink-1 outline-none focus:border-line-2 transition-colors"
          />
        </Field>
        {error && <div className="text-[12px] text-danger">{error}</div>}
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
