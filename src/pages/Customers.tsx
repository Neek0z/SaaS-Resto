import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Download,
  Mail,
  MailX,
  Pencil,
  Plus,
  Search,
  Send,
  Trash2,
  Upload,
  Users,
  Workflow,
  Zap,
} from "lucide-react";
import { useCustomers } from "@/hooks/useCustomers";
import { useCampaigns } from "@/hooks/useCampaigns";
import {
  CAMPAIGN_STATUS_COLOR,
  CAMPAIGN_STATUS_LABEL,
  CAMPAIGN_TYPE_LABEL,
  SOURCE_COLOR,
  SOURCE_LABEL,
  relativeDate,
  type Campaign,
  type Customer,
  type CustomerPayload,
  type CustomerSource,
} from "@/lib/crm-types";
import {
  customersToCSV,
  fetchAllCustomers,
  importCustomers,
  type ImportRow,
} from "@/lib/api/customers-db";
import { CustomerFormDrawer } from "@/components/customers/CustomerFormDrawer";
import { CustomerDrawer } from "@/components/customers/CustomerDrawer";
import { ImportCsvModal } from "@/components/customers/ImportCsvModal";
import { EmailComposeModal } from "@/components/customers/EmailComposeModal";
import { CampaignDrawer } from "@/components/customers/CampaignDrawer";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

type Tab = "base" | "campagnes" | "automatisations";

const TABS: { key: Tab; label: string; icon: typeof Users }[] = [
  { key: "base", label: "Base clients", icon: Users },
  { key: "campagnes", label: "Campagnes", icon: Mail },
  { key: "automatisations", label: "Automatisations", icon: Workflow },
];

