import { useEffect, useState } from "react";
import { Copy, Download, ExternalLink, Eye, QrCode, Pencil } from "lucide-react";
import { getDigitalMenu } from "@/lib/api/digital-menu";
import type { DigitalMenuCategory, DigitalMenuConfig } from "@/lib/mock-data";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { QRPreview } from "@/components/menu-digital/QRPreview";
import { PhonePreview } from "@/components/menu-digital/PhonePreview";
import { CategoryEditModal } from "@/components/menu-digital/CategoryEditModal";
import { Delta } from "@/components/dashboard/Delta";
import { cn } from "@/lib/utils";

export default function DigitalMenu() {
  const [menu, setMenu] = useState<DigitalMenuConfig | null>(null);
  const [copied, setCopied] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => setMenu(await getDigitalMenu()))();
  }, []);

  const editing = menu?.categories.find((c) => c.id === editingId) ?? null;

  const saveCategory = (updated: DigitalMenuCategory) => {
    setMenu((prev) =>
      prev
        ? { ...prev, categories: prev.categories.map((c) => (c.id === updated.id ? updated : c)) }
        : prev
    );
  };

  if (!menu) {
    return <div className="py-16 text-center text-ink-3 text-[13px]">Chargement…</div>;
  }

  const copy = () => {
    navigator.clipboard.writeText(`https://${menu.url}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const totalItems = menu.categories.reduce((s, c) => s + c.items.length, 0);

  return (
    <>
      <div className="flex items-end justify-between mb-5 pt-2">
        <div>
          <div className="chip-uppercase mb-1">
            Menu numérique · {menu.published ? "Publié" : "Brouillon"}
          </div>
          <h2 className="display font-medium text-[26px] leading-tight m-0">
            Menu <em className="not-italic italic text-ember-soft font-normal">à table</em> & QR
          </h2>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost inline-flex items-center gap-2">
            <Pencil size={13} />
            Éditer le menu
          </button>
          <button className="btn-primary inline-flex items-center gap-2">
            <ExternalLink size={13} />
            Voir en ligne
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-12 gap-4 mb-4">
        <StatTile
          className="col-span-3"
          label="Scans · aujourd'hui"
          value={menu.scansToday}
          delta={menu.scansDelta}
          hint="Scans QR en salle"
          tone="ember"
        />
        <StatTile
          className="col-span-3"
          label="Scans · 7 jours"
          value={menu.scansWeek}
          hint="Semaine glissante"
          tone="cream"
        />
        <StatTile
          className="col-span-3"
          label="Temps moyen"
          value={menu.avgTime}
          hint="Durée de consultation"
          tone="ok"
        />
        <StatTile
          className="col-span-3"
          label="Conversion"
          value={`${menu.conversion}%`}
          hint="Scan → commande validée"
          tone="ember"
        />
      </div>

      {/* QR + URL + preview */}
      <div className="grid grid-cols-12 gap-4 mb-4">
        {/* Left: QR + URL */}
        <Card className="col-span-5">
          <CardHeader>
            <CardTitle>
              QR code · <span className="text-ember-soft">accès direct</span>
            </CardTitle>
            <span
              className={cn(
                "channel-pill",
                menu.published ? "text-ok" : "text-amber"
              )}
              style={{ color: menu.published ? "var(--ok)" : "var(--amber)" }}
            >
              {menu.published ? "● En ligne" : "○ Brouillon"}
            </span>
          </CardHeader>

          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-cream rounded-[16px] border border-line-2">
              <QRPreview value={`https://${menu.url}`} size={200} />
            </div>

            <div className="w-full">
              <div className="chip-uppercase mb-2">URL publique</div>
              <div className="flex items-center gap-2 bg-bg-2 border border-line rounded-[10px] px-3 py-[9px]">
                <QrCode size={14} className="text-ink-3" />
                <input
                  readOnly
                  value={`https://${menu.url}`}
                  className="flex-1 bg-transparent border-0 outline-none text-ink-1 mono text-[12px]"
                />
                <button
                  className="text-ink-3 hover:text-ink-1 transition-colors"
                  onClick={copy}
                  title="Copier"
                >
                  <Copy size={13} />
                </button>
              </div>
              {copied && (
                <div className="text-[10.5px] text-ok mt-1 mono">✓ Copié dans le presse-papier</div>
              )}
            </div>

            <div className="flex gap-2 w-full">
              <button className="btn-ghost flex-1 inline-flex items-center justify-center gap-2">
                <Download size={13} />
                PNG
              </button>
              <button className="btn-ghost flex-1 inline-flex items-center justify-center gap-2">
                <Download size={13} />
                SVG
              </button>
              <button className="btn-ghost flex-1 inline-flex items-center justify-center gap-2">
                <Download size={13} />
                Affiche
              </button>
            </div>
          </div>
        </Card>

        {/* Right: Phone preview */}
        <Card className="col-span-7">
          <CardHeader>
            <CardTitle>
              Aperçu · <span className="text-ember-soft">mobile</span>
            </CardTitle>
            <span className="text-[11px] text-ink-4 mono uppercase tracking-[0.08em]">
              <Eye size={11} className="inline mr-1" />
              {menu.categories.length} catégories · {totalItems} plats
            </span>
          </CardHeader>

          <div className="py-4 bg-[radial-gradient(ellipse_at_center,rgba(198,93,26,0.08),transparent_60%)] rounded-[14px]">
            <PhonePreview menu={menu} />
          </div>
        </Card>
      </div>

      {/* Categories summary */}
      <Card>
        <CardHeader>
          <CardTitle>
            Catégories · <span className="text-ember-soft">structure du menu</span>
          </CardTitle>
          <button className="btn-ghost inline-flex items-center gap-2">
            <Pencil size={12} />
            Réorganiser
          </button>
        </CardHeader>

        <div className="flex flex-col gap-0">
          {menu.categories.map((cat) => (
            <div
              key={cat.id}
              className="grid items-center gap-4 py-3 border-b border-line last:border-b-0"
              style={{ gridTemplateColumns: "140px 60px 1fr auto" }}
            >
              <div className="chip-uppercase text-[11px] !text-ink-2">{cat.name}</div>
              <div className="mono text-[13px] text-ink-2">{cat.items.length}</div>
              <div className="text-[12px] text-ink-3 truncate">
                {cat.items.map((i) => i.name).join(" · ")}
              </div>
              <button
                className="btn-ghost inline-flex items-center gap-1 text-[11.5px]"
                onClick={() => setEditingId(cat.id)}
              >
                <Pencil size={11} />
                Éditer
              </button>
            </div>
          ))}
        </div>
      </Card>

      <CategoryEditModal
        category={editing}
        onClose={() => setEditingId(null)}
        onSave={saveCategory}
      />
    </>
  );
}

function StatTile({
  label,
  value,
  hint,
  tone,
  delta,
  className,
}: {
  label: string;
  value: string | number;
  hint: string;
  tone: "ember" | "ok" | "danger" | "cream";
  delta?: number;
  className?: string;
}) {
  const toneColor =
    tone === "ember"
      ? "var(--ember-soft)"
      : tone === "ok"
      ? "var(--ok)"
      : tone === "danger"
      ? "var(--danger)"
      : "var(--ink-1)";
  return (
    <div className={cn("kpi", className)}>
      <div className="flex items-start justify-between">
        <div className="chip-uppercase">{label}</div>
        {delta !== undefined && <Delta value={delta} />}
      </div>
      <div
        className="display font-medium text-[32px] leading-none mt-[12px] mb-[8px]"
        style={{ color: toneColor }}
      >
        {value}
      </div>
      <div className="text-[11.5px] text-ink-3">{hint}</div>
    </div>
  );
}
