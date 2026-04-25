import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Coins,
  Eye,
  EyeOff,
  Gift,
  Save,
  Sparkles,
  Tag,
} from "lucide-react";
import { Drawer } from "@/components/ui/drawer";
import { useMenu } from "@/hooks/useMenu";
import {
  DAYS,
  EVENT_PALETTE,
  EVENT_TYPE_HINT,
  EVENT_TYPE_LABEL,
  hasOverlap,
  type EventAppliesTo,
  type EventDiscountType,
  type EventPayload,
  type EventType,
  type RestaurantEvent,
} from "@/lib/event-types";
import { EventBadge } from "./EventBadge";
import { cn } from "@/lib/utils";

const FIELD =
  "bg-bg-2 border border-line rounded-[10px] px-3 py-[9px] text-[13px] text-ink-1 outline-none focus:border-line-2 transition-colors";

const STEPS = [
  { num: 1, label: "Informations" },
  { num: 2, label: "Conditions" },
  { num: 3, label: "Planification" },
  { num: 4, label: "Visibilité" },
];

const TYPE_OPTIONS: { value: EventType; icon: typeof Tag }[] = [
  { value: "reduction", icon: Tag },
  { value: "happy_hour", icon: Clock },
  { value: "menu_special", icon: Sparkles },
  { value: "double_points", icon: Coins },
  { value: "offre_libre", icon: Gift },
];

function emptyPayload(): EventPayload {
  return {
    title: "",
    description: null,
    type: "reduction",
    discountType: "percent",
    discountValue: 20,
    loyaltyBonus: null,
    appliesTo: "all",
    appliesToId: null,
    daysOfWeek: [],
    startDate: null,
    endDate: null,
    startTime: null,
    endTime: null,
    displayOnCarte: true,
    color: EVENT_PALETTE[0].value,
    active: true,
  };
}

function fromEvent(ev: RestaurantEvent): EventPayload {
  return {
    title: ev.title,
    description: ev.description,
    type: ev.type,
    discountType: ev.discountType,
    discountValue: ev.discountValue,
    loyaltyBonus: ev.loyaltyBonus,
    appliesTo: ev.appliesTo,
    appliesToId: ev.appliesToId,
    daysOfWeek: ev.daysOfWeek,
    startDate: ev.startDate,
    endDate: ev.endDate,
    startTime: ev.startTime,
    endTime: ev.endTime,
    displayOnCarte: ev.displayOnCarte,
    color: ev.color,
    active: ev.active,
  };
}

