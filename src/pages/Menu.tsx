import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  FolderPlus,
  GripVertical,
  ImageOff,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useMenu } from "@/hooks/useMenu";
import type { MenuCategory, MenuItem } from "@/lib/menu-types";
import { MenuItemDrawer } from "@/components/menu/MenuItemDrawer";
import { NewCategoryModal } from "@/components/menu/NewCategoryModal";
import { ConfirmDelete } from "@/components/menu/ConfirmDelete";

const eurosCompact = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

type DrawerState =
  | { mode: "closed" }
  | { mode: "create"; categoryId: string }
  | { mode: "edit"; item: MenuItem };

type DeleteState =
  | { kind: "none" }
  | { kind: "item"; item: MenuItem }
  | { kind: "category"; category: MenuCategory };

const euros = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

export default function Menu() {
  const menu = useMenu();
  const {
    categories,
    items,
    loading,
    error,
    reload,
    addCategory,
    renameCategory,
    toggleCategoryActive,
    removeCategory,
    reorderCats,
    addItem,
    editItem,
    toggleAvailable,
    removeItem,
    reorderIts,
  } = menu;

  const [params, setParams] = useSearchParams();
  const urlCat = params.get("cat");
  const [activeCatId, setActiveCatId] = useState<string | null>(urlCat);
  const [drawer, setDrawer] = useState<DrawerState>({ mode: "closed" });
  const [newCatOpen, setNewCatOpen] = useState(false);
  const [confirm, setConfirm] = useState<DeleteState>({ kind: "none" });
  const [query, setQuery] = useState("");
  const [onlyUnavailable, setOnlyUnavailable] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // Select first category when available.
  useEffect(() => {
    if (!activeCatId && categories.length > 0) setActiveCatId(categories[0].id);
    if (activeCatId && !categories.find((c) => c.id === activeCatId)) {
      setActiveCatId(categories[0]?.id ?? null);
    }
  }, [categories, activeCatId]);

  useEffect(() => {
    if (activeCatId && params.get("cat") !== activeCatId) {
      const next = new URLSearchParams(params);
      next.set("cat", activeCatId);
      setParams(next, { replace: true });
    }
  }, [activeCatId, params, setParams]);

  const unavailableCount = useMemo(
    () => items.filter((i) => !i.available).length,
    [items]
  );

  const unavailableItems = useMemo(
    () => items.filter((i) => !i.available),
    [items]
  );

  const stats = useMemo(() => {
    const total = items.length;
    const activeCount = items.filter((i) => i.available).length;
    const catsActive = categories.filter((c) => c.active).length;
    const avgPrice =
      items.length > 0
        ? items.reduce((s, i) => s + i.price, 0) / items.length
        : 0;
    const withPhoto = items.filter((i) => i.photoUrl).length;
    return {
      total,
      activeCount,
      catsActive,
      avgPrice,
      withPhoto,
    };
  }, [items, categories]);

  const visibleItems = useMemo(() => {
    const base = activeCatId ? items.filter((i) => i.categoryId === activeCatId) : [];
    const sorted = [...base].sort((a, b) => a.position - b.position);
    return sorted.filter((i) => {
      if (onlyUnavailable && i.available) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        i.name.toLowerCase().includes(q) ||
        (i.description ?? "").toLowerCase().includes(q) ||
        i.tags.join(" ").toLowerCase().includes(q)
      );
    });
  }, [items, activeCatId, query, onlyUnavailable]);

  const catsSorted = useMemo(
    () => [...categories].sort((a, b) => a.position - b.position),
    [categories]
  );

  const countByCat = useMemo(() => {
    const map = new Map<string, number>();
    for (const it of items) {
      map.set(it.categoryId, (map.get(it.categoryId) ?? 0) + 1);
    }
    return map;
  }, [items]);

  const onDropCat = (overId: string, draggedId: string) => {
    if (overId === draggedId) return;
    const order = catsSorted.map((c) => c.id);
    const from = order.indexOf(draggedId);
    const to = order.indexOf(overId);
    if (from === -1 || to === -1) return;
    order.splice(from, 1);
    order.splice(to, 0, draggedId);
    void reorderCats(order);
  };

  const onDropItem = (overId: string, draggedId: string) => {
    if (!activeCatId || overId === draggedId) return;
    const order = [...items]
      .filter((i) => i.categoryId === activeCatId)
      .sort((a, b) => a.position - b.position)
      .map((i) => i.id);
    const from = order.indexOf(draggedId);
    const to = order.indexOf(overId);
    if (from === -1 || to === -1) return;
    order.splice(from, 1);
    order.splice(to, 0, draggedId);
    void reorderIts(activeCatId, order);
  };

  const startRename = (c: MenuCategory) => {
    setRenamingId(c.id);
    setRenameValue(c.name);
  };
  const commitRename = () => {
    if (renamingId && renameValue.trim()) {
      void renameCategory(renamingId, renameValue.trim());
    }
    setRenamingId(null);
  };

  return (
    <>
      <div className="flex items-end justify-between mb-5 pt-2">
        <div>
          <div className="chip-uppercase mb-1">Carte · gestion du menu</div>
          <h2 className="display font-medium text-[26px] leading-tight m-0">
            Menu <em className="not-italic italic text-ember-soft font-normal">& plats</em>
          </h2>
        </div>
        <div className="flex gap-2">
          <button
            className="btn-ghost inline-flex items-center gap-2"
            onClick={() => setNewCatOpen(true)}
          >
            <FolderPlus size={13} />
            Nouvelle catégorie
          </button>
          <button
            className="btn-primary inline-flex items-center gap-2"
            onClick={() => {
              if (!activeCatId) return;
              setDrawer({ mode: "create", categoryId: activeCatId });
            }}
            disabled={!activeCatId}
          >
            <Plus size={13} />
            Ajouter un plat
          </button>
        </div>
      </div>

      {/* Alerte indisponibilités */}
      {unavailableItems.length > 0 && (
        <Card className="mb-4 border-amber/30" style={{ background: "rgba(232,176,74,0.04)" }}>
          <div className="flex items-start gap-3">
            <div className="w-[28px] h-[28px] rounded-md bg-amber/15 text-amber grid place-items-center flex-shrink-0">
              <AlertTriangle size={14} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="chip-uppercase mb-1 text-amber">Plats indisponibles</div>
              <div className="text-[13px] text-ink-1 font-medium mb-2">
                {unavailableItems.length} plat{unavailableItems.length > 1 ? "s" : ""} masqué{unavailableItems.length > 1 ? "s" : ""} de la carte
              </div>
              <div className="flex flex-wrap gap-2">
                {unavailableItems.slice(0, 12).map((m) => {
                  const cat = categories.find((c) => c.id === m.categoryId);
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        setActiveCatId(m.categoryId);
                        setDrawer({ mode: "edit", item: m });
                      }}
                      className="inline-flex items-center gap-2 px-2 py-1 rounded-md text-[11.5px] border bg-amber/10 border-amber/30 text-amber hover:bg-amber/15 transition-colors"
                      title={cat ? `Catégorie : ${cat.name}` : ""}
                    >
                      <span className="font-medium">{m.name}</span>
                      {cat && <span className="mono opacity-70">· {cat.name}</span>}
                    </button>
                  );
                })}
                {unavailableItems.length > 12 && (
                  <span className="text-[11.5px] text-ink-4 self-center">
                    +{unavailableItems.length - 12} autres…
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-12 gap-4 mb-4">
        <StatTile
          className="col-span-3"
          label="Plats au menu"
          value={stats.total}
          hint={`${stats.activeCount} disponible${stats.activeCount > 1 ? "s" : ""} · ${stats.withPhoto} avec photo`}
          tone="cream"
        />
        <StatTile
          className="col-span-3"
          label="Catégories"
          value={categories.length}
          hint={`${stats.catsActive} active${stats.catsActive > 1 ? "s" : ""} · ${categories.length - stats.catsActive} masquée${categories.length - stats.catsActive > 1 ? "s" : ""}`}
          tone="ember"
        />
        <StatTile
          className="col-span-3"
          label="Prix moyen"
          value={stats.total > 0 ? eurosCompact.format(stats.avgPrice) : "—"}
          hint="Sur l'ensemble de la carte"
          tone="ok"
        />
        <StatTile
          className="col-span-3"
          label="Indisponibles"
          value={unavailableCount}
          hint={
            unavailableCount === 0
              ? "Tous les plats sont servis"
              : "Masqués sur la carte digitale"
          }
          tone={unavailableCount > 0 ? "danger" : "ok"}
        />
      </div>

      {/* Top bar */}
      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setOnlyUnavailable((v) => !v)}
            className={cn(
              "inline-flex items-center gap-2 text-[12px] px-3 py-[7px] rounded-[10px] border transition-all",
              onlyUnavailable
                ? "bg-danger/10 border-danger text-danger"
                : "bg-bg-2 border-line text-ink-3 hover:text-ink-1 hover:border-line-2"
            )}
          >
            <AlertTriangle size={12} />
            Indisponibles uniquement
            {unavailableCount > 0 && (
              <span className="mono text-[10.5px] ml-1">· {unavailableCount}</span>
            )}
          </button>

          <div className="ml-auto flex items-center gap-2 bg-bg-2 border border-line rounded-[10px] px-3 py-[7px] w-[280px] text-[13px]">
            <Search size={14} className="text-ink-3" />
            <input
              className="flex-1 bg-transparent border-0 outline-none text-ink-1 placeholder:text-ink-3"
              placeholder="Nom, description, tag…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button
                className="text-ink-4 hover:text-ink-2 text-[11px]"
                onClick={() => setQuery("")}
              >
                ×
              </button>
            )}
          </div>
        </div>
      </Card>

      {error && (
        <Card className="mb-4 border-danger/40" style={{ background: "rgba(224,80,80,0.05)" }}>
          <div className="flex items-center gap-2 text-danger text-[12.5px]">
            <AlertTriangle size={14} />
            <span>{error}</span>
            <button
              className="ml-auto btn-ghost text-[11px]"
              onClick={() => void reload()}
            >
              Réessayer
            </button>
          </div>
        </Card>
      )}

      {/* Two columns */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "280px 1fr" }}>
        {/* Left: categories */}
        <Card className="p-2 self-start">
          <div className="flex items-center justify-between px-2 py-2">
            <div className="chip-uppercase">Catégories</div>
            <span className="text-[10.5px] text-ink-4 mono">
              {catsSorted.length}
            </span>
          </div>
          {loading && catsSorted.length === 0 ? (
            <div className="p-4 text-[12px] text-ink-3">Chargement…</div>
          ) : catsSorted.length === 0 ? (
            <div className="p-4 text-[12px] text-ink-4 italic text-center">
              Aucune catégorie.<br />
              Créez-en une pour commencer.
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {catsSorted.map((c) => {
                const active = c.id === activeCatId;
                const count = countByCat.get(c.id) ?? 0;
                const isRenaming = renamingId === c.id;
                return (
                  <div
                    key={c.id}
                    draggable={!isRenaming}
                    onDragStart={(e) => {
                      e.dataTransfer.setData("cat", c.id);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      const id = e.dataTransfer.getData("cat");
                      if (id) onDropCat(c.id, id);
                    }}
                    onClick={() => setActiveCatId(c.id)}
                    className={cn(
                      "group flex items-center gap-2 px-2 py-2 rounded-[8px] cursor-pointer select-none transition-colors",
                      active
                        ? "bg-bg-3"
                        : "hover:bg-bg-2"
                    )}
                  >
                    <GripVertical
                      size={13}
                      className="text-ink-4 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab"
                    />
                    <div className="flex-1 min-w-0">
                      {isRenaming ? (
                        <input
                          autoFocus
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onBlur={commitRename}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitRename();
                            if (e.key === "Escape") setRenamingId(null);
                          }}
                          className="w-full bg-bg-2 border border-line rounded-[6px] px-[6px] py-[3px] text-[12.5px] text-ink-1 outline-none"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <div
                          className={cn(
                            "text-[12.5px] truncate",
                            active ? "text-ink-1 font-semibold" : "text-ink-2",
                            !c.active && "line-through opacity-60"
                          )}
                        >
                          {c.name}
                        </div>
                      )}
                    </div>
                    <span className="text-[10.5px] mono text-ink-4">{count}</span>
                    <ToggleDot
                      active={c.active}
                      onChange={(v) => {
                        void toggleCategoryActive(c.id, v);
                      }}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startRename(c);
                      }}
                      className="icon-btn w-[22px] h-[22px] opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Renommer"
                    >
                      <Pencil size={10} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirm({ kind: "category", category: c });
                      }}
                      className="icon-btn w-[22px] h-[22px] opacity-0 group-hover:opacity-100 hover:text-danger transition-opacity"
                      title="Supprimer"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Right: items */}
        <Card>
          <CardHeader>
            <CardTitle>
              {activeCatId ? (
                <>
                  {catsSorted.find((c) => c.id === activeCatId)?.name ?? "—"}{" "}
                  <span className="text-ember-soft">· {visibleItems.length} plat{visibleItems.length > 1 ? "s" : ""}</span>
                </>
              ) : (
                "Aucune catégorie sélectionnée"
              )}
            </CardTitle>
            <span className="text-[11px] text-ink-4 mono uppercase tracking-[0.08em]">
              Glissez pour réordonner
            </span>
          </CardHeader>

          {loading && visibleItems.length === 0 ? (
            <div className="py-16 text-center text-ink-3 text-[13px]">Chargement…</div>
          ) : !activeCatId ? (
            <div className="py-16 text-center text-ink-4 text-[13px] italic">
              Créez une première catégorie pour y ajouter des plats.
            </div>
          ) : visibleItems.length === 0 ? (
            <div className="py-16 text-center text-ink-4 text-[13px] italic">
              {query || onlyUnavailable
                ? "Aucun plat ne correspond au filtre."
                : "Aucun plat dans cette catégorie."}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {visibleItems.map((it) => (
                <ItemRow
                  key={it.id}
                  item={it}
                  onDrop={onDropItem}
                  onToggle={() => void toggleAvailable(it.id)}
                  onEdit={() => setDrawer({ mode: "edit", item: it })}
                  onDelete={() => setConfirm({ kind: "item", item: it })}
                />
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Drawer edit/create */}
      <MenuItemDrawer
        open={drawer.mode !== "closed"}
        mode={drawer.mode === "edit" ? "edit" : "create"}
        item={drawer.mode === "edit" ? drawer.item : null}
        categories={catsSorted.filter((c) => c.active)}
        defaultCategoryId={
          drawer.mode === "create" ? drawer.categoryId : activeCatId ?? ""
        }
        onClose={() => setDrawer({ mode: "closed" })}
        onCreate={async (payload) => {
          const created = await addItem(payload);
          return created;
        }}
        onUpdate={editItem}
      />

      {/* New category */}
      <NewCategoryModal
        open={newCatOpen}
        onClose={() => setNewCatOpen(false)}
        onCreate={async (name) => {
          const c = await addCategory(name);
          if (c) setActiveCatId(c.id);
        }}
      />

      {/* Delete confirm */}
      <ConfirmDelete
        open={confirm.kind !== "none"}
        title={
          confirm.kind === "item"
            ? "Supprimer ce plat ?"
            : confirm.kind === "category"
            ? "Supprimer cette catégorie ?"
            : ""
        }
        body={
          confirm.kind === "item"
            ? `« ${confirm.item.name} » sera définitivement retiré du menu.`
            : confirm.kind === "category"
            ? `« ${confirm.category.name} » et tous ses plats seront supprimés.`
            : ""
        }
        onClose={() => setConfirm({ kind: "none" })}
        onConfirm={async () => {
          if (confirm.kind === "item") await removeItem(confirm.item.id);
          if (confirm.kind === "category") await removeCategory(confirm.category.id);
        }}
      />
    </>
  );
}

function ItemRow({
  item,
  onDrop,
  onToggle,
  onEdit,
  onDelete,
}: {
  item: MenuItem;
  onDrop: (overId: string, draggedId: string) => void;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("item", item.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        const id = e.dataTransfer.getData("item");
        if (id) onDrop(item.id, id);
      }}
      className={cn(
        "group grid gap-3 items-center p-3 bg-bg-2 border border-line rounded-[12px] transition-all hover:border-line-2",
        !item.available && "opacity-60"
      )}
      style={{ gridTemplateColumns: "14px 80px 1fr auto auto" }}
    >
      <GripVertical
        size={13}
        className="text-ink-4 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab"
      />

      <div className="w-[80px] h-[80px] rounded-[8px] overflow-hidden bg-bg-3 border border-line flex items-center justify-center flex-shrink-0">
        {item.photoUrl ? (
          <img
            src={item.photoUrl}
            alt=""
            className={cn("w-full h-full object-cover", !item.available && "grayscale")}
          />
        ) : (
          <ImageOff size={18} className="text-ink-4" />
        )}
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-[3px]">
          <div
            className={cn(
              "text-[13.5px] font-semibold text-ink-1 truncate",
              !item.available && "line-through"
            )}
          >
            {item.name}
          </div>
          {item.badge && (
            <span className="channel-pill text-[10px]" style={{ color: "var(--ember-soft)", borderColor: "var(--ember-deep)" }}>
              ● {item.badge}
            </span>
          )}
        </div>
        {item.description && (
          <div className="text-[11.5px] text-ink-3 line-clamp-1 mb-1">
            {item.description}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-[6px] text-[10.5px]">
          {item.tags.map((t) => (
            <span
              key={t}
              className="mono text-ink-3 bg-bg-3 border border-line rounded-full px-[7px] py-[1px]"
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="text-right">
        <div className="display text-[16px] font-medium leading-none">
          {euros.format(item.price)}
        </div>
        <div className="text-[10.5px] text-ink-4 mono mt-[3px]">{item.tvaRate}% TVA</div>
      </div>

      <div className="flex items-center gap-1">
        <ToggleDot active={item.available} onChange={onToggle} />
        <button className="icon-btn" onClick={onEdit} title="Éditer">
          <Pencil size={12} />
        </button>
        <button
          className="icon-btn hover:text-danger"
          onClick={onDelete}
          title="Supprimer"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
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
      <div className="chip-uppercase">{label}</div>
      <div
        className="display font-medium text-[30px] leading-none mt-[12px] mb-[8px] truncate"
        style={{ color: toneColor }}
      >
        {value}
      </div>
      <div className="text-[11.5px] text-ink-3 truncate">{hint}</div>
    </div>
  );
}

function ToggleDot({
  active,
  onChange,
}: {
  active: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onChange(!active);
      }}
      className={cn(
        "relative w-[28px] h-[16px] rounded-full transition-colors flex-shrink-0",
        active ? "bg-ember" : "bg-bg-3 border border-line"
      )}
      title={active ? "Disponible" : "Indisponible"}
    >
      <span
        className={cn(
          "absolute top-[2px] w-[10px] h-[10px] rounded-full bg-cream transition-all",
          active ? "left-[15px]" : "left-[2px]"
        )}
      />
    </button>
  );
}
