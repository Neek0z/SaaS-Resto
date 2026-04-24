import { useState } from "react";
import { CalendarPlus } from "lucide-react";
import type { Reservation } from "@/lib/mock-data";
import { Modal } from "@/components/ui/modal";

export function NewReservationModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate?: (r: Reservation) => void;
}) {
  const [name, setName] = useState("");
  const [time, setTime] = useState("20:00");
  const [covers, setCovers] = useState(2);
  const [table, setTable] = useState("T5");
  const [note, setNote] = useState("");

  const reset = () => {
    setName("");
    setTime("20:00");
    setCovers(2);
    setTable("T5");
    setNote("");
  };

  const submit = () => {
    if (!name.trim()) return;
    onCreate?.({
      name: name.trim(),
      time,
      covers,
      table,
      note,
      status: "confirmed",
    });
    reset();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nouvelle réservation"
      subtitle="Ajouter un client au plan de salle"
      footer={
        <div className="flex gap-2 justify-end">
          <button className="btn-ghost" onClick={onClose}>
            Annuler
          </button>
          <button
            className="btn-primary inline-flex items-center gap-2"
            onClick={submit}
            disabled={!name.trim()}
          >
            <CalendarPlus size={13} />
            Confirmer
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

        <div className="col-span-2">
          <label className="chip-uppercase block mb-[6px]">Table proposée</label>
          <div className="grid grid-cols-10 gap-1">
            {Array.from({ length: 20 }, (_, i) => `T${i + 1}`).map((t) => (
              <button
                key={t}
                onClick={() => setTable(t)}
                className={`mono text-[11px] py-[6px] rounded-[6px] border transition-all ${
                  table === t
                    ? "bg-ember/20 border-ember text-ember-soft"
                    : "bg-bg-2 border-line text-ink-3 hover:bg-bg-3"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
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
