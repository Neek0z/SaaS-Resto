import { useState } from "react";
import { Plus, Trash2, ClipboardList } from "lucide-react";
import type { NewOrder, OrderChannel, OrderPriority } from "@/lib/order-types";
import { Modal } from "@/components/ui/modal";
import { LoyaltyCustomerPicker } from "@/components/loyalty/LoyaltyCustomerPicker";

type ItemDraft = { name: string; price: number };

const CHANNELS: { id: OrderChannel; label: string }[] = [
  { id: "salle", label: "Salle" },
  { id: "cc", label: "Click & Collect" },
  { id: "delivery", label: "Livraison" },
];

export function NewOrderModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate?: (o: NewOrder) => void | Promise<void>;
}) {
  const [channel, setChannel] = useState<OrderChannel>("salle");
  const [table, setTable] = useState("");
  const [covers, setCovers] = useState(2);
  const [waiter, setWaiter] = useState("");
  const [priority, setPriority] = useState<OrderPriority>("normal");
  const [pickup, setPickup] = useState("");
  const [note, setNote] = useState("");
  const [items, setItems] = useState<ItemDraft[]>([{ name: "", price: 0 }]);
  const [loyaltyCustomerId, setLoyaltyCustomerId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setChannel("salle");
    setTable("");
    setCovers(2);
    setWaiter("");
    setPriority("normal");
    setPickup("");
    setNote("");
    setItems([{ name: "", price: 0 }]);
    setLoyaltyCustomerId(null);
  };

  const total = items.reduce((s, i) => s + (Number(i.price) || 0), 0);
  const validItems = items.filter((i) => i.name.trim());
  const canSubmit =
    table.trim().length > 0 && validItems.length > 0 && !submitting;

  const tableLabel = (() => {
    if (channel === "cc") return table.trim() || "Click & Collect";
    if (channel === "delivery") return table.trim() || "Livraison";
    return table.trim();
  })();

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onCreate?.({
        channel,
        table: tableLabel,
        covers,
        items: validItems.map((i) => i.name.trim()),
        total,
        waiter: waiter.trim() || "—",
        priority,
        pickup: pickup.trim(),
        note: note.trim(),
        status: "pending",
        loyaltyCustomerId,
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
      title="Nouvelle commande"
      subtitle="Saisir un ticket en cuisine"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-[12px] text-ink-3">
            Total estimé{" "}
            <span className="display text-ember-soft text-[16px] font-medium ml-1 mono">
              {total.toFixed(2)} €
            </span>
          </div>
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={onClose}>
              Annuler
            </button>
            <button
              className="btn-primary inline-flex items-center gap-2"
              onClick={submit}
              disabled={!canSubmit}
            >
              <ClipboardList size={13} />
              {submitting ? "Enregistrement…" : "Envoyer en cuisine"}
            </button>
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="chip-uppercase block mb-[6px]">Canal</label>
          <div className="segmented w-full">
            {CHANNELS.map((c) => (
              <button
                key={c.id}
                onClick={() => setChannel(c.id)}
                className={channel === c.id ? "active" : ""}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="chip-uppercase block mb-[6px]">
            {channel === "salle" ? "Table" : channel === "cc" ? "Référence client" : "Plateforme"}
          </label>
          <input
            value={table}
            onChange={(e) => setTable(e.target.value)}
            placeholder={
              channel === "salle"
                ? "Table 7"
                : channel === "cc"
                ? "Mme Dupont"
                : "Deliveroo · cmd 912"
            }
            className="w-full bg-bg-2 border border-line rounded-[10px] px-3 py-[9px] text-[13px] text-ink-1 outline-none focus:border-line-2 transition-colors"
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

        {channel === "salle" && (
          <div>
            <label className="chip-uppercase block mb-[6px]">Serveur</label>
            <input
              value={waiter}
              onChange={(e) => setWaiter(e.target.value)}
              placeholder="Léa, Karim…"
              className="w-full bg-bg-2 border border-line rounded-[10px] px-3 py-[9px] text-[13px] text-ink-1 outline-none focus:border-line-2 transition-colors"
            />
          </div>
        )}

        {(channel === "cc" || channel === "delivery") && (
          <div>
            <label className="chip-uppercase block mb-[6px]">Heure de retrait</label>
            <input
              type="time"
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
              className="w-full bg-bg-2 border border-line rounded-[10px] px-3 py-[9px] text-[13px] text-ink-1 outline-none focus:border-line-2 transition-colors mono"
            />
          </div>
        )}

        <div>
          <label className="chip-uppercase block mb-[6px]">Priorité</label>
          <div className="segmented w-full">
            <button
              onClick={() => setPriority("normal")}
              className={priority === "normal" ? "active" : ""}
            >
              Normale
            </button>
            <button
              onClick={() => setPriority("high")}
              className={priority === "high" ? "active" : ""}
            >
              Urgente
            </button>
          </div>
        </div>

        <div className="col-span-2">
          <label className="chip-uppercase block mb-[6px]">Articles</label>
          <div className="flex flex-col gap-2">
            {items.map((it, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  value={it.name}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((p, i) => (i === idx ? { ...p, name: e.target.value } : p))
                    )
                  }
                  placeholder="Entrecôte béarnaise…"
                  className="flex-1 bg-bg-2 border border-line rounded-[10px] px-3 py-[9px] text-[13px] text-ink-1 outline-none focus:border-line-2 transition-colors"
                />
                <input
                  type="number"
                  min={0}
                  step="0.5"
                  value={it.price}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((p, i) =>
                        i === idx ? { ...p, price: Number(e.target.value) } : p
                      )
                    )
                  }
                  className="w-[90px] bg-bg-2 border border-line rounded-[10px] px-3 py-[9px] text-[13px] text-ink-1 outline-none focus:border-line-2 transition-colors mono text-right"
                />
                <button
                  onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                  disabled={items.length === 1}
                  className="px-2 rounded-[10px] border border-line text-ink-3 hover:text-danger hover:border-danger/40 disabled:opacity-30 transition-colors"
                  title="Retirer"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            <button
              onClick={() => setItems((prev) => [...prev, { name: "", price: 0 }])}
              className="btn-ghost inline-flex items-center justify-center gap-2 self-start"
            >
              <Plus size={13} />
              Ajouter un article
            </button>
          </div>
        </div>

        <div className="col-span-2">
          <LoyaltyCustomerPicker
            value={loyaltyCustomerId}
            onChange={(id) => setLoyaltyCustomerId(id)}
          />
        </div>

        <div className="col-span-2">
          <label className="chip-uppercase block mb-[6px]">Note · cuisine / salle</label>
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Cuisson saignant, sans gluten, anniversaire…"
            className="w-full bg-bg-2 border border-line rounded-[10px] px-3 py-[9px] text-[13px] text-ink-1 outline-none focus:border-line-2 transition-colors resize-none"
          />
        </div>
      </div>
    </Modal>
  );
}
