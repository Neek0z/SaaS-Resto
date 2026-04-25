import { useState } from "react";
import {
  AlertTriangle,
  Calendar,
  Download,
  Mail,
  Pencil,
  Phone,
  Tag,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { Drawer } from "@/components/ui/drawer";
import {
  SOURCE_COLOR,
  SOURCE_LABEL,
  relativeDate,
  type Customer,
} from "@/lib/crm-types";

const euros = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

function avatarFor(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function CustomerDrawer({
  customer,
  onClose,
  onEdit,
  onCompose,
  onToggleOptIn,
  onDelete,
  onExportData,
}: {
  customer: Customer | null;
  onClose: () => void;
  onEdit: (c: Customer) => void;
  onCompose: (c: Customer) => void;
  onToggleOptIn: (
    id: string,
    channel: "email" | "sms",
    value: boolean
  ) => Promise<void> | void;
  onDelete: (id: string) => Promise<void> | void;
  onExportData: (c: Customer) => void;
}) {
  const open = customer !== null;
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <Drawer
      open={open}
      onClose={() => {
        setConfirmDelete(false);
        onClose();
      }}
      width={460}
      title={customer?.name ?? ""}
      subtitle={
        customer ? (
          <span className="mono">{customer.email ?? "Pas d'email"}</span>
        ) : undefined
      }
      footer={
        customer ? (
          <div className="flex gap-2">
            <button
              className="btn-ghost flex-1 inline-flex items-center justify-center gap-2"
              onClick={() => onEdit(customer)}
              type="button"
            >
              <Pencil size={13} />
              Modifier
            </button>
            <button
              className="btn-primary flex-1 inline-flex items-center justify-center gap-2"
              onClick={() => onCompose(customer)}
              type="button"
              disabled={!customer.email}
            >
              <Mail size={13} />
              Email
            </button>
          </div>
        ) : undefined
      }
    >
      {customer && (
        <div className="flex flex-col gap-4">
          {/* Hero */}
          <div className="p-4 rounded-[12px] border border-line-2 bg-gradient-to-br from-bg-2 to-bg-1">
            <div className="flex items-center gap-3">
              <div className="avatar-circle w-12 h-12 text-[14px]">
                {avatarFor(customer.name)}
              </div>
              <div className="min-w-0 flex-1">
                <span
                  className="inline-block px-2 py-[2px] rounded-full text-[10px] font-semibold uppercase tracking-wider"
                  style={{
                    background: `${SOURCE_COLOR[customer.source]}22`,
                    color: SOURCE_COLOR[customer.source],
                  }}
                >
                  {SOURCE_LABEL[customer.source]}
                </span>
                <div className="display text-[18px] font-medium leading-tight mt-1 truncate">
                  {customer.name}
                </div>
                <div className="text-[11px] text-ink-3 mt-[2px]">
                  Inscrit le {formatDate(customer.createdAt)}
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            <StatBox
              icon={Calendar}
              label="Visites"
              value={`${customer.visitCount}`}
            />
            <StatBox
              icon={TrendingUp}
              label="Dépense"
              value={euros.format(customer.totalSpent)}
            />
            <StatBox
              icon={Calendar}
              label="Dernière"
              value={relativeDate(customer.lastVisit)}
              small
            />
          </div>

          {/* Coordonnées */}
          <div>
            <div className="chip-uppercase mb-2">Coordonnées</div>
            <div className="flex flex-col gap-1">
              <Row icon={Mail} value={customer.email ?? "Pas d'email"} />
              <Row icon={Phone} value={customer.phone ?? "Pas de téléphone"} />
            </div>
          </div>

          {/* Tags */}
          {customer.tags.length > 0 && (
            <div>
              <div className="chip-uppercase mb-2">Tags</div>
              <div className="flex flex-wrap gap-1">
                {customer.tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2 py-[3px] bg-bg-2 border border-line rounded-full text-[11px] text-ink-2"
                  >
                    <Tag size={9} className="text-ink-4" />
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {customer.notes && (
            <div>
              <div className="chip-uppercase mb-2">Notes</div>
              <div className="text-[12.5px] text-ink-2 p-3 bg-bg-2 rounded-[10px] border border-line whitespace-pre-wrap">
                {customer.notes}
              </div>
            </div>
          )}

          {/* Préférences marketing */}
          <div>
            <div className="chip-uppercase mb-2">Préférences marketing</div>
            <div className="flex flex-col gap-2">
              <Toggle
                label="Emails marketing"
                checked={customer.optedInEmail}
                onChange={(v) =>
                  void onToggleOptIn(customer.id, "email", v)
                }
              />
              <Toggle
                label="SMS marketing"
                checked={customer.optedInSms}
                onChange={(v) => void onToggleOptIn(customer.id, "sms", v)}
              />
            </div>
          </div>

          {/* RGPD */}
          <div className="border-t border-line pt-3">
            <div className="chip-uppercase mb-2">Conformité RGPD</div>
            <button
              type="button"
              onClick={() => onExportData(customer)}
              className="btn-ghost w-full justify-start inline-flex items-center gap-2 mb-2"
            >
              <Download size={13} />
              Exporter mes données (article 20)
            </button>

            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="w-full px-3 py-[9px] rounded-[10px] border border-danger/30 text-danger text-[12.5px] font-semibold inline-flex items-center justify-center gap-2 hover:bg-danger/10 transition-colors"
              >
                <Trash2 size={13} />
                Demander la suppression (article 17)
              </button>
            ) : (
              <div className="p-3 rounded-[10px] border border-danger/40 bg-danger/5">
                <div className="flex items-start gap-2 mb-2">
                  <AlertTriangle
                    size={14}
                    className="text-danger flex-shrink-0 mt-[2px]"
                  />
                  <p className="text-[11.5px] text-ink-2 leading-relaxed">
                    Cette action est <strong>irréversible</strong>. Toutes les
                    données du client seront supprimées définitivement.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="btn-ghost flex-1 !text-[11.5px]"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await onDelete(customer.id);
                      onClose();
                    }}
                    className="flex-1 px-3 py-[8px] rounded-[10px] bg-danger text-white text-[11.5px] font-semibold hover:brightness-110 transition-all"
                  >
                    Supprimer définitivement
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Drawer>
  );
}

function StatBox({
  icon: Icon,
  label,
  value,
  small = false,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    <div className="p-[10px] bg-bg-2 rounded-[10px] border border-line">
      <div className="flex items-center gap-[6px] mb-1">
        <Icon size={11} className="text-ink-4" />
        <span className="chip-uppercase !text-[10px]">{label}</span>
      </div>
      <div
        className={
          small
            ? "text-[11.5px] text-ink-2 truncate"
            : "text-[14px] font-semibold"
        }
      >
        {value}
      </div>
    </div>
  );
}

function Row({ icon: Icon, value }: { icon: typeof Mail; value: string }) {
  return (
    <div className="flex items-center gap-2 text-[12.5px] text-ink-2 px-3 py-[8px] bg-bg-2 rounded-[8px] border border-line">
      <Icon size={12} className="text-ink-4" />
      <span className="mono truncate">{value}</span>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer">
      <span className="text-[12.5px] text-ink-2">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-[36px] h-[20px] rounded-full transition-colors ${
          checked ? "bg-ember" : "bg-bg-3 border border-line"
        }`}
      >
        <span
          className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white transition-transform ${
            checked ? "translate-x-[18px]" : "translate-x-[2px]"
          }`}
        />
      </button>
    </label>
  );
}
