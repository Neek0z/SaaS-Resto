import { useState } from "react";
import { CalendarPlus } from "lucide-react";
import type { NewReservation } from "@/lib/reservation-types";
import { Modal } from "@/components/ui/modal";

export function NewReservationModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate?: (r: NewReservation) => void | Promise<void>;
}) {
  const [name, setName] = useState("");
  const [time, setTime] = useState("20:00");
  const [covers, setCovers] = useState(2);
  const [table, setTable] = useState("T5");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setName("");
    setTime("20:00");
    setCovers(2);
    setTable("T5");
    setPhone("");
    setEmail("");
    setNote("");
  };

  const submit = async () => {
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onCreate?.({
        name: name.trim(),
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
            disabled={!name.trim() || submitting}
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
