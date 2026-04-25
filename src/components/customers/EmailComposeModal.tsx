import { useEffect, useState } from "react";
import { Mail, Send } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { useAuth } from "@/contexts/AuthContext";
import { createCampaign, createRecipients, sendCampaign } from "@/lib/api/campaigns-db";
import { EMPTY_SEGMENT, type Customer } from "@/lib/crm-types";

const FIELD =
  "bg-bg-2 border border-line rounded-[10px] px-3 py-[9px] text-[13px] text-ink-1 outline-none focus:border-line-2 transition-colors w-full";

export function EmailComposeModal({
  open,
  onClose,
  customer,
}: {
  open: boolean;
  onClose: () => void;
  customer: Customer | null;
}) {
  const { restaurant } = useAuth();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!open) {
      setSubject("");
      setBody("");
      setSending(false);
      setError(null);
      setSuccess(false);
    }
  }, [open]);

  const submit = async () => {
    if (!customer || !customer.email || !restaurant) return;
    if (!subject.trim() || !body.trim()) {
      setError("Sujet et message requis.");
      return;
    }
    setSending(true);
    setError(null);
    try {
      const camp = await createCampaign(restaurant.id, {
        type: "newsletter",
        subject: subject.trim(),
        senderName: restaurant.name,
        replyTo: null,
        content: {
          title: subject.trim(),
          body: body.trim(),
          cta_text: null,
          cta_url: null,
          image_url: null,
        },
        templateId: null,
        segment: EMPTY_SEGMENT,
        status: "draft",
        scheduledAt: null,
      });
      await createRecipients(camp.id, [
        { customerId: customer.id, email: customer.email },
      ]);
      const result = await sendCampaign(camp.id, restaurant.id);
      if (result.sent === 0) {
        setError("L'envoi a échoué.");
      } else {
        setSuccess(true);
        setTimeout(onClose, 1500);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de l'envoi.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      width={520}
      title="Email individuel"
      subtitle={customer ? `À ${customer.name} · ${customer.email}` : undefined}
      footer={
        success ? null : (
          <div className="flex justify-end gap-2">
            <button className="btn-ghost" onClick={onClose} type="button">
              Annuler
            </button>
            <button
              className="btn-primary inline-flex items-center gap-2"
              onClick={submit}
              disabled={!subject.trim() || !body.trim() || sending}
              type="button"
            >
              <Send size={13} />
              {sending ? "Envoi…" : "Envoyer"}
            </button>
          </div>
        )
      }
    >
      {success ? (
        <div className="text-center py-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-ok/15 text-ok mb-3">
            <Mail size={20} />
          </div>
          <div className="display text-[18px] font-medium">Email envoyé !</div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <Field label="Sujet">
            <input
              autoFocus
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Une attention spéciale pour vous"
              className={FIELD}
            />
          </Field>

          <Field label="Message">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={`Bonjour ${customer?.name?.split(/\s+/)[0] ?? ""},\n\n…`}
              rows={8}
              className={`${FIELD} resize-none font-normal`}
            />
          </Field>

          <p className="text-[10.5px] text-ink-4 leading-relaxed">
            Une mention de désinscription sera ajoutée automatiquement en pied
            d'email.
          </p>

          {error && <div className="text-[12px] text-danger">{error}</div>}
        </div>
      )}
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
