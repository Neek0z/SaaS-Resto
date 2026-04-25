import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Eye,
  Send,
  Sparkles,
  Users,
} from "lucide-react";
import { Drawer } from "@/components/ui/drawer";
import { useAuth } from "@/contexts/AuthContext";
import { useSegment } from "@/hooks/useSegment";
import { EMAIL_TEMPLATES } from "@/lib/email-templates";
import {
  CAMPAIGN_TYPE_LABEL,
  EMPTY_SEGMENT,
  SOURCE_LABEL,
  type Campaign,
  type CampaignContent,
  type CampaignPayload,
  type CampaignType,
  type CustomerSource,
  type LoyaltyTierFilter,
  type RecencyFilter,
  type SegmentFilters,
} from "@/lib/crm-types";
import { cn } from "@/lib/utils";

const FIELD =
  "bg-bg-2 border border-line rounded-[10px] px-3 py-[9px] text-[13px] text-ink-1 outline-none focus:border-line-2 transition-colors w-full";

const STEPS = [
  { num: 1, label: "Paramètres" },
  { num: 2, label: "Destinataires" },
  { num: 3, label: "Contenu" },
  { num: 4, label: "Envoi" },
];

function emptyPayload(restaurantName: string): CampaignPayload {
  return {
    type: "promotion",
    subject: "",
    senderName: restaurantName,
    replyTo: null,
    content: {
      title: "",
      body: "",
      cta_text: null,
      cta_url: null,
      image_url: null,
    },
    templateId: null,
    segment: EMPTY_SEGMENT,
    status: "draft",
    scheduledAt: null,
  };
}

function fromCampaign(c: Campaign): CampaignPayload {
  return {
    type: c.type,
    subject: c.subject,
    senderName: c.senderName,
    replyTo: c.replyTo,
    content: c.content,
    templateId: c.templateId,
    segment: c.segment,
    status: c.status,
    scheduledAt: c.scheduledAt,
  };
}

