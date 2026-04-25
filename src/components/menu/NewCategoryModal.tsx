import { useEffect, useState } from "react";
import { FolderPlus } from "lucide-react";
import { Modal } from "@/components/ui/modal";

export function NewCategoryModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string) => Promise<void> | void;
}) {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setName("");
      setSubmitting(false);
    }
  }, [open]);

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    await onCreate(trimmed);
    setSubmitting(false);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      width={420}
      title="Nouvelle catégorie"
      subtitle="Elle sera ajoutée en dernière position"
      footer={
        <div className="flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>
            Annuler
          </button>
          <button
            className="btn-primary inline-flex items-center gap-2"
            onClick={submit}
            disabled={!name.trim() || submitting}
          >
            <FolderPlus size={13} />
            {submitting ? "Création…" : "Créer"}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-[6px]">
        <label className="chip-uppercase">Nom de la catégorie</label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="Entrées, plats, desserts…"
          className="bg-bg-2 border border-line rounded-[10px] px-3 py-[9px] text-[13px] text-ink-1 outline-none focus:border-line-2 transition-colors"
        />
      </div>
    </Modal>
  );
}