export function EventDrawer({
  open,
  onClose,
  event,
  initial,
  existingEvents,
  onCreate,
  onUpdate,
}: {
  open: boolean;
  onClose: () => void;
  event: RestaurantEvent | null;
  initial?: EventPayload | null;
  existingEvents: RestaurantEvent[];
  onCreate: (payload: EventPayload) => Promise<RestaurantEvent | null>;
  onUpdate: (id: string, payload: EventPayload) => Promise<void>;
}) {
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<EventPayload>(emptyPayload());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setError(null);
    setSubmitting(false);
    if (event) setDraft(fromEvent(event));
    else if (initial) setDraft(initial);
    else setDraft(emptyPayload());
  }, [open, event, initial]);

  const set = <K extends keyof EventPayload>(key: K, value: EventPayload[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  // Quand le type change, on remet à zéro les champs non-pertinents.
  const onTypeChange = (next: EventType) => {
    setDraft((prev) => ({
      ...prev,
      type: next,
      discountType: next === "reduction" ? prev.discountType ?? "percent" : next === "happy_hour" || next === "menu_special" ? "percent" : null,
      discountValue:
        next === "reduction"
          ? prev.discountValue ?? 20
          : next === "happy_hour"
          ? 30
          : next === "menu_special"
          ? 15
          : null,
      loyaltyBonus: next === "double_points" ? prev.loyaltyBonus ?? 2 : null,
      appliesTo: next === "reduction" ? prev.appliesTo : "all",
      appliesToId: next === "reduction" ? prev.appliesToId : null,
    }));
  };

  const validateStep = (s: number): string | null => {
    if (s === 1) {
      if (!draft.title.trim()) return "Le titre est requis.";
    }
    if (s === 2) {
      if (draft.type === "reduction") {
        if (draft.discountValue === null || draft.discountValue <= 0)
          return "Indiquez une valeur de remise.";
        if (draft.appliesTo !== "all" && !draft.appliesToId)
          return "Choisissez la catégorie ou le plat ciblé.";
      }
      if (draft.type === "happy_hour") {
        if (draft.discountValue === null || draft.discountValue <= 0)
          return "Indiquez le pourcentage.";
        if (!draft.startTime || !draft.endTime)
          return "Indiquez le créneau horaire.";
      }
      if (draft.type === "menu_special") {
        if (draft.discountValue === null || draft.discountValue <= 0)
          return "Indiquez le prix du menu.";
      }
      if (draft.type === "double_points") {
        if (!draft.loyaltyBonus || draft.loyaltyBonus < 1.5)
          return "Choisissez un multiplicateur.";
      }
      if (draft.type === "offre_libre") {
        if (!draft.description || !draft.description.trim())
          return "Décrivez l'offre libre.";
      }
    }
    if (s === 3) {
      const hasRecurrence = draft.daysOfWeek.length > 0;
      const hasDates = draft.startDate || draft.endDate;
      if (!hasRecurrence && !hasDates)
        return "Choisissez au moins un jour de la semaine ou une date.";
      if (draft.startDate && draft.endDate && draft.endDate < draft.startDate)
        return "La date de fin doit être après la date de début.";
    }
    return null;
  };

  const goNext = () => {
    const err = validateStep(step);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    if (step < 4) setStep(step + 1);
  };

  const goPrev = () => {
    setError(null);
    if (step > 1) setStep(step - 1);
  };

  const submit = async () => {
    for (let s = 1; s <= 4; s++) {
      const err = validateStep(s);
      if (err) {
        setError(err);
        setStep(s);
        return;
      }
    }
    setSubmitting(true);
    try {
      if (event) await onUpdate(event.id, draft);
      else await onCreate(draft);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec.");
    } finally {
      setSubmitting(false);
    }
  };

  const overlaps = useMemo(() => {
    if (!draft.title.trim()) return [];
    const synthetic: RestaurantEvent = {
      id: event?.id ?? "draft",
      restaurantId: event?.restaurantId ?? "",
      createdAt: "",
      ...draft,
    };
    return existingEvents
      .filter((ev) => ev.id !== event?.id && ev.active)
      .filter((ev) => hasOverlap(ev, synthetic));
  }, [draft, existingEvents, event]);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={520}
      title={event ? "Éditer l'événement" : "Nouvel événement"}
      subtitle={`Étape ${step} sur 4 · ${STEPS[step - 1].label}`}
      footer={
        <div className="flex items-center justify-between gap-2">
          <button
            className="btn-ghost inline-flex items-center gap-1"
            onClick={goPrev}
            disabled={step === 1}
            type="button"
          >
            <ArrowLeft size={13} />
            Précédent
          </button>
          <div className="flex items-center gap-2">
            {step < 4 ? (
              <button
                className="btn-primary inline-flex items-center gap-1"
                onClick={goNext}
                type="button"
              >
                Suivant
                <ArrowRight size={13} />
              </button>
            ) : (
              <button
                className="btn-primary inline-flex items-center gap-2"
                onClick={() => void submit()}
                disabled={submitting}
                type="button"
              >
                <Save size={13} />
                {submitting ? "Enregistrement…" : event ? "Enregistrer" : "Créer"}
              </button>
            )}
          </div>
        </div>
      }
    >
      {/* Stepper */}
      <Stepper step={step} onJump={(s) => setStep(s)} />

      {error && (
        <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-[10px] bg-danger/10 border border-danger/30 text-danger text-[12px]">
          <AlertTriangle size={13} />
          <span>{error}</span>
        </div>
      )}

      <div className="mt-5">
        {step === 1 && (
          <Step1
            draft={draft}
            onTitle={(v) => set("title", v)}
            onDescription={(v) => set("description", v)}
            onType={onTypeChange}
            onColor={(v) => set("color", v)}
          />
        )}
        {step === 2 && (
          <Step2
            draft={draft}
            onDiscountType={(v) => set("discountType", v)}
            onDiscountValue={(v) => set("discountValue", v)}
            onLoyaltyBonus={(v) => set("loyaltyBonus", v)}
            onAppliesTo={(v) => set("appliesTo", v)}
            onAppliesToId={(v) => set("appliesToId", v)}
            onStartTime={(v) => set("startTime", v)}
            onEndTime={(v) => set("endTime", v)}
            onDescription={(v) => set("description", v)}
          />
        )}
        {step === 3 && (
          <Step3
            draft={draft}
            onDaysOfWeek={(v) => set("daysOfWeek", v)}
            onStartDate={(v) => set("startDate", v)}
            onEndDate={(v) => set("endDate", v)}
            onStartTime={(v) => set("startTime", v)}
            onEndTime={(v) => set("endTime", v)}
            overlaps={overlaps}
          />
        )}
        {step === 4 && (
          <Step4
            draft={draft}
            onDisplay={(v) => set("displayOnCarte", v)}
            onActive={(v) => set("active", v)}
          />
        )}
      </div>
    </Drawer>
  );
}

