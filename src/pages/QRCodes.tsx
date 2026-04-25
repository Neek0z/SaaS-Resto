import { useMemo, useState } from "react";
import {
  Check,
  Copy,
  Download,
  FileImage,
  FileText,
  Heart,
  Package,
  Plus,
  QrCode as QrCodeIcon,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import JSZip from "jszip";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useQRCode, type QROptions } from "@/hooks/useQRCode";
import { useTables } from "@/hooks/useTables";
import { publicLoyaltyUrl, publicMenuUrl, slugify } from "@/lib/slug";
import { cn } from "@/lib/utils";
import { PlanGate } from "@/components/PlanGate";
import { QRPreview } from "@/components/qrcode/QRPreview";
import { NewTableModal } from "@/components/qrcode/NewTableModal";

type ECL = "L" | "M" | "H";

export default function QRCodes() {
  const { restaurant } = useAuth();
  const slug = useMemo(
    () => (restaurant?.name ? slugify(restaurant.name) : "demo"),
    [restaurant?.name]
  );
  const restaurantName = restaurant?.name ?? "Maison Sévère";

  const [color, setColor] = useState("#100d0a");
  const [background, setBackground] = useState("#ffffff");
  const [ecl, setEcl] = useState<ECL>("M");

  const options: QROptions = useMemo(
    () => ({ color, background, errorCorrectionLevel: ecl }),
    [color, background, ecl]
  );

  return (
    <>
      <div className="flex items-end justify-between mb-5 pt-2">
        <div>
          <div className="chip-uppercase mb-1">Diffusion · QR codes</div>
          <h2 className="display font-medium text-[26px] leading-tight m-0">
            Vos QR codes <em className="not-italic italic text-ember-soft font-normal">imprimables</em>
          </h2>
        </div>
      </div>

      {/* Personnalisation */}
      <Card className="mb-5">
        <CardHeader>
          <CardTitle>Personnalisation</CardTitle>
          <span className="text-[11px] text-ink-4 mono uppercase tracking-[0.08em]">
            Aperçu en direct
          </span>
        </CardHeader>
        <div className="grid grid-cols-12 gap-4 items-start">
          <div className="col-span-3">
            <label className="chip-uppercase block mb-[6px]">Couleur du QR</label>
            <ColorField value={color} onChange={setColor} />
          </div>
          <div className="col-span-3">
            <label className="chip-uppercase block mb-[6px]">Couleur de fond</label>
            <ColorField value={background} onChange={setBackground} />
          </div>
          <div className="col-span-6">
            <label className="chip-uppercase block mb-[6px]">Correction d'erreur</label>
            <div className="segmented">
              {(["L", "M", "H"] as const).map((level) => (
                <button
                  key={level}
                  className={cn(ecl === level && "active")}
                  onClick={() => setEcl(level)}
                  type="button"
                >
                  {level === "L"
                    ? "Basse · 7%"
                    : level === "M"
                    ? "Moyenne · 15%"
                    : "Haute · 30%"}
                </button>
              ))}
            </div>
            <div className="text-[11px] text-ink-4 mt-2">
              Plus la correction est haute, plus le QR reste lisible même abîmé. Idéal pour
              l'impression sur table.
            </div>
          </div>
        </div>
      </Card>

      {/* Section 1 — Carte digitale */}
      <SingleQRSection
        icon={<UtensilsCrossed size={14} />}
        title="Carte digitale"
        subtitle="Un QR code unique pour la salle"
        url={publicMenuUrl(slug)}
        filename={`carte-${slug}`}
        sublabel={restaurantName}
        options={options}
      />

      {/* Section 2 — Tables */}
      <TablesSection slug={slug} options={options} />

      {/* Section 3 — Fidélité (gated) */}
      <PlanGate feature="fidelite" requiredPlan="pro">
        <SingleQRSection
          icon={<Heart size={14} />}
          title="Programme fidélité"
          subtitle="Pour inscrire les clients en un scan"
          url={publicLoyaltyUrl(slug)}
          filename={`fidelite-${slug}`}
          sublabel={restaurantName}
          options={options}
          tone="ember"
        />
      </PlanGate>
    </>
  );
}

