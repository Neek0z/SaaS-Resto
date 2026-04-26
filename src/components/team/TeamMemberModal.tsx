import { useEffect, useMemo, useState } from "react";
import { Trash2, UserPlus, UserCheck } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import {
  KIND_LABEL,
  STATUS_LABEL,
  TEAM_KINDS,
  TEAM_STATUSES,
  avatarFromName,
  buildHoursLabel,
  type NewTeamMember,
  type ResolvedTeamMember,
  type ShiftInput,
  type TeamMember,
  type TeamMemberKind,
  type TeamMemberPatch,
  type TeamMemberStatus,
} from "@/lib/team-types";
import { cn } from "@/lib/utils";

const TIME_RE = /^([0-9]{1,2}):([0-5][0-9])$/;

function timeToHour(t: string): number | null {
  const m = TIME_RE.exec(t.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const mm = Number(m[2]);
  if (h < 0 || h > 27) return null;
  return h + mm / 60;
}

function hourToTime(h: number): string {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function formatDateLabel(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

type Form = {
  name: string;
  role: string;
  kind: TeamMemberKind;
  avatar: string;
  scheduled: boolean;
  status: TeamMemberStatus;
  startStr: string;
  endStr: string;
  hasBreak: boolean;
  breakStartStr: string;
  breakEndStr: string;
};

function emptyForm(): Form {
  return {
    name: "",
    role: "",
    kind: "service",
    avatar: "",
    scheduled: true,
    status: "service",
    startStr: "17:00",
    endStr: "23:00",
    hasBreak: false,
    breakStartStr: "19:00",
    breakEndStr: "19:30",
  };
}

function fromMember(m: ResolvedTeamMember): Form {
  const hasShift = m.shift !== null;
  const start = m.shift?.start ?? m.defaultStart;
  const end = m.shift?.end ?? m.defaultEnd;
  const bs = m.shift?.breakStart ?? m.defaultBreakStart;
  const be = m.shift?.breakEnd ?? m.defaultBreakEnd;
  const status = m.shift?.status ?? m.defaultStatus;
  return {
    name: m.name,
    role: m.role,
    kind: m.kind,
    avatar: m.avatar,
    scheduled: hasShift,
    status,
    startStr: hourToTime(start),
    endStr: hourToTime(end),
    hasBreak: bs !== null && be !== null,
    breakStartStr: bs !== null ? hourToTime(bs) : "19:00",
    breakEndStr: be !== null ? hourToTime(be) : "19:30",
  };
}

export function TeamMemberModal({
  open,
  member,
  date,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
  onUpsertShift,
  onDeleteShift,
}: {
  open: boolean;
  member: ResolvedTeamMember | null;
  date: string;
  onClose: () => void;
  onCreate?: (input: NewTeamMember) => Promise<TeamMember | null>;
  onUpdate?: (id: string, patch: TeamMemberPatch) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onUpsertShift?: (memberId: string, shift: ShiftInput) => Promise<void>;
  onDeleteShift?: (memberId: string) => Promise<void>;
}) {
  const editing = member !== null;
  const [form, setForm] = useState<Form>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(member ? fromMember(member) : emptyForm());
  }, [open, member]);

  const start = useMemo(() => timeToHour(form.startStr), [form.startStr]);
  const end = useMemo(() => timeToHour(form.endStr), [form.endStr]);
  const breakStart = useMemo(() => timeToHour(form.breakStartStr), [form.breakStartStr]);
  const breakEnd = useMemo(() => timeToHour(form.breakEndStr), [form.breakEndStr]);

  const validation = useMemo<string | null>(() => {
    if (!form.name.trim()) return "Le nom est requis.";
    if (!form.role.trim()) return "Le poste est requis.";
    if (form.scheduled) {
      if (start === null) return "Heure de début invalide (HH:MM).";
      if (end === null) return "Heure de fin invalide (HH:MM).";
      if (end <= start) return "La fin doit être après le début.";
      if (form.hasBreak) {
        if (breakStart === null || breakEnd === null)
          return "Heures de pause invalides (HH:MM).";
        if (breakEnd <= breakStart) return "La pause doit avoir une fin après le début.";
        if (breakStart < start || breakEnd > end)
          return "La pause doit être comprise dans le créneau.";
      }
    }
    return null;
  }, [form, start, end, breakStart, breakEnd]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const buildShift = (): ShiftInput => {
    const s = start as number;
    const e = end as number;
    return {
      start: s,
      end: e,
      breakStart: form.hasBreak ? (breakStart as number) : null,
      breakEnd: form.hasBreak ? (breakEnd as number) : null,
      status: form.status,
      hours: buildHoursLabel(s, e),
    };
  };

  const submit = async () => {
    if (validation || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      if (editing && member) {
        const identityPatch: TeamMemberPatch = {
          name: form.name.trim(),
          role: form.role.trim(),
          kind: form.kind,
          avatar: form.avatar.trim() || avatarFromName(form.name),
        };
        if (onUpdate) await onUpdate(member.id, identityPatch);

        if (form.scheduled) {
          if (onUpsertShift) await onUpsertShift(member.id, buildShift());
        } else if (member.shift && onDeleteShift) {
          await onDeleteShift(member.id);
        }
        onClose();
      } else if (onCreate) {
        const baseStart = form.scheduled && start !== null ? start : 17;
        const baseEnd = form.scheduled && end !== null ? end : 23;
        const baseHours = buildHoursLabel(baseStart, baseEnd);
        const input: NewTeamMember = {
          name: form.name.trim(),
          role: form.role.trim(),
          kind: form.kind,
          avatar: form.avatar.trim() || avatarFromName(form.name),
          defaultStart: baseStart,
          defaultEnd: baseEnd,
          defaultBreakStart:
            form.scheduled && form.hasBreak ? (breakStart as number) : null,
          defaultBreakEnd:
            form.scheduled && form.hasBreak ? (breakEnd as number) : null,
          defaultStatus: form.status,
          defaultHours: baseHours,
        };
        const created = await onCreate(input);
        if (!created) {
          setError("Création impossible. Vérifiez vos droits.");
          return;
        }
        if (form.scheduled && onUpsertShift) {
          await onUpsertShift(created.id, buildShift());
        }
        onClose();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editing || !member || !onDelete || submitting) return;
    if (!confirm(`Retirer ${member.name} de l'équipe ?`)) return;
    setSubmitting(true);
    try {
      await onDelete(member.id);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const dateLabel = formatDateLabel(date);

  return (
    <Modal
      open={open}
      onClose={onClose}
      width={600}
      title={editing ? "Modifier le membre" : "Nouveau membre"}
      subtitle={editing ? member?.name : "Ajouter un membre à l'équipe"}
      footer={
        <div className="flex gap-2 justify-between items-center">
          <div>
            {editing && onDelete && (
              <button
                className="btn-ghost inline-flex items-center gap-2 text-danger"
                onClick={handleDelete}
                disabled={submitting}
              >
                <Trash2 size={13} />
                Retirer
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={onClose}>
              Annuler
            </button>
            <button
              className="btn-primary inline-flex items-center gap-2"
              onClick={submit}
              disabled={submitting || validation !== null}
            >
              {editing ? <UserCheck size={13} /> : <UserPlus size={13} />}
              {submitting ? "Enregistrement…" : editing ? "Enregistrer" : "Ajouter"}
            </button>
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <div className="chip-uppercase mb-2">Identité</div>
        </div>

        <div className="col-span-2">
          <label className="chip-uppercase block mb-[6px]">Nom</label>
          <input
            autoFocus
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Léa Moreau"
            className="w-full bg-bg-2 border border-line rounded-[10px] px-3 py-[9px] text-[13px] text-ink-1 outline-none focus:border-line-2 transition-colors"
          />
        </div>

        <div>
          <label className="chip-uppercase block mb-[6px]">Poste</label>
          <input
            value={form.role}
            onChange={(e) => set("role", e.target.value)}
            placeholder="Cheffe de rang"
            className="w-full bg-bg-2 border border-line rounded-[10px] px-3 py-[9px] text-[13px] text-ink-1 outline-none focus:border-line-2 transition-colors"
          />
        </div>

        <div>
          <label className="chip-uppercase block mb-[6px]">Initiales</label>
          <input
            value={form.avatar}
            onChange={(e) => set("avatar", e.target.value.slice(0, 3).toUpperCase())}
            placeholder={avatarFromName(form.name) || "LM"}
            className="w-full bg-bg-2 border border-line rounded-[10px] px-3 py-[9px] text-[13px] text-ink-1 outline-none focus:border-line-2 transition-colors mono"
          />
        </div>

        <div className="col-span-2">
          <label className="chip-uppercase block mb-[6px]">Pôle</label>
          <div className="segmented">
            {TEAM_KINDS.map((k) => (
              <button
                key={k}
                className={cn(form.kind === k && "active")}
                onClick={() => set("kind", k)}
              >
                {KIND_LABEL[k]}
              </button>
            ))}
          </div>
        </div>

        <div className="col-span-2 mt-2 pt-3 border-t border-line">
          <div className="flex items-center justify-between mb-3">
            <div className="chip-uppercase">
              Planifié <span className="capitalize text-ember-soft">{dateLabel}</span>
            </div>
            <label className="flex items-center gap-2 text-[12px] text-ink-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.scheduled}
                onChange={(e) => set("scheduled", e.target.checked)}
              />
              Planifié ce jour
            </label>
          </div>
        </div>

        {form.scheduled && (
          <>
            <div className="col-span-2">
              <label className="chip-uppercase block mb-[6px]">Statut</label>
              <div className="segmented">
                {TEAM_STATUSES.map((s) => (
                  <button
                    key={s}
                    className={cn(form.status === s && "active")}
                    onClick={() => set("status", s)}
                  >
                    {STATUS_LABEL[s]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="chip-uppercase block mb-[6px]">Début</label>
              <input
                type="time"
                value={form.startStr}
                onChange={(e) => set("startStr", e.target.value)}
                className="w-full bg-bg-2 border border-line rounded-[10px] px-3 py-[9px] text-[13px] text-ink-1 outline-none focus:border-line-2 transition-colors mono"
              />
            </div>

            <div>
              <label className="chip-uppercase block mb-[6px]">Fin</label>
              <input
                type="time"
                value={form.endStr}
                onChange={(e) => set("endStr", e.target.value)}
                className="w-full bg-bg-2 border border-line rounded-[10px] px-3 py-[9px] text-[13px] text-ink-1 outline-none focus:border-line-2 transition-colors mono"
              />
            </div>

            <div className="col-span-2">
              <label className="flex items-center gap-2 text-[12.5px] text-ink-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.hasBreak}
                  onChange={(e) => set("hasBreak", e.target.checked)}
                />
                Pause planifiée
              </label>
            </div>

            {form.hasBreak && (
              <>
                <div>
                  <label className="chip-uppercase block mb-[6px]">Pause début</label>
                  <input
                    type="time"
                    value={form.breakStartStr}
                    onChange={(e) => set("breakStartStr", e.target.value)}
                    className="w-full bg-bg-2 border border-line rounded-[10px] px-3 py-[9px] text-[13px] text-ink-1 outline-none focus:border-line-2 transition-colors mono"
                  />
                </div>
                <div>
                  <label className="chip-uppercase block mb-[6px]">Pause fin</label>
                  <input
                    type="time"
                    value={form.breakEndStr}
                    onChange={(e) => set("breakEndStr", e.target.value)}
                    className="w-full bg-bg-2 border border-line rounded-[10px] px-3 py-[9px] text-[13px] text-ink-1 outline-none focus:border-line-2 transition-colors mono"
                  />
                </div>
              </>
            )}
          </>
        )}

        {!form.scheduled && (
          <div className="col-span-2 text-[11.5px] text-ink-3 italic">
            Le membre ne sera pas planifié ce jour. Son shift existant sera supprimé.
          </div>
        )}

        {(validation || error) && (
          <div className="col-span-2 text-[11.5px] text-danger">{error ?? validation}</div>
        )}
      </div>
    </Modal>
  );
}