function Stepper({ step, onJump }: { step: number; onJump: (s: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {STEPS.map((s, i) => {
        const reached = step >= s.num;
        const current = step === s.num;
        return (
          <button
            key={s.num}
            type="button"
            onClick={() => onJump(s.num)}
            className="flex items-center gap-2 group flex-1 min-w-0"
          >
            <span
              className={cn(
                "inline-grid place-items-center w-[22px] h-[22px] rounded-full text-[10.5px] font-bold transition-colors flex-shrink-0",
                current
                  ? "bg-ember text-[#1b0d04]"
                  : reached
                  ? "bg-ember/20 text-ember-soft"
                  : "bg-bg-3 text-ink-4 border border-line"
              )}
            >
              {reached && !current ? <Check size={11} /> : s.num}
            </span>
            <span
              className={cn(
                "text-[11px] font-semibold uppercase tracking-[0.06em] truncate transition-colors",
                current
                  ? "text-ink-1"
                  : reached
                  ? "text-ink-2"
                  : "text-ink-4"
              )}
            >
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <span
                className={cn(
                  "flex-1 h-[1px] mx-1 transition-colors",
                  reached ? "bg-ember/40" : "bg-line"
                )}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

// =============================================================
// Étape 1 — Informations
// =============================================================
function Step1({
  draft,
  onTitle,
  onDescription,
  onType,
  onColor,
}: {
  draft: EventPayload;
  onTitle: (v: string) => void;
  onDescription: (v: string | null) => void;
  onType: (v: EventType) => void;
  onColor: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <Field label="Titre">
        <input
          autoFocus
          value={draft.title}
          onChange={(e) => onTitle(e.target.value)}
          placeholder="Ex. Mercredi à -50%"
          className={FIELD}
        />
      </Field>

      <Field label="Description (affichée sur la carte)">
        <textarea
          value={draft.description ?? ""}
          onChange={(e) => onDescription(e.target.value || null)}
          rows={2}
          placeholder="Quelques mots qui donnent envie aux clients…"
          className={FIELD + " resize-none"}
        />
      </Field>

      <Field label="Type d'événement">
        <div className="grid grid-cols-1 gap-2">
          {TYPE_OPTIONS.map(({ value, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => onType(value)}
              className={cn(
                "flex items-start gap-3 p-3 rounded-[10px] border transition-all text-left",
                draft.type === value
                  ? "border-ember bg-ember/10"
                  : "border-line bg-bg-2 hover:border-line-2"
              )}
            >
              <span
                className={cn(
                  "inline-grid place-items-center w-[28px] h-[28px] rounded-md flex-shrink-0",
                  draft.type === value
                    ? "bg-ember/20 text-ember-soft"
                    : "bg-bg-3 text-ink-3"
                )}
              >
                <Icon size={14} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold leading-tight">
                  {EVENT_TYPE_LABEL[value]}
                </div>
                <div className="text-[11px] text-ink-3 mt-[2px] leading-snug">
                  {EVENT_TYPE_HINT[value]}
                </div>
              </div>
              {draft.type === value && (
                <Check size={14} className="text-ember-soft flex-shrink-0 mt-[2px]" />
              )}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Couleur du badge">
        <div className="flex items-center gap-2 flex-wrap">
          {EVENT_PALETTE.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => onColor(c.value)}
              className={cn(
                "w-[28px] h-[28px] rounded-full transition-all border-2",
                draft.color === c.value
                  ? "border-cream scale-110"
                  : "border-transparent hover:scale-105"
              )}
              style={{ background: c.value }}
              title={c.name}
            />
          ))}
        </div>
      </Field>
    </div>
  );
}

// =============================================================
// Étape 2 — Conditions (selon type)
// =============================================================
function Step2({
  draft,
  onDiscountType,
  onDiscountValue,
  onLoyaltyBonus,
  onAppliesTo,
  onAppliesToId,
  onStartTime,
  onEndTime,
  onDescription,
}: {
  draft: EventPayload;
  onDiscountType: (v: EventDiscountType) => void;
  onDiscountValue: (v: number | null) => void;
  onLoyaltyBonus: (v: number | null) => void;
  onAppliesTo: (v: EventAppliesTo) => void;
  onAppliesToId: (v: string | null) => void;
  onStartTime: (v: string | null) => void;
  onEndTime: (v: string | null) => void;
  onDescription: (v: string | null) => void;
}) {
  const { categories, items } = useMenu();

  if (draft.type === "reduction") {
    return (
      <div className="flex flex-col gap-4">
        <Field label="Type de remise">
          <div className="segmented w-fit">
            <button
              type="button"
              className={cn(draft.discountType === "percent" && "active")}
              onClick={() => onDiscountType("percent")}
            >
              Pourcentage
            </button>
            <button
              type="button"
              className={cn(draft.discountType === "amount" && "active")}
              onClick={() => onDiscountType("amount")}
            >
              Montant fixe
            </button>
          </div>
        </Field>

        <Field
          label={draft.discountType === "percent" ? "Pourcentage de remise" : "Montant de la remise"}
        >
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              step={draft.discountType === "percent" ? 5 : 1}
              value={draft.discountValue ?? 0}
              onChange={(e) => onDiscountValue(Number(e.target.value) || 0)}
              className={FIELD + " w-[140px]"}
            />
            <span className="text-[14px] text-ink-2 font-semibold">
              {draft.discountType === "percent" ? "%" : "€"}
            </span>
          </div>
        </Field>

        <Field label="S'applique à">
          <div className="segmented w-fit mb-3">
            <button
              type="button"
              className={cn(draft.appliesTo === "all" && "active")}
              onClick={() => {
                onAppliesTo("all");
                onAppliesToId(null);
              }}
            >
              Toute l'addition
            </button>
            <button
              type="button"
              className={cn(draft.appliesTo === "category" && "active")}
              onClick={() => {
                onAppliesTo("category");
                onAppliesToId(null);
              }}
            >
              Une catégorie
            </button>
            <button
              type="button"
              className={cn(draft.appliesTo === "item" && "active")}
              onClick={() => {
                onAppliesTo("item");
                onAppliesToId(null);
              }}
            >
              Un plat
            </button>
          </div>

          {draft.appliesTo === "category" && (
            <select
              value={draft.appliesToId ?? ""}
              onChange={(e) => onAppliesToId(e.target.value || null)}
              className={FIELD + " w-full"}
            >
              <option value="">Choisir une catégorie…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}

          {draft.appliesTo === "item" && (
            <select
              value={draft.appliesToId ?? ""}
              onChange={(e) => onAppliesToId(e.target.value || null)}
              className={FIELD + " w-full"}
            >
              <option value="">Choisir un plat…</option>
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} · {i.price.toFixed(2)}€
                </option>
              ))}
            </select>
          )}
        </Field>
      </div>
    );
  }

  if (draft.type === "happy_hour") {
    return (
      <div className="flex flex-col gap-4">
        <Field label="Pourcentage de remise sur les boissons">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={5}
              max={100}
              step={5}
              value={draft.discountValue ?? 30}
              onChange={(e) => onDiscountValue(Number(e.target.value) || 0)}
              className={FIELD + " w-[140px]"}
            />
            <span className="text-[14px] text-ink-2 font-semibold">%</span>
          </div>
        </Field>

        <Field label="Créneau horaire">
          <div className="flex items-center gap-3">
            <input
              type="time"
              value={draft.startTime ?? ""}
              onChange={(e) => onStartTime(e.target.value || null)}
              className={FIELD + " w-[140px]"}
            />
            <span className="text-[12px] text-ink-3">à</span>
            <input
              type="time"
              value={draft.endTime ?? ""}
              onChange={(e) => onEndTime(e.target.value || null)}
              className={FIELD + " w-[140px]"}
            />
          </div>
        </Field>
      </div>
    );
  }

  if (draft.type === "menu_special") {
    return (
      <div className="flex flex-col gap-4">
        <Field label="Prix du menu">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              step={1}
              value={draft.discountValue ?? 0}
              onChange={(e) => onDiscountValue(Number(e.target.value) || 0)}
              className={FIELD + " w-[140px]"}
            />
            <span className="text-[14px] text-ink-2 font-semibold">€</span>
          </div>
        </Field>

        <Field label="Description du menu">
          <textarea
            value={draft.description ?? ""}
            onChange={(e) => onDescription(e.target.value || null)}
            rows={4}
            placeholder="Entrée du jour&#10;Plat du jour&#10;Dessert maison"
            className={FIELD + " resize-none"}
          />
        </Field>
      </div>
    );
  }

  if (draft.type === "double_points") {
    const options = [1.5, 2, 3, 5];
    return (
      <div className="flex flex-col gap-4">
        <div className="px-3 py-2 rounded-[10px] bg-ember/10 border border-ember/30 text-[11.5px] text-ember-soft inline-flex items-center gap-2">
          <Coins size={13} />
          Bonus appliqué automatiquement aux clients fidélité.
        </div>

        <Field label="Multiplicateur de points">
          <div className="grid grid-cols-4 gap-2">
            {options.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => onLoyaltyBonus(m)}
                className={cn(
                  "px-3 py-3 rounded-[10px] border transition-all font-semibold text-[14px]",
                  draft.loyaltyBonus === m
                    ? "border-ember bg-ember/15 text-ember-soft"
                    : "border-line bg-bg-2 text-ink-2 hover:border-line-2"
                )}
              >
                ×{m}
              </button>
            ))}
          </div>
        </Field>
      </div>
    );
  }

  // offre_libre
  return (
    <div className="flex flex-col gap-4">
      <Field label="Texte de l'offre">
        <textarea
          value={draft.description ?? ""}
          onChange={(e) => onDescription(e.target.value.slice(0, 200) || null)}
          rows={5}
          maxLength={200}
          placeholder="Ex. Pain offert à table, ou un kir maison à l'apéritif"
          className={FIELD + " resize-none"}
        />
        <div className="text-[10.5px] text-ink-4 mono mt-1 text-right">
          {(draft.description ?? "").length} / 200
        </div>
      </Field>
    </div>
  );
}

// =============================================================
// Étape 3 — Planification
// =============================================================
function Step3({
  draft,
  onDaysOfWeek,
  onStartDate,
  onEndDate,
  onStartTime,
  onEndTime,
  overlaps,
}: {
  draft: EventPayload;
  onDaysOfWeek: (v: number[]) => void;
  onStartDate: (v: string | null) => void;
  onEndDate: (v: string | null) => void;
  onStartTime: (v: string | null) => void;
  onEndTime: (v: string | null) => void;
  overlaps: RestaurantEvent[];
}) {
  const isRecurrent = draft.daysOfWeek.length > 0;
  const [mode, setMode] = useState<"recurrent" | "ponctuel">(
    isRecurrent || (!draft.startDate && !draft.endDate) ? "recurrent" : "ponctuel"
  );

  const toggleDay = (n: number) => {
    if (draft.daysOfWeek.includes(n)) {
      onDaysOfWeek(draft.daysOfWeek.filter((d) => d !== n));
    } else {
      onDaysOfWeek([...draft.daysOfWeek, n].sort((a, b) => a - b));
    }
  };

  const switchMode = (m: "recurrent" | "ponctuel") => {
    setMode(m);
    if (m === "recurrent") {
      onStartDate(null);
      onEndDate(null);
    } else {
      onDaysOfWeek([]);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Field label="Type d'événement">
        <div className="segmented w-fit">
          <button
            type="button"
            className={cn(mode === "recurrent" && "active")}
            onClick={() => switchMode("recurrent")}
          >
            Récurrent
          </button>
          <button
            type="button"
            className={cn(mode === "ponctuel" && "active")}
            onClick={() => switchMode("ponctuel")}
          >
            Ponctuel
          </button>
        </div>
      </Field>

      {mode === "recurrent" ? (
        <>
          <Field label="Jours de la semaine">
            <div className="grid grid-cols-7 gap-2">
              {DAYS.map((d) => (
                <button
                  key={d.num}
                  type="button"
                  onClick={() => toggleDay(d.num)}
                  className={cn(
                    "py-2 rounded-[8px] border text-[12px] font-semibold transition-all",
                    draft.daysOfWeek.includes(d.num)
                      ? "border-ember bg-ember/15 text-ember-soft"
                      : "border-line bg-bg-2 text-ink-3 hover:border-line-2"
                  )}
                >
                  {d.short}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Date de fin (optionnelle)">
            <input
              type="date"
              value={draft.endDate ?? ""}
              onChange={(e) => onEndDate(e.target.value || null)}
              className={FIELD + " w-[200px]"}
            />
            <div className="text-[10.5px] text-ink-4 mt-1">
              Sans date de fin, l'événement reste actif jusqu'à désactivation manuelle.
            </div>
          </Field>
        </>
      ) : (
        <Field label="Période">
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={draft.startDate ?? ""}
              onChange={(e) => onStartDate(e.target.value || null)}
              className={FIELD + " w-[180px]"}
            />
            <span className="text-[12px] text-ink-3">à</span>
            <input
              type="date"
              value={draft.endDate ?? ""}
              onChange={(e) => onEndDate(e.target.value || null)}
              className={FIELD + " w-[180px]"}
            />
          </div>
        </Field>
      )}

      <Field label="Horaires (optionnels)">
        <div className="flex items-center gap-3">
          <input
            type="time"
            value={draft.startTime ?? ""}
            onChange={(e) => onStartTime(e.target.value || null)}
            className={FIELD + " w-[140px]"}
          />
          <span className="text-[12px] text-ink-3">à</span>
          <input
            type="time"
            value={draft.endTime ?? ""}
            onChange={(e) => onEndTime(e.target.value || null)}
            className={FIELD + " w-[140px]"}
          />
        </div>
        <div className="text-[10.5px] text-ink-4 mt-1">
          Laissez vide pour appliquer toute la journée.
        </div>
      </Field>

      {overlaps.length > 0 && (
        <div className="px-3 py-2 rounded-[10px] bg-amber/10 border border-amber/30 text-[11.5px] text-amber flex gap-2">
          <AlertTriangle size={14} className="flex-shrink-0 mt-[1px]" />
          <div>
            <div className="font-semibold mb-1">
              Chevauchement avec {overlaps.length} événement{overlaps.length > 1 ? "s" : ""} actif{overlaps.length > 1 ? "s" : ""}
            </div>
            <ul className="space-y-1">
              {overlaps.map((ev) => (
                <li key={ev.id} className="text-ink-2">
                  · {ev.title}
                </li>
              ))}
            </ul>
            <div className="text-ink-3 mt-1">Vous pouvez tout de même créer cet événement.</div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================
// Étape 4 — Visibilité
// =============================================================
function Step4({
  draft,
  onDisplay,
  onActive,
}: {
  draft: EventPayload;
  onDisplay: (v: boolean) => void;
  onActive: (v: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <ToggleRow
        label="Afficher sur la carte digitale"
        hint="Les clients verront le badge sur le menu numérique."
        active={draft.displayOnCarte}
        onChange={onDisplay}
        icon={draft.displayOnCarte ? Eye : EyeOff}
      />

      <ToggleRow
        label="Activer immédiatement"
        hint="Désactivez pour préparer en brouillon."
        active={draft.active}
        onChange={onActive}
        icon={Check}
      />

      <div className="mt-3 p-4 rounded-[12px] border border-line-2 bg-gradient-to-br from-bg-2 to-bg-1">
        <div className="chip-uppercase mb-3">Aperçu du badge</div>
        <EventBadge
          event={{
            title: draft.title || "Titre de l'événement",
            description: draft.description,
            type: draft.type,
            color: draft.color,
            discountType: draft.discountType,
            discountValue: draft.discountValue,
            loyaltyBonus: draft.loyaltyBonus,
            appliesTo: draft.appliesTo,
            startTime: draft.startTime,
            endTime: draft.endTime,
          }}
          size="lg"
          showSummary
        />
        {draft.description && (
          <div className="text-[12px] text-ink-3 mt-3 leading-snug">
            {draft.description}
          </div>
        )}
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  hint,
  active,
  onChange,
  icon: Icon,
}: {
  label: string;
  hint: string;
  active: boolean;
  onChange: (v: boolean) => void;
  icon: typeof Check;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-[10px] border transition-all cursor-pointer",
        active ? "border-ember bg-ember/8" : "border-line bg-bg-2 hover:border-line-2"
      )}
      onClick={() => onChange(!active)}
    >
      <span
        className={cn(
          "inline-grid place-items-center w-[32px] h-[32px] rounded-md flex-shrink-0",
          active ? "bg-ember/20 text-ember-soft" : "bg-bg-3 text-ink-3"
        )}
      >
        <Icon size={15} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold leading-tight">{label}</div>
        <div className="text-[11px] text-ink-3 mt-1">{hint}</div>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onChange(!active);
        }}
        className={cn(
          "relative w-[32px] h-[18px] rounded-full transition-colors flex-shrink-0 mt-1",
          active ? "bg-ember" : "bg-bg-3 border border-line"
        )}
      >
        <span
          className={cn(
            "absolute top-[2px] w-[12px] h-[12px] rounded-full bg-cream transition-all",
            active ? "left-[18px]" : "left-[2px]"
          )}
        />
      </button>
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
