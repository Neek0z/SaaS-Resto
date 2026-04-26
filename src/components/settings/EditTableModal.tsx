import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import type { TableEntry, TableZone } from "@/hooks/useTables";
import { cn } from "@/lib/utils";

const ZONES: { key: TableZone; label: string }[] = [
  { key: "inside", label: "Salle" },
  { key: "terrace", label: "Terrasse" },
  { key: "bar", label: "Bar" },
  { key: "private", label: "Privée" },
];

export function EditTableModal({
  open,
  table,
  existingNumbers,
  onClose,
  onSave,
}: {
  open: boolean;
  table: TableEntry | null;
  existingNumbers: string[];
  onClose: () => void;
  onSave: (
    id: string,
    patch: { label?: string; capacity?: number; zone?: TableZone; active?: boolean }
  ) => void | Promise<void>;
}) {
  const [number, setNumber] = useState("");
  const [capacity, setCapacity] = useState(4);
  const [zone, setZone] = useState<TableZone>("inside");
  const [active, setActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && table) {
      setNumber(table.number);
      setCapacity(table.capacity);
      setZone(table.zone);
      setActive(table.active);
      setError(null);
    }
  }, [open, table]);

  if (!table) return null;

  const submit = async () => {
    const trimmed = number.trim();
    if (!trimmed) {
      setError("Numéro de table requis.");
      return;
    }
    if (
      trimmed !== table.number &&
      existingNumbers.includes(trimmed)
    ) {
      setError("Cette table existe déjà.");
      return;
    }
    if (capacity < 1 || capacity > 30) {
      setError("Capacité entre 1 et 30.");
      return;
    }
    const patch: {
      label?: string;
      capacity?: number;
      zone?: TableZone;
      active?: boolean;
    } = {};
    if (trimmed !== table.number) patch.label = trimmed;
    if (capacity !== table.capacity) patch.capacity = capacity;
    if (zone !== table.zone) patch.zone = zone;
    if (active !== table.active) patch.active = active;
    if (Object.keys(patch).length === 0) {
      onClose();
      return;
    }
    await onSave(table.id, patch);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      width={420}
      title={`Modifier table ${table.number}`}
      subtitle="Capacité, zone, libellé et disponibilité"
      footer={
        <div className="flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose} type="button">
            Annuler
          </button>
          <button
            className="btn-primary inline-flex items-center gap-2"
            onClick={() => void submit()}
            type="button"
          >
            <Save size={13} />
            Enregistrer
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-[6px]">
          <label className="chip-uppercase">Numéro / libellé</label>
          <input
            autoFocus
            value={number}
            onChange={(e) => {
              setNumber(e.target.value);
              setError(null);
            }}
            placeholder="Ex. 12, T3, Terrasse-A"
            className="bg-bg-2 border border-line rounded-[10px] px-3 py-[9px] text-[13px] text-ink-1 outline-none focus:border-line-2 transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-[6px]">
            <label className="chip-uppercase">Capacité (couverts)</label>
            <input
              type="number"
              min={1}
              max={30}
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value) || 1)}
              className="bg-bg-2 border border-line rounded-[10px] px-3 py-[9px] text-[13px] text-ink-1 outline-none focus:border-line-2 transition-colors"
            />
          </div>
          <div className="flex flex-col gap-[6px]">
            <label className="chip-uppercase">Zone</label>
            <div className="grid grid-cols-2 gap-1">
              {ZONES.map((z) => (
                <button
                  key={z.key}
                  type="button"
                  onClick={() => setZone(z.key)}
                  className={cn(
                    "text-[11.5px] py-[7px] rounded-[8px] border transition-all",
                    zone === z.key
                      ? "bg-ember/20 border-ember text-ember-soft"
                      : "bg-bg-2 border-line text-ink-3 hover:bg-bg-3"
                  )}
                >
                  {z.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <label className="flex items-start gap-2 text-[12.5px] text-ink-2 leading-snug cursor-pointer p-3 bg-bg-2 border border-line rounded-[10px]">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="mt-[2px] accent-ember"
          />
          <span>
            <span className="font-semibold text-ink-1">Table active</span>
            <span className="block text-[11px] text-ink-3 mt-[2px]">
              Si désactivée, la table n'apparaît plus dans les choix de réservation
              (publiques et internes).
            </span>
          </span>
        </label>

        {error && <div className="text-[12px] text-danger">{error}</div>}
      </div>
    </Modal>
  );
}