const euros = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export default function Customers() {
  const { restaurant } = useAuth();
  const [params, setParams] = useSearchParams();
  const urlTab = params.get("tab");
  const [tab, setTab] = useState<Tab>(
    urlTab === "campagnes"
      ? "campagnes"
      : urlTab === "automatisations"
        ? "automatisations"
        : "base"
  );

  useEffect(() => {
    const next = new URLSearchParams(params);
    if (tab === "base") next.delete("tab");
    else next.set("tab", tab);
    if (next.toString() !== params.toString()) {
      setParams(next, { replace: true });
    }
  }, [tab, params, setParams]);

  const customers = useCustomers();
  const campaigns = useCampaigns();

  const [formDrawer, setFormDrawer] = useState<
    { mode: "closed" } | { mode: "create" } | { mode: "edit"; customer: Customer }
  >({ mode: "closed" });
  const [detail, setDetail] = useState<Customer | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [composeFor, setComposeFor] = useState<Customer | null>(null);

  const [campaignDrawer, setCampaignDrawer] = useState<
    { mode: "closed" } | { mode: "create" } | { mode: "edit"; campaign: Campaign }
  >({ mode: "closed" });

  const exportAll = async () => {
    if (!restaurant) return;
    const all = await fetchAllCustomers(restaurant.id);
    const csv = customersToCSV(all);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clients-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportOne = (c: Customer) => {
    const csv = customersToCSV([c]);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${c.name.replace(/\s+/g, "-")}-donnees.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (rows: ImportRow[]) => {
    if (!restaurant) throw new Error("Aucun restaurant.");
    const report = await importCustomers(restaurant.id, rows, "manual");
    await customers.reload();
    await customers.reloadTags();
    return report;
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="display text-[28px] font-medium leading-tight">
            Clients
          </h1>
          <p className="text-[12px] text-ink-3 mt-1">
            Suivi de votre clientèle, campagnes et automatisations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {tab === "base" && (
            <>
              <button
                className="btn-ghost inline-flex items-center gap-2"
                onClick={() => setImportOpen(true)}
                type="button"
              >
                <Upload size={13} />
                Importer
              </button>
              <button
                className="btn-ghost inline-flex items-center gap-2"
                onClick={exportAll}
                type="button"
              >
                <Download size={13} />
                Exporter
              </button>
              <button
                className="btn-primary inline-flex items-center gap-2"
                onClick={() => setFormDrawer({ mode: "create" })}
                type="button"
              >
                <Plus size={13} />
                Nouveau client
              </button>
            </>
          )}
          {tab === "campagnes" && (
            <button
              className="btn-primary inline-flex items-center gap-2"
              onClick={() => setCampaignDrawer({ mode: "create" })}
              type="button"
            >
              <Plus size={13} />
              Nouvelle campagne
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-line">
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "inline-flex items-center gap-2 px-3 py-2 text-[13px] font-medium border-b-2 -mb-px transition-colors",
                active
                  ? "border-ember text-ink-1"
                  : "border-transparent text-ink-3 hover:text-ink-1"
              )}
            >
              <t.icon size={13} />
              {t.label}
            </button>
          );
        })}
      </div>

      {(customers.error || campaigns.error) && (
        <div className="flex items-start gap-2 text-[12px] text-danger bg-danger/10 border border-danger/30 rounded-[10px] p-3">
          <AlertTriangle size={14} className="flex-shrink-0 mt-[2px]" />
          <span className="flex-1">{customers.error ?? campaigns.error}</span>
          <button
            type="button"
            onClick={() => {
              customers.clearError();
              campaigns.clearError();
            }}
            className="text-ink-3 hover:text-ink-1"
          >
            ×
          </button>
        </div>
      )}

      {tab === "base" && (
        <BaseTab
          customers={customers}
          onSelect={setDetail}
          onEdit={(c) => setFormDrawer({ mode: "edit", customer: c })}
        />
      )}
      {tab === "campagnes" && (
        <CampagnesTab
          campaigns={campaigns}
          onEdit={(c) => setCampaignDrawer({ mode: "edit", campaign: c })}
        />
      )}
      {tab === "automatisations" && <AutomatisationsTab />}

      <CustomerFormDrawer
        open={formDrawer.mode !== "closed"}
        onClose={() => setFormDrawer({ mode: "closed" })}
        editing={formDrawer.mode === "edit" ? formDrawer.customer : null}
        knownTags={customers.tags}
        onSave={async (payload: CustomerPayload) => {
          if (formDrawer.mode === "edit") {
            await customers.editCustomer(formDrawer.customer.id, payload);
          } else {
            await customers.addCustomer(payload);
          }
        }}
      />

      <CustomerDrawer
        customer={detail}
        onClose={() => setDetail(null)}
        onEdit={(c) => {
          setDetail(null);
          setFormDrawer({ mode: "edit", customer: c });
        }}
        onCompose={(c) => {
          setDetail(null);
          setComposeFor(c);
        }}
        onToggleOptIn={(id, channel, value) =>
          customers.toggleOptIn(id, channel, value)
        }
        onDelete={(id) => customers.removeCustomer(id)}
        onExportData={exportOne}
      />

      <ImportCsvModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={handleImport}
      />

      <EmailComposeModal
        open={composeFor !== null}
        onClose={() => setComposeFor(null)}
        customer={composeFor}
      />

      <CampaignDrawer
        open={campaignDrawer.mode !== "closed"}
        onClose={() => setCampaignDrawer({ mode: "closed" })}
        editing={campaignDrawer.mode === "edit" ? campaignDrawer.campaign : null}
        onSave={async (payload) => {
          if (campaignDrawer.mode === "edit") {
            await campaigns.editCampaign(campaignDrawer.campaign.id, payload);
            return campaignDrawer.campaign;
          }
          return await campaigns.addCampaign(payload);
        }}
        onSend={async (campaign, recipients) =>
          await campaigns.send(campaign.id, recipients)
        }
      />
    </div>
  );
}

