import { useEffect, useRef, useState } from "react";
import { Check, ImagePlus, Loader2, Trash2, X } from "lucide-react";
import { Drawer } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useMenuUpload } from "@/hooks/useMenuUpload";
import {
  MENU_ALLERGENES,
  MENU_BADGES,
  MENU_TAGS,
  TVA_HINTS,
  TVA_RATES,
  type Allergene,
  type MenuBadge,
  type MenuCategory,
  type MenuItem,
  type MenuTag,
  type TvaRate,
} from "@/lib/menu-types";
import type { NewItem } from "@/lib/api/menu-db";

type DraftBase = Omit<MenuItem, "id" | "restaurantId" | "position">;

function emptyDraft(categoryId: string): DraftBase {
  return {
    categoryId,
    name: "",
    description: "",
    price: 0,
    photoUrl: null,
    available: true,
    tags: [],
    allergenes: [],
    badge: null,
    tvaRate: 10,
  };
}

export function MenuItemDrawer({
  open,
  mode,
  item,
  categories,
  defaultCategoryId,
  onClose,
  onCreate,
  onUpdate,
  onPhotoChange,
}: {
  open: boolean;
  mode: "create" | "edit";
  item?: MenuItem | null;
  categories: MenuCategory[];
  defaultCategoryId: string;
  onClose: () => void;
  onCreate?: (payload: NewItem) => Promise<MenuItem | null>;
  onUpdate?: (id: string, patch: Partial<DraftBase>) => Promise<void>;
  onPhotoChange?: (itemId: string, newUrl: string | null) => void;
}) {
  const { restaurant } = useAuth();
  const upload = useMenuUpload();
  const [draft, setDraft] = useState<DraftBase>(() => emptyDraft(defaultCategoryId));
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && item) {
      setDraft({
        categoryId: item.categoryId,
        name: item.name,
        description: item.description ?? "",
        price: item.price,
        photoUrl: item.photoUrl,
        available: item.available,
        tags: item.tags,
        allergenes: item.allergenes,
        badge: item.badge,
        tvaRate: item.tvaRate,
      });
    } else {
      setDraft(emptyDraft(defaultCategoryId));
    }
    upload.reset();
    setLocalError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, item?.id, defaultCategoryId]);

  const patch = <K extends keyof DraftBase>(key: K, value: DraftBase[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
  };

  const toggleInArray = <T extends string>(key: "tags" | "allergenes", v: T) => {
    setDraft((d) => {
      const current = d[key] as string[];
      const next = current.includes(v) ? current.filter((x) => x !== v) : [...current, v];
      return { ...d, [key]: next };
    });
  };

  const handleFile = async (file: File | null) => {
    if (!file || !restaurant) return;
    setLocalError(null);
    // Pour un nouveau plat on utilise un id temporaire.
    const targetId = item?.id ?? `tmp-${Date.now()}`;
    const url = await upload.upload(restaurant.id, targetId, file);
    if (!url) {
      setLocalError(upload.error);
      return;
    }
    // Si remplacement, supprimer l'ancienne
    if (draft.photoUrl && draft.photoUrl !== url) {
      await upload.remove(draft.photoUrl);
    }
    patch("photoUrl", url);
    if (mode === "edit" && item) {
      await onUpdate?.(item.id, { photoUrl: url });
      onPhotoChange?.(item.id, url);
    }
  };

  const removePhoto = async () => {
    if (!draft.photoUrl) return;
    const url = draft.photoUrl;
    patch("photoUrl", null);
    await upload.remove(url);
    if (mode === "edit" && item) {
      await onUpdate?.(item.id, { photoUrl: null });
      onPhotoChange?.(item.id, null);
    }
  };

  const save = async () => {
    setLocalError(null);
    if (!draft.name.trim()) {
      setLocalError("Le nom du plat est requis.");
      return;
    }
    if (Number.isNaN(draft.price) || draft.price < 0) {
      setLocalError("Prix invalide.");
      return;
    }
    setSaving(true);
    try {
      if (mode === "create") {
        await onCreate?.({
          ...draft,
          name: draft.name.trim(),
          description: draft.description?.trim() || null,
        });
      } else if (mode === "edit" && item) {
        await onUpdate?.(item.id, {
          ...draft,
          name: draft.name.trim(),
          description: draft.description?.trim() || null,
        });
      }
      onClose();
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={520}
      title={mode === "create" ? "Nouveau plat" : draft.name || "Modifier le plat"}
      subtitle={
        mode === "edit" && item ? `${new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(item.price)} · ${item.tvaRate}% TVA` : undefined
      }
      footer={
        <div className="flex justify-between items-center gap-2">
          <div className="text-[11px] text-ink-4 min-w-0 truncate">
            {localError ? (
              <span className="text-danger">{localError}</span>
            ) : upload.uploading ? (
              "Envoi de la photo…"
            ) : (
              "Les mises à jour sont enregistrées à la validation."
            )}
          </div>
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={onClose} disabled={saving}>
              Annuler
            </button>
            <button
              className="btn-primary inline-flex items-center gap-2"
              onClick={save}
              disabled={saving || upload.uploading || !draft.name.trim()}
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              {mode === "create" ? "Créer" : "Enregistrer"}
            </button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        {/* Photo */}
        <div>
          <div className="chip-uppercase mb-2">Photo du plat</div>
          <div className="flex items-start gap-3">
            <div className="w-[120px] h-[120px] rounded-[10px] border border-line bg-bg-2 overflow-hidden flex items-center justify-center flex-shrink-0 relative">
              {draft.photoUrl ? (
                <img
                  src={draft.photoUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImagePlus size={22} className="text-ink-4" />
              )}
              {upload.uploading && (
                <div className="absolute inset-0 bg-bg-0/70 flex flex-col items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin text-ember-soft" />
                  <div className="w-[80%] h-[4px] bg-bg-3 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-ember transition-all"
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2 flex-1">
              <button
                type="button"
                className="btn-ghost text-[12px] inline-flex items-center gap-2"
                onClick={() => fileInput.current?.click()}
                disabled={upload.uploading}
              >
                <ImagePlus size={12} />
                {draft.photoUrl ? "Remplacer" : "Ajouter une photo"}
              </button>
              {draft.photoUrl && (
                <button
                  type="button"
                  onClick={removePhoto}
                  className="btn-ghost text-[12px] inline-flex items-center gap-2 text-danger hover:text-danger"
                >
                  <Trash2 size={12} />
                  Supprimer la photo
                </button>
              )}
              <div className="text-[10.5px] text-ink-4 mono">
                JPEG/PNG/WEBP · redimensionné en 800×800
              </div>
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  handleFile(e.target.files?.[0] ?? null);
                  e.target.value = "";
                }}
              />
            </div>
          </div>
        </div>

        <FieldRow
          label="Nom du plat"
          required
          input={
            <input
              value={draft.name}
              onChange={(e) => patch("name", e.target.value)}
              placeholder="Onglet de bœuf, échalote confite…"
              className={inputCls}
            />
          }
        />

        <FieldRow
          label="Description"
          input={
            <textarea
              rows={3}
              value={draft.description ?? ""}
              onChange={(e) => patch("description", e.target.value)}
              placeholder="Une phrase pour décrire le plat…"
              className={cn(inputCls, "resize-none")}
            />
          }
        />

        <div className="grid grid-cols-2 gap-3">
          <FieldRow
            label="Prix TTC (€)"
            input={
              <input
                type="number"
                step="0.10"
                min={0}
                value={Number.isNaN(draft.price) ? "" : draft.price}
                onChange={(e) => patch("price", parseFloat(e.target.value) || 0)}
                className={cn(inputCls, "mono")}
              />
            }
          />
          <FieldRow
            label="Taux TVA"
            input={
              <select
                value={draft.tvaRate}
                onChange={(e) => patch("tvaRate", Number(e.target.value) as TvaRate)}
                className={cn(inputCls, "mono")}
              >
                {TVA_RATES.map((r) => (
                  <option key={r} value={r}>
                    {r}% — {TVA_HINTS[r]}
                  </option>
                ))}
              </select>
            }
          />
        </div>

        <FieldRow
          label="Catégorie"
          input={
            <select
              value={draft.categoryId}
              onChange={(e) => patch("categoryId", e.target.value)}
              className={inputCls}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          }
        />

        <FieldRow
          label="Badge"
          input={
            <select
              value={draft.badge ?? ""}
              onChange={(e) => patch("badge", (e.target.value || null) as MenuBadge | null)}
              className={inputCls}
            >
              <option value="">Aucun</option>
              {MENU_BADGES.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          }
        />

        <FieldRow
          label={`Tags · ${draft.tags.length} sélectionné${draft.tags.length > 1 ? "s" : ""}`}
          input={
            <ChipMulti
              values={MENU_TAGS as unknown as string[]}
              selected={draft.tags}
              onToggle={(v) => toggleInArray<MenuTag>("tags", v as MenuTag)}
            />
          }
        />

        <FieldRow
          label={`Allergènes · ${draft.allergenes.length}`}
          input={
            <ChipMulti
              values={MENU_ALLERGENES as unknown as string[]}
              selected={draft.allergenes}
              onToggle={(v) => toggleInArray<Allergene>("allergenes", v as Allergene)}
              tone="warn"
            />
          }
        />

        <div className="flex items-center justify-between p-[10px] bg-bg-2 border border-line rounded-[10px]">
          <div className="text-[12.5px] text-ink-2">Disponible à la vente</div>
          <button
            type="button"
            onClick={() => patch("available", !draft.available)}
            className={cn(
              "relative w-[36px] h-[20px] rounded-full transition-colors",
              draft.available ? "bg-ember" : "bg-bg-3 border border-line"
            )}
          >
            <span
              className={cn(
                "absolute top-[2px] w-[14px] h-[14px] rounded-full bg-cream transition-all",
                draft.available ? "left-[19px]" : "left-[2px]"
              )}
            />
          </button>
        </div>
      </div>
    </Drawer>
  );
}

const inputCls =
  "w-full bg-bg-2 border border-line rounded-[10px] px-3 py-[9px] text-[13px] text-ink-1 outline-none focus:border-line-2 transition-colors";

function FieldRow({
  label,
  required,
  input,
}: {
  label: string;
  required?: boolean;
  input: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-[6px]">
      <span className="chip-uppercase">
        {label}
        {required && <span className="text-danger"> *</span>}
      </span>
      {input}
    </label>
  );
}

function ChipMulti({
  values,
  selected,
  onToggle,
  tone = "ember",
}: {
  values: string[];
  selected: string[];
  onToggle: (v: string) => void;
  tone?: "ember" | "warn";
}) {
  return (
    <div className="flex flex-wrap gap-[6px]">
      {values.map((v) => {
        const active = selected.includes(v);
        return (
          <button
            key={v}
            type="button"
            onClick={() => onToggle(v)}
            className={cn(
              "inline-flex items-center gap-[4px] text-[11.5px] px-[9px] py-[4px] rounded-full border transition-all",
              active
                ? tone === "ember"
                  ? "bg-ember/15 border-ember text-ember-soft"
                  : "bg-amber/15 border-amber text-amber"
                : "bg-bg-2 border-line text-ink-3 hover:border-line-2 hover:text-ink-2"
            )}
          >
            {active && <X size={10} />}
            {v}
          </button>
        );
      })}
    </div>
  );
}
