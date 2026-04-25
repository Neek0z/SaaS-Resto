import { useEffect, useState } from "react";
import { Check, Copy, Mail } from "lucide-react";
import { Modal } from "@/components/ui/modal";

const FIELD =
  "bg-bg-2 border border-line rounded-[10px] px-3 py-[9px] text-[13px] text-ink-1 outline-none focus:border-line-2 transition-colors";

export function SendMessageModal({
  open,
  onClose,
  customerName,
  customerEmail,
  programName,
}: {
  open: boolean;
  onClose: () => void;
  customerName: string;
  customerEmail: string | null;
  programName: string;
}) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      setSubject(`Un mot de ${programName}`);
      setBody(
        `Bonjour ${customerName},\n\nNous tenions à vous remercier de votre fidélité.\n\nÀ très vite,\nL'équipe`
      );
      setCopied(false);
    }
  }, [open, customerName, programName]);

  const fullText = `À : ${customerEmail ?? "(email manquant)"}\nObjet : ${subject}\n\n${body}`;

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Ignored.
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      width={520}
      title="Envoyer un message"
      subtitle="L'envoi automatique sera disponible dans la prochaine version. Pour l'instant, copiez le texte."
      footer={
        <div className="flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>
            Fermer
          </button>
          <button
            className="btn-primary inline-flex items-center gap-2"
            onClick={() => void copyAll()}
            type="button"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? "Copié" : "Copier le message"}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-[12px] text-ink-3">
          <Mail size={13} />
          <span className="mono text-ink-2">{customerEmail ?? "Pas d'email enregistré"}</span>
        </div>
        <Field label="Objet">
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className={FIELD}
          />
        </Field>
        <Field label="Message">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            className={FIELD + " resize-none"}
          />
        </Field>
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
