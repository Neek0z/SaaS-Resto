import { Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";

export function ConfirmDelete({
  open,
  title,
  body,
  confirmLabel = "Supprimer",
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      width={420}
      title={title}
      footer={
        <div className="flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>
            Annuler
          </button>
          <button
            className="btn-primary inline-flex items-center gap-2"
            style={{ background: "var(--danger)", borderColor: "var(--danger)" }}
            onClick={async () => {
              await onConfirm();
              onClose();
            }}
          >
            <Trash2 size={13} />
            {confirmLabel}
          </button>
        </div>
      }
    >
      <p className="text-[13px] text-ink-2 leading-[1.5]">{body}</p>
      <p className="text-[11.5px] text-ink-4 mt-3">Cette action est définitive.</p>
    </Modal>
  );
}
