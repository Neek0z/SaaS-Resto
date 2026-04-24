import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 520,
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-50 transition-opacity flex items-center justify-center p-4",
        open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )}
      aria-hidden={!open}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative bg-bg-1 border border-line-2 rounded-[14px] shadow-2xl flex flex-col max-h-[85vh] transition-transform",
          open ? "scale-100" : "scale-95"
        )}
        style={{ width }}
        role="dialog"
        aria-modal="true"
      >
        <header className="flex items-start justify-between gap-3 px-5 py-4 border-b border-line">
          <div className="min-w-0">
            {title && (
              <div className="display text-[20px] font-medium leading-tight">{title}</div>
            )}
            {subtitle && (
              <div className="text-[11.5px] text-ink-3 mt-1">{subtitle}</div>
            )}
          </div>
          <button onClick={onClose} className="icon-btn flex-shrink-0" aria-label="Fermer">
            <X size={14} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <footer className="px-5 py-3 border-t border-line bg-bg-2/60 rounded-b-[14px]">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body
  );
}
