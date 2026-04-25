import { useEffect, useState } from "react";
import { Save, X } from "lucide-react";
import { Drawer } from "@/components/ui/drawer";
import {
  SOURCE_LABEL,
  type Customer,
  type CustomerPayload,
  type CustomerSource,
} from "@/lib/crm-types";

const FIELD =
  "bg-bg-2 border border-line rounded-[10px] px-3 py-[9px] text-[13px] text-ink-1 outline-none focus:border-line-2 transition-colors w-full";

function emptyPayload(): CustomerPayload {
  return {
    name: "",
    email: null,
    phone: null,
    source: "manual",
    tags: [],
    notes: null,
    optedInEmail: true,
    optedInSms: false,
  };
}

function fromCustomer(c: Customer): CustomerPayload {
  return {
    name: c.name,
    email: c.email,
    phone: c.phone,
    source: c.source,
    tags: c.tags,
    notes: c.notes,
    optedInEmail: c.optedInEmail,
    optedInSms: c.optedInSms,
  };
}

export function CustomerFormDrawer({
  open,
  onClose,
  editing,
  knownTags,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  editing: Customer | null;
  knownTags: string[];
  onSave: (payload: CustomerPayload) => Promise<void> | void;
}) {
  const [payload, setPayload] = useState<CustomerPayload>(emptyPayload());
  const [tagInput, setTagInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setPayload(editing ? fromCustomer(editing) : emptyPayload());
      setTagInput("");
      setError(null);
      setSubmitting(false);
    }
  }, [open, editing]);

  const update = <K extends keyof CustomerPayload>(
    key: K,
    value: CustomerPayload[K]
  ) => setPayload((p) => ({ ...p, [key]: value }));

  const addTag = (raw: string) => {
    const t = raw.trim();
    if (!t) return;
    if (payload.tags.includes(t)) return;
    update("tags", [...payload.tags, t]);
    setTagInput("");
  };

  const removeTag = (t: string) => {
    update(
      "tags",
      payload.tags.filter((x) => x !== t)
    );
  };

  const submit = async () => {
    if (!payload.name.trim()) {
      setError("Le nom est requis.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSave({
        ...payload,
        name: payload.name.trim(),
        email: payload.email?.trim() || null,
        phone: payload.phone?.trim() || null,
        notes: payload.notes?.trim() || null,
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec.");
    } finally {
      setSubmitting(false);
    }
  };

  const tagSuggestions = knownTags
    .filter((t) => !payload.tags.includes(t))
    .filter((t) => t.toLowerCase().includes(tagInput.toLowerCase()))
    .slice(0, 6);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={460}
      title={editing ? "Modifier le client" : "Nouveau client"}
      subtitle={editing ? "Informations & préférences" : "Ajouter à la base CRM"}
      footer={
        <div className="flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose} type="button">
            Annuler
          </button>
          <button
            className="btn-primary inline-flex items-center gap-2"
            onClick={submit}
            disabled={!payload.name.trim() || submitting}
            type="button"
          >
            <Save size={13} />
            {submitting ? "Enregistrement…" : editing ? "Mettre à jour" : "Créer"}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <Field label="Nom complet">
          <input
            autoFocus
            value={payload.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Marie Dupont"
            className={FIELD}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Email">
            <input
              type="email"
              value={payload.email ?? ""}
              onChange={(e) => update("email", e.target.value || null)}
              placeholder="marie@exemple.fr"
              className={FIELD}
            />
          </Field>
          <Field label="Téléphone">
            <input
              type="tel"
              value={payload.phone ?? ""}
              onChange={(e) => update("phone", e.target.value || null)}
              placeholder="06 12 34 56 78"
              className={FIELD}
            />
          </Field>
        </div>

        <Field label="Source">
          <div className="grid grid-cols-4 gap-1">
            {(Object.keys(SOURCE_LABEL) as CustomerSource[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => update("source", s)}
                className={`px-2 py-[8px] rounded-[8px] text-[11.5px] font-medium border transition-all ${
                  payload.source === s
                    ? "bg-ember/15 border-ember text-ember-soft"
                    : "bg-bg-2 border-line text-ink-3 hover:bg-bg-3"
                }`}
              >
                {SOURCE_LABEL[s]}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Tags">
          <div className="flex flex-wrap gap-1 mb-2">
            {payload.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 px-2 py-[3px] bg-bg-2 border border-line rounded-full text-[11px] text-ink-2"
              >
                {t}
                <button
                  type="button"
                  onClick={() => removeTag(t)}
                  className="text-ink-4 hover:text-ink-1"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addTag(tagInput);
              }
            }}
            placeholder="Ajouter un tag (Entrée)"
            className={FIELD}
          />
          {tagSuggestions.length > 0 && tagInput && (
            <div className="flex flex-wrap gap-1 mt-1">
              {tagSuggestions.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => addTag(t)}
                  className="px-2 py-[2px] bg-bg-3 border border-line rounded-full text-[11px] text-ink-3 hover:text-ink-1"
                >
                  + {t}
                </button>
              ))}
            </div>
          )}
        </Field>

        <Field label="Notes (optionnel)">
          <textarea
            value={payload.notes ?? ""}
            onChange={(e) => update("notes", e.target.value || null)}
            placeholder="Allergies, préférences, régime…"
            rows={3}
            className={`${FIELD} resize-none`}
          />
        </Field>

        <div className="border-t border-line pt-3 flex flex-col gap-2">
          <Toggle
            label="Accepte les emails marketing"
            checked={payload.optedInEmail}
            onChange={(v) => update("optedInEmail", v)}
          />
          <Toggle
            label="Accepte les SMS marketing"
            checked={payload.optedInSms}
            onChange={(v) => update("optedInSms", v)}
          />
          <p className="text-[10.5px] text-ink-4 leading-relaxed mt-1">
            En conformité RGPD : le consentement doit être recueilli explicitement
            auprès du client. Une mention de désinscription est ajoutée
            automatiquement à chaque email.
          </p>
        </div>

        {error && <div className="text-[12px] text-danger">{error}</div>}
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

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer">
      <span className="text-[12.5px] text-ink-2">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-[36px] h-[20px] rounded-full transition-colors ${
          checked ? "bg-ember" : "bg-bg-3 border border-line"
        }`}
      >
        <span
          className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white transition-transform ${
            checked ? "translate-x-[18px]" : "translate-x-[2px]"
          }`}
        />
      </button>
    </label>
  );
}