// ---------------------------------------------------------------
// Section : un seul QR (carte ou fidélité)
// ---------------------------------------------------------------
function SingleQRSection({
  icon,
  title,
  subtitle,
  url,
  filename,
  sublabel,
  options,
  tone = "cream",
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  url: string;
  filename: string;
  sublabel: string;
  options: QROptions;
  tone?: "cream" | "ember";
}) {
  const { downloadPNG, downloadSVG } = useQRCode();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard refusée, on ignore.
    }
  };

  return (
    <Card className="mb-5">
      <CardHeader>
        <CardTitle>
          <span className="inline-flex items-center gap-2">
            <span className={cn("inline-grid place-items-center w-[20px] h-[20px] rounded-md", tone === "ember" ? "bg-ember/15 text-ember-soft" : "bg-bg-3 text-ink-2")}>
              {icon}
            </span>
            {title}
          </span>
        </CardTitle>
        <span className="text-[11px] text-ink-4 mono uppercase tracking-[0.08em]">
          {subtitle}
        </span>
      </CardHeader>

      <div className="grid items-center gap-5" style={{ gridTemplateColumns: "auto 1fr" }}>
        <div className="flex flex-col items-center gap-2">
          <QRPreview url={url} size={256} options={options} />
          <div className="text-[12.5px] font-semibold text-ink-1 text-center max-w-[256px] truncate">
            {sublabel}
          </div>
        </div>

        <div className="flex flex-col gap-3 min-w-0">
          <div>
            <div className="chip-uppercase mb-1">Lien public</div>
            <code className="block text-[12px] mono text-ink-2 bg-bg-2 border border-line rounded-[10px] px-3 py-[9px] break-all">
              {url}
            </code>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="btn-primary inline-flex items-center gap-2"
              onClick={() => void downloadPNG(url, `${filename}.png`, 512, options)}
              type="button"
            >
              <FileImage size={13} />
              Télécharger PNG
            </button>
            <button
              className="btn-ghost inline-flex items-center gap-2"
              onClick={() => void downloadSVG(url, `${filename}.svg`, options)}
              type="button"
            >
              <FileText size={13} />
              Télécharger SVG
            </button>
            <button
              className="btn-ghost inline-flex items-center gap-2"
              onClick={() => void copy()}
              type="button"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? "Lien copié" : "Copier le lien"}
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------
// Section : QR par table
// ---------------------------------------------------------------
function TablesSection({
  slug,
  options,
}: {
  slug: string;
  options: QROptions;
}) {
  const { restaurant } = useAuth();
  const { tables, addTable, removeTable } = useTables(restaurant?.id ?? null);
  const { downloadPNG, generateBlob } = useQRCode();
  const [open, setOpen] = useState(false);
  const [zipping, setZipping] = useState(false);
  const [zipError, setZipError] = useState<string | null>(null);

  const numbers = useMemo(() => tables.map((t) => t.number), [tables]);

  const downloadAll = async () => {
    if (tables.length === 0) return;
    setZipError(null);
    setZipping(true);
    try {
      const zip = new JSZip();
      for (const t of tables) {
        const url = publicMenuUrl(slug, t.number);
        const blob = await generateBlob(url, 512, options);
        zip.file(`table-${t.number}.png`, blob);
      }
      const archive = await zip.generateAsync({ type: "blob" });
      const href = URL.createObjectURL(archive);
      const a = document.createElement("a");
      a.href = href;
      a.download = `qrcodes-tables-${slug}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(href), 1500);
    } catch (e) {
      setZipError(e instanceof Error ? e.message : "Échec de la génération du ZIP.");
    } finally {
      setZipping(false);
    }
  };

  return (
    <>
      <Card className="mb-5">
        <CardHeader>
          <CardTitle>
            <span className="inline-flex items-center gap-2">
              <span className="inline-grid place-items-center w-[20px] h-[20px] rounded-md bg-bg-3 text-ink-2">
                <QrCodeIcon size={14} />
              </span>
              QR par table
              <span className="text-ember-soft">· {tables.length}</span>
            </span>
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            <button
              className="btn-ghost inline-flex items-center gap-2"
              onClick={() => setOpen(true)}
              type="button"
            >
              <Plus size={13} />
              Ajouter une table
            </button>
            <button
              className="btn-primary inline-flex items-center gap-2"
              onClick={() => void downloadAll()}
              disabled={tables.length === 0 || zipping}
              type="button"
            >
              <Package size={13} />
              {zipping ? "Génération…" : "Tout télécharger (ZIP)"}
            </button>
          </div>
        </CardHeader>

        {zipError && (
          <div className="mb-3 text-[12px] text-danger">{zipError}</div>
        )}

        {tables.length === 0 ? (
          <div className="py-12 text-center text-ink-4 text-[13px] italic">
            Aucune table.<br />
            Ajoutez votre première table pour générer un QR code dédié.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {tables.map((t) => {
              const url = publicMenuUrl(slug, t.number);
              return (
                <div
                  key={t.id}
                  className="group bg-bg-2 border border-line rounded-[12px] p-3 flex flex-col items-center gap-2 transition-all hover:border-line-2"
                >
                  <QRPreview url={url} size={128} options={options} />
                  <div className="text-center w-full">
                    <div className="text-[13px] font-semibold text-ink-1 leading-tight">
                      Table {t.number}
                    </div>
                    <div className="text-[10.5px] mono text-ink-4 mt-[2px]">
                      {t.capacity} couvert{t.capacity > 1 ? "s" : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <button
                      className="icon-btn w-[26px] h-[26px]"
                      onClick={() =>
                        void downloadPNG(url, `table-${t.number}.png`, 512, options)
                      }
                      title="Télécharger PNG"
                      type="button"
                    >
                      <Download size={12} />
                    </button>
                    <button
                      className="icon-btn w-[26px] h-[26px] hover:text-danger"
                      onClick={() => removeTable(t.id)}
                      title="Supprimer"
                      type="button"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <NewTableModal
        open={open}
        onClose={() => setOpen(false)}
        onCreate={addTable}
        existingNumbers={numbers}
      />
    </>
  );
}

// ---------------------------------------------------------------
// Champ couleur (input color + hex)
// ---------------------------------------------------------------
function ColorField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 bg-bg-2 border border-line rounded-[10px] px-2 py-[6px]">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-[28px] h-[24px] rounded-[6px] border border-line bg-transparent cursor-pointer p-0"
        style={{ appearance: "none" }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-transparent border-0 outline-none text-[12px] mono text-ink-1 uppercase"
      />
    </div>
  );
}