export function CampaignDrawer({
  open,
  onClose,
  editing,
  onSave,
  onSend,
}: {
  open: boolean;
  onClose: () => void;
  editing: Campaign | null;
  onSave: (payload: CampaignPayload) => Promise<Campaign | null>;
  onSend: (
    campaign: Campaign,
    recipients: { customerId: string | null; email: string }[]
  ) => Promise<{ ok: boolean; sent: number; failed: number; total: number } | null>;
}) {
  const { restaurant } = useAuth();
  const restaurantName = restaurant?.name ?? "";

  const [step, setStep] = useState(1);
  const [payload, setPayload] = useState<CampaignPayload>(
    emptyPayload(restaurantName)
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { matched, count: segmentCount, total } = useSegment(payload.segment);

  useEffect(() => {
    if (open) {
      setPayload(editing ? fromCampaign(editing) : emptyPayload(restaurantName));
      setStep(1);
      setError(null);
    }
  }, [open, editing, restaurantName]);

  const update = <K extends keyof CampaignPayload>(
    key: K,
    value: CampaignPayload[K]
  ) => setPayload((p) => ({ ...p, [key]: value }));

  const updateContent = <K extends keyof CampaignContent>(
    key: K,
    value: CampaignContent[K]
  ) => setPayload((p) => ({ ...p, content: { ...p.content, [key]: value } }));

  const updateSegment = <K extends keyof SegmentFilters>(
    key: K,
    value: SegmentFilters[K]
  ) => setPayload((p) => ({ ...p, segment: { ...p.segment, [key]: value } }));

  const canNext = useMemo(() => {
    if (step === 1) return payload.subject.trim().length > 0;
    if (step === 2) return segmentCount > 0;
    if (step === 3)
      return (
        payload.content.title.trim().length > 0 &&
        payload.content.body.trim().length > 0
      );
    return true;
  }, [step, payload, segmentCount]);

  const saveDraft = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const saved = await onSave({ ...payload, status: "draft" });
      if (saved) onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec.");
    } finally {
      setSubmitting(false);
    }
  };

  const sendNow = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const saved = await onSave({ ...payload, status: "scheduled" });
      if (!saved) throw new Error("Sauvegarde impossible.");
      const recipients = matched
        .filter((c) => c.email)
        .map((c) => ({ customerId: c.id, email: c.email as string }));
      const result = await onSend(saved, recipients);
      if (!result) throw new Error("Envoi impossible.");
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de l'envoi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={580}
      title={editing ? "Modifier la campagne" : "Nouvelle campagne"}
      subtitle={`Étape ${step} / 4 · ${STEPS[step - 1].label}`}
      footer={
        <div className="flex justify-between gap-2">
          {step > 1 ? (
            <button
              className="btn-ghost inline-flex items-center gap-1"
              onClick={() => setStep((s) => s - 1)}
              type="button"
            >
              <ArrowLeft size={13} />
              Retour
            </button>
          ) : (
            <button
              className="btn-ghost"
              onClick={saveDraft}
              type="button"
              disabled={submitting}
            >
              Enregistrer brouillon
            </button>
          )}

          {step < 4 ? (
            <button
              className="btn-primary inline-flex items-center gap-1"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canNext}
              type="button"
            >
              Suivant
              <ArrowRight size={13} />
            </button>
          ) : (
            <button
              className="btn-primary inline-flex items-center gap-1"
              onClick={sendNow}
              disabled={submitting || segmentCount === 0}
              type="button"
            >
              <Send size={13} />
              {submitting ? "Envoi…" : `Envoyer à ${segmentCount}`}
            </button>
          )}
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <Stepper current={step} onChange={setStep} payload={payload} />

        {step === 1 && (
          <Step1
            payload={payload}
            update={update}
            updateContent={updateContent}
          />
        )}
        {step === 2 && (
          <Step2
            payload={payload}
            updateSegment={updateSegment}
            segmentCount={segmentCount}
            total={total}
          />
        )}
        {step === 3 && (
          <Step3
            payload={payload}
            update={update}
            updateContent={updateContent}
          />
        )}
        {step === 4 && (
          <Step4 payload={payload} segmentCount={segmentCount} />
        )}

        {error && <div className="text-[12px] text-danger">{error}</div>}
      </div>
    </Drawer>
  );
}

