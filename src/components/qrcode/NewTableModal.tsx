import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/ui/modal";

export function NewTableModal({
  open,
  onClose,
  onCreate,
  existingNumbers,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (number: string, capacity: number) => void;
  existingNumbers: string[];
}) {
  const [number, setNumber] = useState("");
  const [capacity, setCapacity] = useState(4);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setNumber("");
      setCapacity(4);
      setError(null);
    }
  }, [open]);

  const submit = () => {
    const trimmed = number.trim();
    if (!trimmed) {
      setError("Numéro de table requis.");
      return;
    }
    if (existingNumbers.includes(trimmed)) {
      setError("Cette table existe déjà.");
      return;
    }
    if (capacity < 1 || capacity > 20) {
      setError("Capacité entre 1 et 20.");
      return;
    }
    onCreate(trimmed, capacity);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      width={420}
      title="Nouvelle table"
      subtitle="Un QR code dédié sera généré automatiquement"
      footer={
        <div className="flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>
            Annuler
          </button>
          <button
            className="btn-primary inline-flex items-center gap-2"
            onClick={submit}
            disabled={!number.trim()}
          >
            <Plus size={13} />
            Ajouter
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-[6px]">
          <label className="chip-uppercase">Numéro de table</label>
          <input
            autoFocus
            value={number}
            onChange={(e) => {
              setNumber(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
            placeholder="Ex. 12, T3, Terrasse-A"
            className="bg-bg-2 border border-line rounded-[10px] px-3 py-[9px] text-[13px] text-ink-1 outline-none focus:border-line-2 transition-colors"
          />
        </div>
        <div className="flex flex-col gap-[6px]">
          <label className="chip-uppercase">Capacité (couverts)</label>
          <input
            type="number"
            min={1}
            max={20}
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value) || 1)}
            className="bg-bg-2 border border-line rounded-[10px] px-3 py-[9px] text-[13px] text-ink-1 outline-none focus:border-line-2 transition-colors w-[120px]"
          />
        </div>
        {error && <div className="text-[12px] text-danger">{error}</div>}
      </div>
    </Modal>
  );
}
