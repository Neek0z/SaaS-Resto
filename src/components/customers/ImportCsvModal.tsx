import { useMemo, useState } from "react";
import { Check, FileUp, Upload, X } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import type { ImportReport, ImportRow } from "@/lib/api/customers-db";

function parseCSV(text: string): ImportRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  // Détection du séparateur
  const firstLine = lines[0];
  const sep = firstLine.includes(";")
    ? ";"
    : firstLine.includes("\t")
      ? "\t"
      : ",";

  const splitLine = (line: string): string[] => {
    const out: string[] = [];
    let cur = "";
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuote = !inQuote;
        }
      } else if (ch === sep && !inQuote) {
        out.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
    out.push(cur);
    return out.map((s) => s.trim());
  };

  const header = splitLine(lines[0]).map((h) => h.toLowerCase());
  const idx = (names: string[]): number => {
    for (const n of names) {
      const i = header.indexOf(n);
      if (i !== -1) return i;
    }
    return -1;
  };
  const iName = idx(["name", "nom", "prénom", "prenom", "client"]);
  const iEmail = idx(["email", "e-mail", "courriel"]);
  const iPhone = idx(["phone", "tel", "téléphone", "telephone", "mobile"]);
  const iTags = idx(["tags", "tag", "étiquettes", "etiquettes"]);

  const out: ImportRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitLine(lines[i]);
    const name = iName >= 0 ? cols[iName] ?? "" : cols[0] ?? "";
    if (!name.trim()) continue;
    const email = iEmail >= 0 ? cols[iEmail]?.trim() || null : null;
    const phone = iPhone >= 0 ? cols[iPhone]?.trim() || null : null;
    const tagsRaw = iTags >= 0 ? cols[iTags] ?? "" : "";
    const tags = tagsRaw
      .split(/[|,;]/)
      .map((t) => t.trim())
      .filter(Boolean);
    out.push({ name: name.trim(), email, phone, tags });
  }
  return out;
}

export function ImportCsvModal({
  open,
  onClose,
  onImport,
}: {
  open: boolean;
  onClose: () => void;
  onImport: (rows: ImportRow[]) => Promise<ImportReport>;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setFile(null);
    setRows([]);
    setReport(null);
    setError(null);
    setSubmitting(false);
  };

  const handleFile = async (f: File) => {
    setFile(f);
    setError(null);
    setReport(null);
    try {
      const text = await f.text();
      const parsed = parseCSV(text);
      if (parsed.length === 0) {
        setError("Aucune ligne valide détectée dans le fichier.");
        setRows([]);
        return;
      }
      setRows(parsed);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de la lecture.");
    }
  };

  const submit = async () => {
    if (rows.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const r = await onImport(rows);
      setReport(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de l'import.");
    } finally {
      setSubmitting(false);
    }
  };

  const preview = useMemo(() => rows.slice(0, 5), [rows]);

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      width={620}
      title="Importer des clients (CSV)"
      subtitle="Format attendu : name, email, phone, tags (séparés par |)"
      footer={
        report ? (
          <div className="flex justify-end">
            <button
              className="btn-primary"
              onClick={() => {
                reset();
                onClose();
              }}
              type="button"
            >
              Fermer
            </button>
          </div>
        ) : (
          <div className="flex justify-end gap-2">
            <button
              className="btn-ghost"
              onClick={() => {
                reset();
                onClose();
              }}
              type="button"
            >
              Annuler
            </button>
            <button
              className="btn-primary inline-flex items-center gap-2"
              onClick={submit}
              disabled={rows.length === 0 || submitting}
              type="button"
            >
              <Upload size={13} />
              {submitting ? "Import…" : `Importer ${rows.length} client(s)`}
            </button>
          </div>
        )
      }
    >
      {report ? (
        <div className="text-center py-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-ok/15 text-ok mb-3">
            <Check size={20} />
          </div>
          <div className="display text-[18px] font-medium mb-2">
            Import terminé
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4 max-w-md mx-auto">
            <ReportStat label="Ajoutés" value={report.inserted} color="var(--ok)" />
            <ReportStat label="Mis à jour" value={report.updated} color="var(--ember-soft)" />
            <ReportStat label="Ignorés" value={report.skipped} color="var(--ink-3)" />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <label
            className={`block p-6 border-2 border-dashed rounded-[12px] text-center cursor-pointer transition-colors ${
              file ? "border-ember/40 bg-ember/5" : "border-line hover:border-line-2"
            }`}
          >
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFile(f);
              }}
            />
            <FileUp className="mx-auto mb-2 text-ink-3" size={28} />
            {file ? (
              <div>
                <div className="text-[13px] font-semibold text-ink-1">
                  {file.name}
                </div>
                <div className="text-[11px] text-ink-3 mt-1">
                  {rows.length} ligne(s) détectée(s) · cliquez pour changer
                </div>
              </div>
            ) : (
              <div>
                <div className="text-[13px] font-semibold text-ink-1">
                  Cliquez pour sélectionner un fichier CSV
                </div>
                <div className="text-[11px] text-ink-3 mt-1">
                  Encodage UTF-8 · séparateur , ou ;
                </div>
              </div>
            )}
          </label>

          {preview.length > 0 && (
            <div>
              <div className="chip-uppercase mb-2">Aperçu (5 premières lignes)</div>
              <div className="border border-line rounded-[10px] overflow-hidden">
                <table className="w-full text-[11.5px]">
                  <thead className="bg-bg-2">
                    <tr>
                      <th className="text-left px-3 py-[7px] font-semibold text-ink-3">Nom</th>
                      <th className="text-left px-3 py-[7px] font-semibold text-ink-3">Email</th>
                      <th className="text-left px-3 py-[7px] font-semibold text-ink-3">Tél.</th>
                      <th className="text-left px-3 py-[7px] font-semibold text-ink-3">Tags</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((r, i) => (
                      <tr key={i} className="border-t border-line">
                        <td className="px-3 py-[7px] text-ink-1">{r.name}</td>
                        <td className="px-3 py-[7px] text-ink-2 mono">{r.email ?? "—"}</td>
                        <td className="px-3 py-[7px] text-ink-2 mono">{r.phone ?? "—"}</td>
                        <td className="px-3 py-[7px] text-ink-3">
                          {r.tags.length > 0 ? r.tags.join(", ") : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="text-[10.5px] text-ink-4 leading-relaxed bg-bg-2 border border-line rounded-[10px] p-3">
            <strong className="text-ink-3">RGPD :</strong> en important ces
            contacts, vous certifiez disposer du consentement explicite des
            personnes pour les contacter à des fins marketing. Les doublons
            (par email) sont automatiquement fusionnés.
          </div>

          {error && (
            <div className="flex items-start gap-2 text-[12px] text-danger bg-danger/10 border border-danger/30 rounded-[10px] p-3">
              <X size={14} className="flex-shrink-0 mt-[2px]" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

function ReportStat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="p-3 bg-bg-2 rounded-[10px] border border-line">
      <div className="display text-[24px] font-medium" style={{ color }}>
        {value}
      </div>
      <div className="chip-uppercase">{label}</div>
    </div>
  );
}