function Stepper({
  current,
  onChange,
  payload,
}: {
  current: number;
  onChange: (n: number) => void;
  payload: CampaignPayload;
}) {
  const reachable = (n: number): boolean => {
    if (n === 1) return true;
    if (n === 2) return payload.subject.trim().length > 0;
    if (n === 3)
      return (
        payload.subject.trim().length > 0
      );
    if (n === 4)
      return (
        payload.subject.trim().length > 0 &&
        payload.content.title.trim().length > 0 &&
        payload.content.body.trim().length > 0
      );
    return false;
  };
  return (
    <div className="flex items-center gap-1">
      {STEPS.map((s, i) => {
        const active = current === s.num;
        const done = current > s.num;
        const can = reachable(s.num);
        return (
          <button
            key={s.num}
            type="button"
            onClick={() => can && onChange(s.num)}
            disabled={!can}
            className={cn(
              "flex-1 flex items-center gap-2 px-2 py-[7px] rounded-[8px] text-[11px] font-medium transition-colors",
              active && "bg-ember/15 text-ember-soft",
              done && "text-ink-2",
              !active && !done && "text-ink-4",
              !can && "opacity-50"
            )}
          >
            <span
              className={cn(
                "inline-grid place-items-center w-[18px] h-[18px] rounded-full text-[10px] font-semibold flex-shrink-0",
                active
                  ? "bg-ember text-[#1b0d04]"
                  : done
                    ? "bg-ok/20 text-ok"
                    : "bg-bg-3 text-ink-4"
              )}
            >
              {done ? <Check size={10} /> : s.num}
            </span>
            <span className="truncate">{s.label}</span>
            {i < STEPS.length - 1 && (
              <span className="text-ink-4 text-[10px]">›</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// =============================================================
// Step 1 — Paramètres
// =============================================================
function Step1({
  payload,
  update,
  updateContent,
}: {
  payload: CampaignPayload;
  update: <K extends keyof CampaignPayload>(k: K, v: CampaignPayload[K]) => void;
  updateContent: <K extends keyof CampaignContent>(
    k: K,
    v: CampaignContent[K]
  ) => void;
}) {
  return (
    <>
      <Field label="Type de campagne">
        <div className="grid grid-cols-4 gap-1">
          {(Object.keys(CAMPAIGN_TYPE_LABEL) as CampaignType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => update("type", t)}
              className={`px-2 py-[8px] rounded-[8px] text-[11.5px] font-medium border transition-all ${
                payload.type === t
                  ? "bg-ember/15 border-ember text-ember-soft"
                  : "bg-bg-2 border-line text-ink-3 hover:bg-bg-3"
              }`}
            >
              {CAMPAIGN_TYPE_LABEL[t]}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Sujet de l'email">
        <input
          value={payload.subject}
          onChange={(e) => {
            update("subject", e.target.value);
            if (!payload.content.title) updateContent("title", e.target.value);
          }}
          placeholder="Une attention pour vous, {prenom}"
          className={FIELD}
        />
        <p className="text-[10.5px] text-ink-4 mt-1">
          Variables : {"{prenom}"}, {"{nom}"}, {"{nom_restaurant}"}
        </p>
      </Field>

      <Field label="Nom de l'expéditeur">
        <input
          value={payload.senderName ?? ""}
          onChange={(e) => update("senderName", e.target.value || null)}
          placeholder="Maison Sévère"
          className={FIELD}
        />
      </Field>

      <Field label="Adresse de réponse (optionnel)">
        <input
          type="email"
          value={payload.replyTo ?? ""}
          onChange={(e) => update("replyTo", e.target.value || null)}
          placeholder="contact@maisonsevere.fr"
          className={FIELD}
        />
      </Field>
    </>
  );
}

// =============================================================
// Step 2 — Destinataires
// =============================================================
function Step2({
  payload,
  updateSegment,
  segmentCount,
  total,
}: {
  payload: CampaignPayload;
  updateSegment: <K extends keyof SegmentFilters>(
    k: K,
    v: SegmentFilters[K]
  ) => void;
  segmentCount: number;
  total: number;
}) {
  const seg = payload.segment;
  return (
    <>
      <div className="p-4 rounded-[12px] border border-ember/30 bg-ember/5 flex items-center gap-3">
        <Users className="text-ember-soft" size={20} />
        <div>
          <div className="display text-[22px] font-medium leading-tight">
            {segmentCount}
          </div>
          <div className="text-[11px] text-ink-3">
            destinataire(s) sur {total} client(s)
          </div>
        </div>
      </div>

      <Toggle
        label="Uniquement les clients ayant accepté l'emailing"
        checked={seg.optedInOnly}
        onChange={(v) => updateSegment("optedInOnly", v)}
      />

      <Field label="Source">
        <select
          value={seg.source}
          onChange={(e) =>
            updateSegment("source", e.target.value as CustomerSource | "all")
          }
          className={FIELD}
        >
          <option value="all">Toutes les sources</option>
          {(Object.keys(SOURCE_LABEL) as CustomerSource[]).map((s) => (
            <option key={s} value={s}>
              {SOURCE_LABEL[s]}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Palier fidélité">
        <div className="grid grid-cols-4 gap-1">
          {(["any", "bronze", "silver", "gold"] as LoyaltyTierFilter[]).map(
            (t) => (
              <button
                key={t}
                type="button"
                onClick={() => updateSegment("loyaltyTier", t)}
                className={`px-2 py-[7px] rounded-[8px] text-[11.5px] font-medium border transition-all ${
                  seg.loyaltyTier === t
                    ? "bg-ember/15 border-ember text-ember-soft"
                    : "bg-bg-2 border-line text-ink-3 hover:bg-bg-3"
                }`}
              >
                {t === "any"
                  ? "Tous"
                  : t === "bronze"
                    ? "Bronze"
                    : t === "silver"
                      ? "Argent"
                      : "Or"}
              </button>
            )
          )}
        </div>
      </Field>

      <Field label="Récence (dernière visite)">
        <div className="grid grid-cols-5 gap-1">
          {(
            [
              { v: "all", l: "Toutes" },
              { v: "lt30", l: "< 30j" },
              { v: "30to90", l: "30-90j" },
              { v: "gt90", l: "> 90j" },
              { v: "never", l: "Jamais" },
            ] as { v: RecencyFilter; l: string }[]
          ).map((opt) => (
            <button
              key={opt.v}
              type="button"
              onClick={() => updateSegment("recency", opt.v)}
              className={`px-2 py-[7px] rounded-[8px] text-[11px] font-medium border transition-all ${
                seg.recency === opt.v
                  ? "bg-ember/15 border-ember text-ember-soft"
                  : "bg-bg-2 border-line text-ink-3 hover:bg-bg-3"
              }`}
            >
              {opt.l}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Dépense minimum (€)">
        <input
          type="number"
          min={0}
          value={seg.minSpent ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            updateSegment("minSpent", v === "" ? null : Number(v));
          }}
          placeholder="0 = aucun seuil"
          className={FIELD}
        />
      </Field>
    </>
  );
}

// =============================================================
// Step 3 — Contenu
// =============================================================
function Step3({
  payload,
  update,
  updateContent,
}: {
  payload: CampaignPayload;
  update: <K extends keyof CampaignPayload>(k: K, v: CampaignPayload[K]) => void;
  updateContent: <K extends keyof CampaignContent>(
    k: K,
    v: CampaignContent[K]
  ) => void;
}) {
  const [showTemplates, setShowTemplates] = useState(false);
  const filtered = EMAIL_TEMPLATES.filter((t) => t.type === payload.type);
  const templates = filtered.length > 0 ? filtered : EMAIL_TEMPLATES;

  return (
    <>
      <button
        type="button"
        onClick={() => setShowTemplates((v) => !v)}
        className="w-full inline-flex items-center justify-between gap-2 px-3 py-[9px] rounded-[10px] border border-line-2 bg-bg-2 text-[12.5px] text-ink-1 font-medium hover:bg-bg-3 transition-colors"
      >
        <span className="inline-flex items-center gap-2">
          <Sparkles size={13} className="text-ember-soft" />
          Choisir un modèle
        </span>
        <ChevronDown
          size={13}
          className={cn(
            "text-ink-3 transition-transform",
            showTemplates && "rotate-180"
          )}
        />
      </button>

      {showTemplates && (
        <div className="grid grid-cols-1 gap-1 -mt-2">
          {templates.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => {
                update("templateId", tpl.id);
                update("type", tpl.type);
                if (!payload.subject) update("subject", tpl.subject);
                updateContent("title", tpl.content.title);
                updateContent("body", tpl.content.body);
                updateContent("cta_text", tpl.content.cta_text);
                setShowTemplates(false);
              }}
              className="text-left p-3 rounded-[10px] border border-line bg-bg-2 hover:border-ember/50 hover:bg-ember/5 transition-all"
            >
              <div className="text-[12.5px] font-semibold text-ink-1">
                {tpl.name}
              </div>
              <div className="text-[11px] text-ink-3 mt-[2px]">
                {tpl.description}
              </div>
            </button>
          ))}
        </div>
      )}

      <Field label="Titre principal">
        <input
          value={payload.content.title}
          onChange={(e) => updateContent("title", e.target.value)}
          placeholder="Une attention pour vous, {prenom}"
          className={FIELD}
        />
      </Field>

      <Field label="Corps du message">
        <textarea
          value={payload.content.body}
          onChange={(e) => updateContent("body", e.target.value)}
          rows={8}
          placeholder="Bonjour {prenom},&#10;&#10;…"
          className={`${FIELD} resize-none`}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Texte du bouton (optionnel)">
          <input
            value={payload.content.cta_text ?? ""}
            onChange={(e) => updateContent("cta_text", e.target.value || null)}
            placeholder="Réserver"
            className={FIELD}
          />
        </Field>
        <Field label="Lien du bouton">
          <input
            type="url"
            value={payload.content.cta_url ?? ""}
            onChange={(e) => updateContent("cta_url", e.target.value || null)}
            placeholder="https://…"
            className={FIELD}
          />
        </Field>
      </div>

      <Field label="Image d'en-tête (URL, optionnel)">
        <input
          type="url"
          value={payload.content.image_url ?? ""}
          onChange={(e) => updateContent("image_url", e.target.value || null)}
          placeholder="https://…"
          className={FIELD}
        />
      </Field>

      <p className="text-[10.5px] text-ink-4 leading-relaxed">
        Variables disponibles : {"{prenom}"}, {"{nom}"}, {"{nom_restaurant}"},{" "}
        {"{points}"}, {"{niveau}"}.
      </p>
    </>
  );
}

// =============================================================
// Step 4 — Envoi
// =============================================================
function Step4({
  payload,
  segmentCount,
}: {
  payload: CampaignPayload;
  segmentCount: number;
}) {
  const [showPreview, setShowPreview] = useState(false);
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <Summary label="Type" value={CAMPAIGN_TYPE_LABEL[payload.type]} />
        <Summary label="Destinataires" value={`${segmentCount}`} />
        <Summary
          label="Expéditeur"
          value={payload.senderName ?? "—"}
        />
        <Summary
          label="Réponse à"
          value={payload.replyTo ?? "—"}
        />
      </div>

      <div className="p-3 rounded-[10px] border border-line bg-bg-2">
        <div className="chip-uppercase mb-1">Sujet</div>
        <div className="text-[13px] font-semibold text-ink-1">
          {payload.subject || <span className="text-ink-4">Pas de sujet</span>}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowPreview((v) => !v)}
        className="btn-ghost w-full inline-flex items-center justify-center gap-2"
      >
        <Eye size={13} />
        {showPreview ? "Masquer l'aperçu" : "Aperçu de l'email"}
      </button>

      {showPreview && (
        <div className="rounded-[12px] border border-line overflow-hidden bg-white">
          {payload.content.image_url && (
            <img
              src={payload.content.image_url}
              alt=""
              className="w-full h-auto block"
            />
          )}
          <div className="p-5">
            <h2 className="text-[20px] font-semibold text-[#100d0a] mb-3 leading-tight">
              {payload.content.title || "—"}
            </h2>
            <div className="text-[14px] text-[#3a3530] whitespace-pre-wrap leading-relaxed">
              {payload.content.body || "—"}
            </div>
            {payload.content.cta_text && (
              <div className="mt-5">
                <span className="inline-block px-5 py-[10px] bg-[#e8733a] text-white rounded-[8px] text-[13px] font-semibold">
                  {payload.content.cta_text}
                </span>
              </div>
            )}
          </div>
          <div className="px-5 py-3 border-t border-[#ece5da] text-[10.5px] text-[#8b8278]">
            Vous recevez cet email car vous êtes client. Se désinscrire.
          </div>
        </div>
      )}

      <div className="text-[10.5px] text-ink-4 leading-relaxed bg-bg-2 border border-line rounded-[10px] p-3">
        <strong className="text-ink-3">RGPD :</strong> chaque email inclura
        automatiquement une mention de désinscription. L'envoi est tracé pour
        permettre l'export et la suppression sur demande.
      </div>
    </>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-bg-2 rounded-[10px] border border-line">
      <div className="chip-uppercase">{label}</div>
      <div className="text-[12.5px] font-semibold text-ink-1 mt-1 truncate">
        {value}
      </div>
    </div>
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
    <label className="flex items-center justify-between gap-3 cursor-pointer p-3 bg-bg-2 border border-line rounded-[10px]">
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
