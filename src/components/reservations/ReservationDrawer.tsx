import { Clock, Users, MapPin, CheckCircle2, XCircle, Phone, Mail, AlertTriangle } from "lucide-react";
import type { Reservation, ResaStatus } from "@/lib/mock-data";
import { Drawer } from "@/components/ui/drawer";
import { statusLabel } from "./ResaRow";
import { cn } from "@/lib/utils";

export function ReservationDrawer({
  resa,
  onClose,
  onStatusChange,
}: {
  resa: Reservation | null;
  onClose: () => void;
  onStatusChange?: (key: string, status: ResaStatus) => void;
}) {
  const open = resa !== null;
  const key = resa ? `${resa.time}-${resa.table}` : "";

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={resa ? resa.name : ""}
      subtitle={
        resa ? (
          <span className="mono">
            {resa.time} · {resa.covers} couverts · Table {resa.table}
          </span>
        ) : undefined
      }
      footer={
        resa ? (
          <div className="flex gap-2">
            <button className="btn-ghost flex-1 inline-flex items-center justify-center gap-2">
              <Phone size={13} />
              Appeler
            </button>
            <button className="btn-primary flex-1 inline-flex items-center justify-center gap-2">
              <Mail size={13} />
              Rappel SMS
            </button>
          </div>
        ) : undefined
      }
    >
      {resa && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-2">
            <MetaTile icon={Clock} label="Heure" value={resa.time} />
            <MetaTile icon={Users} label="Couverts" value={`${resa.covers}`} />
            <MetaTile icon={MapPin} label="Table" value={resa.table} />
          </div>

          <div className="p-3 bg-bg-2 rounded-[10px] border border-line">
            <div className="flex items-center justify-between mb-3">
              <div className="chip-uppercase">Statut</div>
              <span
                className="text-[11px] font-semibold px-2 py-[2px] rounded"
                style={{
                  color:
                    resa.status === "seated"
                      ? "var(--ok)"
                      : resa.status === "confirmed"
                      ? "var(--ember-soft)"
                      : "var(--danger)",
                }}
              >
                {statusLabel(resa.status)}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <StatusBtn
                active={resa.status === "confirmed"}
                icon={Clock}
                label="Confirmée"
                onClick={() => onStatusChange?.(key, "confirmed")}
              />
              <StatusBtn
                active={resa.status === "seated"}
                icon={CheckCircle2}
                tone="ok"
                label="Installer"
                onClick={() => onStatusChange?.(key, "seated")}
              />
              <StatusBtn
                active={resa.status === "noshow"}
                icon={XCircle}
                tone="danger"
                label="No-show"
                onClick={() => onStatusChange?.(key, "noshow")}
              />
            </div>
          </div>

          {resa.note && (
            <div className="p-3 rounded-[10px] border border-amber/30 bg-amber/5">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle size={13} className="text-amber" />
                <span className="chip-uppercase !text-amber">À noter</span>
              </div>
              <div className="text-[13px] text-ink-1">{resa.note}</div>
            </div>
          )}

          <div>
            <div className="chip-uppercase mb-2">Contact</div>
            <div className="flex flex-col gap-2">
              <ContactRow icon={Phone} value="+33 6 12 34 56 78" />
              <ContactRow icon={Mail} value={`${resa.name.toLowerCase().replace(/[^a-z]/g, ".")}@mail.com`} />
            </div>
          </div>

          <div>
            <div className="chip-uppercase mb-2">Historique</div>
            <div className="text-[12px] text-ink-3 p-3 bg-bg-2 rounded-[10px] border border-line">
              Client fidèle · 4 passages sur les 6 derniers mois. Dernière visite : il y a 3 semaines.
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
}

function MetaTile({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <div className="p-[10px] bg-bg-2 rounded-[10px] border border-line">
      <div className="flex items-center gap-[6px] mb-1">
        <Icon size={11} className="text-ink-4" />
        <span className="chip-uppercase !text-[10px]">{label}</span>
      </div>
      <div className="text-[14px] font-semibold">{value}</div>
    </div>
  );
}

function StatusBtn({
  active,
  icon: Icon,
  label,
  tone,
  onClick,
}: {
  active: boolean;
  icon: typeof Clock;
  label: string;
  tone?: "ok" | "danger";
  onClick: () => void;
}) {
  const color =
    tone === "ok" ? "var(--ok)" : tone === "danger" ? "var(--danger)" : "var(--ember-soft)";
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-[6px] px-[8px] py-[9px] rounded-[8px] border text-[11.5px] font-semibold transition-all",
        active ? "bg-bg-3 border-line-2" : "bg-bg-1 border-line hover:bg-bg-2 hover:border-line-2"
      )}
      style={{ color: active ? color : "var(--ink-2)" }}
    >
      <Icon size={12} />
      {label}
    </button>
  );
}

function ContactRow({ icon: Icon, value }: { icon: typeof Phone; value: string }) {
  return (
    <div className="flex items-center gap-2 text-[13px] text-ink-2 p-[9px] bg-bg-2 rounded-[8px] border border-line">
      <Icon size={13} className="text-ink-4" />
      <span className="mono">{value}</span>
    </div>
  );
}
