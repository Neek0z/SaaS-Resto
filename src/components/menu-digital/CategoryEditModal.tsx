import { useEffect, useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import type { DigitalMenuCategory } from "@/lib/mock-data";
import { Modal } from "@/components/ui/modal";

type Item = DigitalMenuCategory["items"][number];

export function CategoryEditModal({
  category,
  onClose,
  onSave,
}: {
  category: DigitalMenuCategory | null;
  onClose: () => void;
  onSave?: (updated: DigitalMenuCategory) => void;
}) {
  const open = category !== null;
  const [name, setName] = useState("");
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setItems(category.items.map((i) => ({ ...i })));
    }
  }, [category]);

  const updateItem = (i: number, patch: Partial<Item>) => {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  };

  const removeItem = (i: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  };

  const addItem = () => {
    setItems((prev) => [...prev, { name: "Nouveau plat", price: 0 }]);
  };

  const save = () => {
    if (!category) return;
    onSave?.({ ...category, name: name.trim() || category.name, items });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      width={680}
      title="Éditer la catégorie"
      subtitle={category ? `${category.items.length} plat${category.items.length > 1 ? "s" : ""} au menu` : undefined}
      footer={
        <div className="flex justify-between items-center gap-2">
          <button
            className="btn-ghost inline-flex items-center gap-2 text-[11.5px]"
            onClick={addItem}
          >
            <Plus size={13} />
            Ajouter un plat
          </button>
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={onClose}>
              Annuler
            </button>
            <button className="btn-primary inline-flex items-center gap-2" onClick={save}>
              <Check size={13} />
              Enregistrer
            </button>
          </div>
        </div>
      }
    >
      {category && (
        <div className="flex flex-col gap-4">
          <div>
            <label className="chip-uppercase block mb-[6px]">Nom de la catégorie</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-bg-2 border border-line rounded-[10px] px-3 py-[9px] text-[13px] text-ink-1 outline-none focus:border-line-2 transition-colors"
            />
          </div>

          <div>
            <div className="chip-uppercase mb-2">Plats · {items.length}</div>
            <div className="flex flex-col gap-2">
              {items.length === 0 ? (
                <div className="text-[12px] text-ink-4 italic p-3 bg-bg-2 rounded-[10px] border border-line text-center">
                  Aucun plat dans cette catégorie.
                </div>
              ) : (
                items.map((it, i) => (
                  <div
                    key={i}
                    className="grid gap-2 items-center p-[10px] bg-bg-2 rounded-[10px] border border-line"
                    style={{ gridTemplateColumns: "1fr 90px 90px 32px" }}
                  >
                    <input
                      value={it.name}
                      onChange={(e) => updateItem(i, { name: e.target.value })}
                      placeholder="Nom"
                      className="bg-bg-1 border border-line rounded-[8px] px-2 py-[6px] text-[12.5px] text-ink-1 outline-none focus:border-line-2"
                    />
                    <input
                      type="number"
                      step="0.5"
                      value={it.price}
                      onChange={(e) => updateItem(i, { price: Number(e.target.value) })}
                      placeholder="Prix"
                      className="bg-bg-1 border border-line rounded-[8px] px-2 py-[6px] text-[12.5px] text-ink-1 outline-none focus:border-line-2 mono"
                    />
                    <input
                      value={it.tag ?? ""}
                      onChange={(e) => updateItem(i, { tag: e.target.value || undefined })}
                      placeholder="Tag"
                      className="bg-bg-1 border border-line rounded-[8px] px-2 py-[6px] text-[11px] text-ink-3 outline-none focus:border-line-2 mono uppercase tracking-wide"
                    />
                    <button
                      onClick={() => removeItem(i)}
                      className="text-ink-4 hover:text-danger transition-colors flex items-center justify-center"
                      title="Supprimer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