// =============================================================
// Onglet Base clients
// =============================================================
function BaseTab({
  customers,
  onSelect,
  onEdit,
}: {
  customers: ReturnType<typeof useCustomers>;
  onSelect: (c: Customer) => void;
  onEdit: (c: Customer) => void;
}) {
  const optedInCount = useMemo(
    () => customers.rows.filter((c) => c.optedInEmail && c.email).length,
    [customers.rows]
  );

  const totalSpent = useMemo(
    () => customers.rows.reduce((s, c) => s + c.totalSpent, 0),
    [customers.rows]
  );

  return (
    <>
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Kpi
          icon={Users}
          label="Clients (page)"
          value={`${customers.rows.length}`}
          hint={`${customers.total} au total`}
        />
        <Kpi
          icon={Mail}
          label="Optés-in email"
          value={`${optedInCount}`}
          hint="Acceptent l'emailing"
        />
        <Kpi
          icon={Send}
          label="Dépense (page)"
          value={euros.format(totalSpent)}
          hint="Cumulée"
        />
        <Kpi
          icon={Zap}
          label="Tags"
          value={`${customers.tags.length}`}
          hint="Étiquettes utilisées"
        />
      </div>

      {/* Filtres */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4"
          />
          <input
            value={customers.search}
            onChange={(e) => customers.setSearch(e.target.value)}
            placeholder="Rechercher par nom, email, téléphone…"
            className="w-full bg-bg-2 border border-line rounded-[10px] pl-9 pr-3 py-[9px] text-[13px] text-ink-1 outline-none focus:border-line-2"
          />
        </div>
        <select
          value={customers.source}
          onChange={(e) =>
            customers.setSource(e.target.value as CustomerSource | "all")
          }
          className="bg-bg-2 border border-line rounded-[10px] px-3 py-[9px] text-[13px] text-ink-1 outline-none focus:border-line-2"
        >
          <option value="all">Toutes sources</option>
          {(Object.keys(SOURCE_LABEL) as CustomerSource[]).map((s) => (
            <option key={s} value={s}>
              {SOURCE_LABEL[s]}
            </option>
          ))}
        </select>
        <label className="inline-flex items-center gap-2 px-3 py-[8px] bg-bg-2 border border-line rounded-[10px] text-[12.5px] text-ink-2 cursor-pointer">
          <input
            type="checkbox"
            checked={customers.optedInOnly}
            onChange={(e) => customers.setOptedInOnly(e.target.checked)}
          />
          Opt-in uniquement
        </label>
      </div>

      {/* Table */}
      <div className="border border-line rounded-[12px] overflow-hidden bg-bg-1">
        <table className="w-full text-[12.5px]">
          <thead className="bg-bg-2 border-b border-line">
            <tr>
              <Th>Client</Th>
              <Th>Source</Th>
              <Th>Tags</Th>
              <Th align="right">Visites</Th>
              <Th align="right">Dépense</Th>
              <Th>Dernière visite</Th>
              <Th>Opt-in</Th>
              <Th align="right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {customers.loading ? (
              <tr>
                <td colSpan={8} className="text-center py-10 text-ink-4">
                  Chargement…
                </td>
              </tr>
            ) : customers.rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-10 text-ink-4 italic">
                  Aucun client trouvé.
                </td>
              </tr>
            ) : (
              customers.rows.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-line last:border-b-0 hover:bg-bg-2 cursor-pointer transition-colors"
                  onClick={() => onSelect(c)}
                >
                  <td className="px-3 py-[10px]">
                    <div className="flex items-center gap-2">
                      <div className="avatar-circle w-7 h-7 text-[10px]">
                        {c.name
                          .split(/\s+/)
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((p) => p[0])
                          .join("")
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-ink-1 truncate">
                          {c.name}
                        </div>
                        <div className="text-[10.5px] text-ink-4 mono truncate max-w-[180px]">
                          {c.email ?? c.phone ?? "—"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-[10px]">
                    <span
                      className="inline-block px-[6px] py-[2px] rounded-full text-[10px] font-semibold uppercase tracking-wider"
                      style={{
                        background: `${SOURCE_COLOR[c.source]}22`,
                        color: SOURCE_COLOR[c.source],
                      }}
                    >
                      {SOURCE_LABEL[c.source]}
                    </span>
                  </td>
                  <td className="px-3 py-[10px]">
                    <div className="flex flex-wrap gap-1">
                      {c.tags.slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className="px-[6px] py-[1px] bg-bg-3 border border-line rounded-full text-[10px] text-ink-2"
                        >
                          {t}
                        </span>
                      ))}
                      {c.tags.length > 3 && (
                        <span className="text-[10px] text-ink-4">
                          +{c.tags.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-[10px] text-right mono">
                    {c.visitCount}
                  </td>
                  <td className="px-3 py-[10px] text-right mono">
                    {euros.format(c.totalSpent)}
                  </td>
                  <td className="px-3 py-[10px] text-ink-3">
                    {relativeDate(c.lastVisit)}
                  </td>
                  <td className="px-3 py-[10px]">
                    {c.optedInEmail ? (
                      <Mail size={13} className="text-ok" />
                    ) : (
                      <MailX size={13} className="text-ink-4" />
                    )}
                  </td>
                  <td
                    className="px-3 py-[10px] text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => onEdit(c)}
                      className="icon-btn !w-7 !h-7"
                      aria-label="Modifier"
                    >
                      <Pencil size={11} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-[11.5px] text-ink-3">
        <div className="mono">
          Page {customers.page + 1} / {customers.totalPages} · {customers.total}{" "}
          client(s)
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => customers.setPage(Math.max(0, customers.page - 1))}
            disabled={customers.page === 0}
            className="icon-btn !w-7 !h-7 disabled:opacity-40"
            aria-label="Précédent"
          >
            <ChevronLeft size={13} />
          </button>
          <button
            type="button"
            onClick={() =>
              customers.setPage(
                Math.min(customers.totalPages - 1, customers.page + 1)
              )
            }
            disabled={customers.page >= customers.totalPages - 1}
            className="icon-btn !w-7 !h-7 disabled:opacity-40"
            aria-label="Suivant"
          >
            <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </>
  );
}

// =============================================================
// Onglet Campagnes
// =============================================================
function CampagnesTab({
  campaigns,
  onEdit,
}: {
  campaigns: ReturnType<typeof useCampaigns>;
  onEdit: (c: Campaign) => void;
}) {
  const sentCount = campaigns.campaigns.filter(
    (c) => c.status === "sent"
  ).length;
  const totalRecipients = campaigns.campaigns.reduce(
    (s, c) => s + c.recipientCount,
    0
  );
  const totalOpens = campaigns.campaigns.reduce((s, c) => s + c.openCount, 0);
  const openRate =
    totalRecipients > 0
      ? Math.round((totalOpens / totalRecipients) * 100)
      : 0;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Kpi
          icon={Mail}
          label="Campagnes envoyées"
          value={`${sentCount}`}
          hint={`${campaigns.campaigns.length} au total`}
        />
        <Kpi
          icon={Send}
          label="Destinataires"
          value={`${totalRecipients}`}
          hint="Cumulés"
        />
        <Kpi
          icon={Zap}
          label="Taux d'ouverture"
          value={`${openRate}%`}
          hint={`${totalOpens} ouvertures`}
        />
        <Kpi
          icon={Workflow}
          label="Brouillons"
          value={`${campaigns.campaigns.filter((c) => c.status === "draft").length}`}
          hint="À finaliser"
        />
      </div>

      <div className="border border-line rounded-[12px] overflow-hidden bg-bg-1">
        <table className="w-full text-[12.5px]">
          <thead className="bg-bg-2 border-b border-line">
            <tr>
              <Th>Sujet</Th>
              <Th>Type</Th>
              <Th>Statut</Th>
              <Th align="right">Destinataires</Th>
              <Th align="right">Ouvertures</Th>
              <Th>Date</Th>
              <Th align="right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {campaigns.loading ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-ink-4">
                  Chargement…
                </td>
              </tr>
            ) : campaigns.campaigns.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-ink-4 italic">
                  Aucune campagne. Créez la première !
                </td>
              </tr>
            ) : (
              campaigns.campaigns.map((c) => {
                const openRate =
                  c.recipientCount > 0
                    ? Math.round((c.openCount / c.recipientCount) * 100)
                    : 0;
                return (
                  <tr
                    key={c.id}
                    className="border-b border-line last:border-b-0 hover:bg-bg-2 cursor-pointer transition-colors"
                    onClick={() => onEdit(c)}
                  >
                    <td className="px-3 py-[10px]">
                      <div className="font-semibold text-ink-1 truncate max-w-[260px]">
                        {c.subject || "Sans sujet"}
                      </div>
                      <div className="text-[10.5px] text-ink-4 truncate max-w-[260px]">
                        {c.content.title}
                      </div>
                    </td>
                    <td className="px-3 py-[10px] text-ink-2">
                      {CAMPAIGN_TYPE_LABEL[c.type]}
                    </td>
                    <td className="px-3 py-[10px]">
                      <span
                        className="inline-block px-[6px] py-[2px] rounded-full text-[10px] font-semibold uppercase tracking-wider"
                        style={{
                          background: `${CAMPAIGN_STATUS_COLOR[c.status]}22`,
                          color: CAMPAIGN_STATUS_COLOR[c.status],
                        }}
                      >
                        {CAMPAIGN_STATUS_LABEL[c.status]}
                      </span>
                    </td>
                    <td className="px-3 py-[10px] text-right mono">
                      {c.recipientCount}
                    </td>
                    <td className="px-3 py-[10px] text-right mono">
                      {c.openCount > 0 ? `${openRate}%` : "—"}
                    </td>
                    <td className="px-3 py-[10px] text-ink-3">
                      {relativeDate(c.sentAt ?? c.createdAt)}
                    </td>
                    <td
                      className="px-3 py-[10px] text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => onEdit(c)}
                        className="icon-btn !w-7 !h-7"
                        aria-label="Modifier"
                      >
                        <Pencil size={11} />
                      </button>
                      {c.status === "draft" && (
                        <button
                          type="button"
                          onClick={() => campaigns.removeCampaign(c.id)}
                          className="icon-btn !w-7 !h-7 ml-1 hover:!text-danger"
                          aria-label="Supprimer"
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

// =============================================================
// Onglet Automatisations (UI-only, à venir)
// =============================================================
function AutomatisationsTab() {
  const items: { title: string; desc: string; trigger: string }[] = [
    {
      title: "Anniversaire client",
      desc: "Envoie une attention le jour anniversaire du client.",
      trigger: "Date de naissance · 9h00",
    },
    {
      title: "Réactivation 90 jours",
      desc: "Recontacte les clients sans visite depuis 90 jours.",
      trigger: "Inactivité ≥ 90 jours",
    },
    {
      title: "Nouveau palier fidélité",
      desc: "Félicite le client lorsqu'il passe Argent ou Or.",
      trigger: "Changement de palier",
    },
    {
      title: "Bienvenue",
      desc: "Email de bienvenue après l'inscription au programme fidélité.",
      trigger: "Inscription fidélité",
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="p-4 rounded-[12px] border border-ember/30 bg-ember/5 flex items-start gap-3">
        <Workflow className="text-ember-soft flex-shrink-0 mt-[2px]" size={18} />
        <div>
          <div className="text-[13px] font-semibold text-ink-1 mb-1">
            Bientôt disponible
          </div>
          <p className="text-[12px] text-ink-3 leading-relaxed">
            Les automatisations vous permettront de déclencher des emails sur
            événement client (anniversaire, inactivité, nouveau palier…). Cette
            fonctionnalité est en cours de finalisation.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {items.map((it) => (
          <div
            key={it.title}
            className="p-4 rounded-[12px] border border-line bg-bg-1 flex flex-col gap-2 opacity-70"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="text-[13px] font-semibold text-ink-1">
                {it.title}
              </div>
              <span className="px-2 py-[2px] bg-bg-2 border border-line rounded-full text-[10px] text-ink-3">
                À venir
              </span>
            </div>
            <p className="text-[11.5px] text-ink-3 leading-relaxed">
              {it.desc}
            </p>
            <div className="flex items-center gap-1 text-[11px] text-ink-4 mt-1">
              <Zap size={11} />
              <span className="mono">{it.trigger}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================
// Helpers
// =============================================================
function Th({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={cn(
        "px-3 py-[8px] text-[10.5px] font-semibold uppercase tracking-wider text-ink-3",
        align === "right" ? "text-right" : "text-left"
      )}
    >
      {children}
    </th>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="p-4 rounded-[12px] border border-line bg-bg-1">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={13} className="text-ink-4" />
        <span className="chip-uppercase">{label}</span>
      </div>
      <div className="display text-[24px] font-medium leading-tight">
        {value}
      </div>
      <div className="text-[11px] text-ink-4 mt-1">{hint}</div>
    </div>
  );
}
