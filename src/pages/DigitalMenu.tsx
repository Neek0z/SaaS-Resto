import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Copy, Download, ExternalLink, Eye, QrCode, Pencil } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useMenu } from "@/hooks/useMenu";
import { useQRCode } from "@/hooks/useQRCode";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { QRPreview } from "@/components/menu-digital/QRPreview";
import { PhonePreview } from "@/components/menu-digital/PhonePreview";
import { cn } from "@/lib/utils";

function buildPublicUrl(slug: string): string {
  if (typeof window === "undefined") return `/carte/${slug}`;
  return `${window.location.origin}/carte/${slug}`;
}

export default function DigitalMenu() {
  const { restaurant } = useAuth();
  const { categories, items, loading } = useMenu();
  const { downloadPNG, downloadSVG } = useQRCode();
  const [copied, setCopied] = useState(false);

  const slug = restaurant?.slug ?? null;
  const publicUrl = slug ? buildPublicUrl(slug) : "";
  const restaurantName = restaurant?.name ?? "Mon restaurant";
  const logoUrl = restaurant?.logoUrl ?? null;

  const stats = useMemo(() => {
    const activeCats = categories.filter((c) => c.active).length;
    const totalItems = items.length;
    const availableItems = items.filter((i) => i.available).length;
    return { activeCats, totalItems, availableItems };
  }, [categories, items]);

  const copy = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  if (!restaurant) {
    return <div className="py-16 text-center text-ink-3 text-[13px]">Chargement…</div>;
  }

  if (!slug) {
    return (
      <div className="py-16 text-center text-ink-3 text-[13px]">
        Aucun slug n&apos;est défini pour ce restaurant. Contactez le support.
      </div>
    );
  }

  const fileBase = `menu-${slug}`;

  return (
    <>
      <div className="flex items-end justify-between mb-5 pt-2">
        <div>
          <div className="chip-uppercase mb-1">Menu numérique · public</div>
          <h2 className="display font-medium text-[26px] leading-tight m-0">
            Menu <em className="not-italic italic text-ember-soft font-normal">à table</em> & QR
          </h2>
        </div>
        <div className="flex gap-2">
          <Link to="/menu" className="btn-ghost inline-flex items-center gap-2">
            <Pencil size={13} />
            Éditer le menu
          </Link>
          <a
            href={publicUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-primary inline-flex items-center gap-2"
          >
            <ExternalLink size={13} />
            Voir en ligne
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-12 gap-4 mb-4">
        <StatTile
          className="col-span-4"
          label="Catégories actives"
          value={stats.activeCats}
          hint={`${categories.length} au total`}
          tone="ember"
        />
        <StatTile
          className="col-span-4"
          label="Plats au menu"
          value={stats.totalItems}
          hint="Tous statuts confondus"
          tone="cream"
        />
        <StatTile
          className="col-span-4"
          label="Plats disponibles"
          value={stats.availableItems}
          hint={`${stats.totalItems - stats.availableItems} en rupture`}
          tone="ok"
        />
      </div>

      {/* QR + URL + preview */}
      <div className="grid grid-cols-12 gap-4 mb-4">
        <Card className="col-span-5">
          <CardHeader>
            <CardTitle>
              QR code · <span className="text-ember-soft">accès direct</span>
            </CardTitle>
            <span className="channel-pill" style={{ color: "var(--ok)" }}>
              ● En ligne
            </span>
          </CardHeader>

          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-cream rounded-[16px] border border-line-2">
              <QRPreview value={publicUrl} size={200} />
            </div>

            <div className="w-full">
              <div className="chip-uppercase mb-2">URL publique</div>
              <div className="flex items-center gap-2 bg-bg-2 border border-line rounded-[10px] px-3 py-[9px]">
                <QrCode size={14} className="text-ink-3" />
                <input
                  readOnly
                  value={publicUrl}
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
              <button
                className="btn-ghost flex-1 inline-flex items-center justify-center gap-2"
                onClick={() =>
                  downloadPNG(publicUrl, `${fileBase}.png`, 1024, {
                    color: "#14110e",
                    background: "#ffffff",
                    margin: 2,
                  })
                }
              >
                <Download size={13} />
                PNG
              </button>
              <button
                className="btn-ghost flex-1 inline-flex items-center justify-center gap-2"
                onClick={() =>
                  downloadSVG(publicUrl, `${fileBase}.svg`, {
                    color: "#14110e",
                    background: "#ffffff",
                    margin: 2,
                  })
                }
              >
                <Download size={13} />
                SVG
              </button>
            </div>
          </div>
        </Card>

        <Card className="col-span-7">
          <CardHeader>
            <CardTitle>
              Aperçu · <span className="text-ember-soft">mobile</span>
            </CardTitle>
            <span className="text-[11px] text-ink-4 mono uppercase tracking-[0.08em]">
              <Eye size={11} className="inline mr-1" />
              {stats.activeCats} catégories · {stats.totalItems} plats
            </span>
          </CardHeader>

          <div className="py-4 bg-[radial-gradient(ellipse_at_center,rgba(198,93,26,0.08),transparent_60%)] rounded-[14px]">
            {loading ? (
              <div className="text-center text-ink-3 text-[12px] py-12">Chargement…</div>
            ) : (
              <PhonePreview
                restaurantName={restaurantName}
                logoUrl={logoUrl}
                url={publicUrl.replace(/^https?:\/\//, "")}
                categories={categories}
                items={items}
              />
            )}
          </div>
        </Card>
      </div>

      {/* Categories summary */}
      <Card>
        <CardHeader>
          <CardTitle>
            Catégories · <span className="text-ember-soft">structure du menu</span>
          </CardTitle>
          <Link to="/menu" className="btn-ghost inline-flex items-center gap-2">
            <Pencil size={12} />
            Gérer le menu
          </Link>
        </CardHeader>

        <div className="flex flex-col gap-0">
          {categories.length === 0 ? (
            <div className="py-6 text-center text-ink-3 text-[12px] italic">
              Aucune catégorie. <Link to="/menu" className="text-ember-soft underline">Créez-en une</Link>.
            </div>
          ) : (
            categories
              .slice()
              .sort((a, b) => a.position - b.position)
              .map((cat) => {
                const catItems = items.filter((i) => i.categoryId === cat.id);
                return (
                  <div
                    key={cat.id}
                    className={cn(
                      "grid items-center gap-4 py-3 border-b border-line last:border-b-0",
                      !cat.active && "opacity-60"
                    )}
                    style={{ gridTemplateColumns: "180px 60px 1fr auto" }}
                  >
                    <div className="chip-uppercase text-[11px] !text-ink-2 truncate">
                      {cat.name}
                      {!cat.active && (
                        <span className="ml-[6px] text-amber">· masquée</span>
                      )}
                    </div>
                    <div className="mono text-[13px] text-ink-2">{catItems.length}</div>
                    <div className="text-[12px] text-ink-3 truncate">
                      {catItems.map((i) => i.name).join(" · ") || "—"}
                    </div>
                    <Link
                      to="/menu"
                      className="btn-ghost inline-flex items-center gap-1 text-[11.5px]"
                    >
                      <Pencil size={11} />
                      Éditer
                    </Link>
                  </div>
                );
              })
          )}
        </div>
      </Card>
    </>
  );
}

function StatTile({
  label,
  value,
  hint,
  tone,
  className,
}: {
  label: string;
  value: string | number;
  hint: string;
  tone: "ember" | "ok" | "danger" | "cream";
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
