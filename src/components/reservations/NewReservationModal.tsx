import { useEffect, useMemo, useState } from "react";
import { CalendarPlus, AlertTriangle } from "lucide-react";
import type { NewReservation, Reservation } from "@/lib/reservation-types";
import type { TableEntry, TableZone } from "@/hooks/useTables";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

const ZONE_LABEL: Record<TableZone, string> = {
  inside: "Salle",
  terrace: "Terrasse",
  bar: "Bar",
  private: "Privée",
};
const ZONE_ORDER: TableZone[] = ["inside", "terrace", "bar", "private"];

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

function overlaps(
  aTime: string,
  aDur: number,
  bTime: string,
  bDur: number
): boolean {
  const aStart = timeToMinutes(aTime);
  const bStart = timeToMinutes(bTime);
  const aEnd = aStart + aDur;
  const bEnd = bStart + bDur;
  return aStart < bEnd && bStart < aEnd;
}

export function NewReservationModal({
  open,
  onClose,
  onCreate,
  defaultDate,
  tables,
  existingReservations,
}: {
  open: boolean;
  onClose: () => void;
  onCreate?: (r: NewReservation) => void | Promise<void>;
  defaultDate?: string;
  tables: TableEntry[];
  existingReservations: Reservation[];
}) {
  const initialDate = defaultDate ?? todayIso();
  const [name, setName] = useState("");
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState("20:00");
  const [covers, setCovers] = useState(2);
  const [table, setTable] = useState<string>("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const sameDateResas = useMemo(
    () => existingReservations.filter((r) => r.date === date),
    [existingReservations, date]
  );

  const occupiedSet = useMemo(() => {
    const set = new Set<string>();
    for (const r of sameDateResas) {
      if (r.status === "noshow") continue;
      if (overlaps(r.time, r.durationMinutes || 90, time, 90)) {
        set.add(r.table);
      }
    }
    return set;
  }, [sameDateResas, time]);

  useEffect(() => {
    if (open) {
      setDate(defaultDate ?? todayIso());
      setTable("");
    }
  }, [open, defaultDate]);

  // Auto-suggestion : prend la première table libre avec capacité suffisante.
  useEffect(() => {
    if (table) return;
    const candidate = tables.find(
      (t) => t.capacity >= covers && !occupiedSet.has(t.number)
    );
    if (candidate) setTable(candidate.number);
  }, [table, tables, covers, occupiedSet]);

  const reset = () => {
    setName("");
    setDate(defaultDate ?? todayIso());
    setTime("20:00");
    setCovers(2);
    setTable("");
    setPhone("");
    setEmail("");
    setNote("");
  };

  const selectedTable = tables.find((t) => t.number === table) ?? null;
  const conflict = table ? occupiedSet.has(table) : false;
  const tooSmall = selectedTable ? selectedTable.capacity < covers : false;

  const submit = async () => {
    if (!name.trim() || submitting) return;
    if (!table) {
      return;
    }
    setSubmitting(true);
    try {
      await onCreate?.({
        name: name.trim(),
        date,
        time,
        covers,
        table,
        note,
        phone: phone.trim(),
        email: email.trim(),
        status: "confirmed",
      });
      reset();
    } finally {
      setSubmitting(false);
    }
  };

  const tablesByZone = useMemo(() => {
    const grouped = new Map<TableZone, TableEntry[]>();
    for (const t of tables) {
      const arr = grouped.get(t.zone) ?? [];
      arr.push(t);
      grouped.set(t.zone, arr);
    }
    return ZONE_ORDER.filter((z) => (grouped.get(z) ?? []).length > 0).map((z) => ({
      zone: z,
      tables: grouped.get(z) ?? [],
    }));
  }, [tables]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nouvelle réservation"
      subtitle="Ajouter un client au plan de salle"
      footer={
        <div className="flex gap-2 justify-end items-center">
          {(conflict || tooSmall) && (
            <span className="text-[11px] text-ember-soft inline-flex items-center gap-1 mr-auto">
              <AlertTriangle size={12} />
              {conflict ? "Table déjà occupée sur ce créneau." : "Capacité insuffisante."}
            </span>
          )}
          <button className="btn-ghost" onClick={onClose}>
            Annuler
          </button>
          <button
            className="btn-primary inline-flex items-center gap-2"
            onClick={submit}
            disabled={!name.trim() || !table || submitting}
          >
            <CalendarPlus size={13} />
            {submitting ? "Enregistrement…" : "Confirmer"}
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="chip-uppercase block mb-[6px]">Nom du client</label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Mme Dupont, M. Chen…"
            className="w-full bg-bg-2 border border-line rounded-[10px] px-3 py-[9px] text-[13px] text-ink-1 outline-none focus:border-line-2 transition-colors"
          />
        </div>

        <div className="col-span-2 grid grid-cols-3 gap-3">
          <div>
            <label className="chip-uppercase block mb-[6px]">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-bg-2 border border-line rounded-[10px] px-3 py-[9px] text-[13px] text-ink-1 outline-none focus:border-line-2 transition-colors mono"
            />
          </div>
          <div>
            <label className="chip-uppercase block mb-[6px]">Heure</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full bg-bg-2 border border-line rounded-[10px] px-3 py-[9px] text-[13px] text-ink-1 outline-none focus:border-line-2 transition-colors mono"
            />
          </div>
          <div>
            <label className="chip-uppercase block mb-[6px]">Couverts</label>
            <input
              type="number"
              min={1}
              max={20}
              value={covers}
              onChange={(e) => setCovers(Number(e.target.value))}
              className="w-full bg-bg-2 border border-line rounded-[10px] px-3 py-[9px] text-[13px] text-ink-1 outline-none focus:border-line-2 transition-colors mono"
            />
          </div>
        </div>

        <div>
          <label className="chip-uppercase block mb-[6px]">Téléphone</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+33 6 12 34 56 78"
            className="w-full bg-bg-2 border border-line rounded-[10px] px-3 py-[9px] text-[13px] text-ink-1 outline-none focus:border-line-2 transition-colors mono"
          />
        </div>

        <div>
          <label className="chip-uppercase block mb-[6px]">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="client@mail.com"
            className="w-full bg-bg-2 border border-line rounded-[10px] px-3 py-[9px] text-[13px] text-ink-1 outline-none focus:border-line-2 transition-colors"
          />
        </div>

        <div className="col-span-2">
          <label className="chip-uppercase block mb-[6px]">
            Table proposée
            {tables.length === 0 && (
              <span className="ml-2 text-ink-4 normal-case tracking-normal">
                · Ajoutez d'abord des tables dans QR codes
              </span>
            )}
          </label>
          {tables.length === 0 ? (
            <div className="text-[12px] text-ink-4 italic py-3 px-2 bg-bg-2 border border-line rounded-[8px]">
              Aucune table configurée pour ce restaurant.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {tablesByZone.map(({ zone, tables: tz }) => (
                <div key={zone}>
                  <div className="text-[10px] uppercase tracking-[0.1em] text-ink-4 mb-1">
                    {ZONE_LABEL[zone]}
                  </div>
                  <div className="grid grid-cols-8 gap-1">
                    {tz.map((t) => {
                      const isSelected = table === t.number;
                      const isOccupied = occupiedSet.has(t.number);
                      const fits = t.capacity >= covers;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setTable(t.number)}
                          title={`${t.capacity} cv${isOccupied ? " · occupée" : ""}`}
                          className={cn(
                            "mono text-[11px] py-[8px] rounded-[6px] border transition-all flex flex-col items-center gap-[1px] leading-tight",
                            isSelected
                              ? "bg-ember/20 border-ember text-ember-soft"
                              : isOccupied
                              ? "bg-danger/10 border-danger/40 text-danger/80 hover:bg-danger/15"
                              : !fits
                              ? "bg-bg-2 border-line text-ink-4 hover:bg-bg-3"
                              : "bg-bg-2 border-line text-ink-3 hover:bg-bg-3"
                          )}
                        >
                          <span className="font-semibold">{t.number}</span>
                          <span className="text-[9px] opacity-80">{t.capacity}cv</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="col-span-2">
          <label className="chip-uppercase block mb-[6px]">Note · demandes spéciales</label>
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Allergies, anniversaire, proche fenêtre…"
            className="w-full bg-bg-2 border border-line rounded-[10px] px-3 py-[9px] text-[13px] text-ink-1 outline-none focus:border-line-2 transition-colors resize-none"
          />
        </div>
      </div>
    </Modal>
  );
}
