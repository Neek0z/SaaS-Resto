import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowDownUp, Plus, Search } from "lucide-react";
import { listMenuItems } from "@/lib/api/menu";
import type { MenuItem, StockLevel } from "@/lib/mock-data";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { MenuRow, stockLabel } from "@/components/menu/MenuRow";
import { cn } from "@/lib/utils";

type CatFilter = "all" | "Entrée" | "Plat" | "Dessert";
type StockFilter = "all" | StockLevel;
type SortKey = "sold" | "margin" | "trend" | "name";

export default function Menu() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState<CatFilter>("all");
  const [stock, setStock] = useState<StockFilter>("all");
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("sold");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        setItems(await listMenuItems());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const list = items.filter((m) => {
      if (cat !== "all" && m.cat !== cat) return false;
      if (stock !== "all" && m.stock !== stock) return false;
      if (query && !m.name.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });

    return [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else cmp = (a[sortKey] as number) - (b[sortKey] as number);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [items, cat, stock, query, sortKey, sortDir]);

  const stats = useMemo(() => {
    const total = items.length;
    const outOfStock = items.filter((m) => m.stock === "out").length;
    const lowStock = items.filter((m) => m.stock === "low").length;
    const topSeller = items.reduce<MenuItem | null>(
      (best, m) => (!best || m.sold > best.sold ? m : best),
      null
    );
    const avgMargin =
      items.length > 0
        ? Math.round(items.reduce((s, m) => s + m.margin, 0) / items.length)
        : 0;
    return { total, outOfStock, lowStock, topSeller, avgMargin };
  }, [items]);

  const alertItems = items.filter((m) => m.stock === "out" || m.stock === "low");

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(k);
      setSortDir(k === "name" ? "asc" : "desc");
    }
  };

  return (
    <>
      <div className="flex items-end justify-between mb-5 pt-2">
        <div>
          <div className="chip-uppercase mb-1">Carte · Gestion stocks</div>
          <h2 className="display font-medium text-[26px] leading-tight m-0">
            Menu <em className="not-italic italic text-ember-soft font-normal">&amp; stocks</em>
          </h2>
        </div>
        <button className="btn-primary">
          <Plus size={13} />
          Ajouter un plat
        </button>
      </div>

      {/* Stock alerts banner */}
      {alertItems.length > 0 && (
        <Card className="mb-4 border-amber/30" style={{ background: "rgba(232,176,74,0.04)" }}>
          <div className="flex items-start gap-3">
            <div className="w-[28px] h-[28px] rounded-md bg-amber/15 text-amber grid place-items-center flex-shrink-0">
              <AlertTriangle size={14} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="chip-uppercase mb-1 text-amber">Attention stocks</div>
              <div className="text-[13px] text-ink-1 font-medium mb-2">
                {alertItems.length} plat{alertItems.length > 1 ? "s" : ""} à traiter en priorité
              </div>
              <div className="flex flex-wrap gap-2">
                {alertItems.map((m) => (
                  <span
                    key={m.name}
                    className={cn(
                      "inline-flex items-center gap-2 px-2 py-1 rounded-md text-[11.5px] border",
                      m.stock === "out"
                        ? "bg-danger/10 border-danger/30 text-danger"
                        : "bg-amber/10 border-amber/30 text-amber"
                    )}
                  >
                    <span className="font-medium">{m.name}</span>
                    <span className="mono opacity-70">· {stockLabel(m.stock)}</span>
                  </span>
                ))}
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
          hint={`${items.filter((m) => m.cat === "Entrée").length} entrées · ${items.filter((m) => m.cat === "Plat").length} plats · ${items.filter((m) => m.cat === "Dessert").length} desserts`}
          tone="cream"
        />
        <StatTile
          className="col-span-3"
          label="Top vente"
          value={stats.topSeller ? stats.topSeller.sold : "—"}
          hint={stats.topSeller ? stats.topSeller.name : ""}
          tone="ember"
        />
        <StatTile
          className="col-span-3"
          label="Marge moyenne"
          value={`${stats.avgMargin}%`}
          hint="Sur l'ensemble de la carte"
          tone="ok"
        />
        <StatTile
          className="col-span-3"
          label="Alertes stock"
          value={stats.outOfStock + stats.lowStock}
          hint={`${stats.outOfStock} rupture${stats.outOfStock > 1 ? "s" : ""} · ${stats.lowStock} stock bas`}
          tone="danger"
        />
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="segmented">
            {(["all", "Entrée", "Plat", "Dessert"] as const).map((c) => (
              <button key={c} className={cn(cat === c && "active")} onClick={() => setCat(c)}>
                {c === "all" ? "Toutes catégories" : c + "s"}
              </button>
            ))}
          </div>
          <span className="text-ink-4 text-[11px]">|</span>
          <div className="segmented">
            {(["all", "ok", "low", "out"] as const).map((s) => (
              <button key={s} className={cn(stock === s && "active")} onClick={() => setStock(s)}>
                {s === "all"
                  ? "Tous stocks"
                  : s === "ok"
                  ? "En stock"
                  : s === "low"
                  ? "Bas"
                  : "Rupture"}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2 bg-bg-2 border border-line rounded-[10px] px-3 py-[7px] w-[260px] text-[13px]">
            <Search size={14} className="text-ink-3" />
            <input
              className="flex-1 bg-transparent border-0 outline-none text-ink-1 placeholder:text-ink-3"
              placeholder="Nom du plat…"
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

      {/* Full menu table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filtered.length} plat{filtered.length > 1 ? "s" : ""} ·{" "}
            <span className="text-ember-soft">
              tri par {sortLabel(sortKey)} {sortDir === "asc" ? "↑" : "↓"}
            </span>
          </CardTitle>
          <span className="text-[11px] text-ink-4 mono uppercase tracking-[0.08em]">
            Clic colonne pour trier
          </span>
        </CardHeader>

        <div>
          <div
            className="grid items-center gap-3 py-[10px] px-2 text-[10.5px] uppercase tracking-[0.08em] text-ink-4 border-b border-line mb-1 font-semibold"
            style={{ gridTemplateColumns: "1fr 60px 80px 60px" }}
          >
            <SortHeader active={sortKey === "name"} dir={sortDir} onClick={() => toggleSort("name")}>
              Plat
            </SortHeader>
            <SortHeader
              active={sortKey === "sold"}
              dir={sortDir}
              onClick={() => toggleSort("sold")}
              align="right"
            >
              Vendus
            </SortHeader>
            <SortHeader active={sortKey === "margin"} dir={sortDir} onClick={() => toggleSort("margin")}>
              Marge
            </SortHeader>
            <SortHeader
              active={sortKey === "trend"}
              dir={sortDir}
              onClick={() => toggleSort("trend")}
              align="right"
            >
              Stock
            </SortHeader>
          </div>

          {loading ? (
            <div className="py-16 text-center text-ink-3 text-[13px]">Chargement…</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-ink-3 text-[13px]">
              Aucun plat ne correspond aux filtres.
            </div>
          ) : (
            filtered.map((m) => <MenuRow key={m.name} m={m} />)
          )}
        </div>
      </Card>
    </>
  );
}

function sortLabel(k: SortKey) {
  return k === "sold" ? "ventes" : k === "margin" ? "marge" : k === "trend" ? "tendance" : "nom";
}

function SortHeader({
  children,
  active,
  dir,
  onClick,
  align = "left",
}: {
  children: React.ReactNode;
  active: boolean;
  dir: "asc" | "desc";
  onClick: () => void;
  align?: "left" | "right";
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 transition-colors hover:text-ink-2",
        active && "text-ember-soft",
        align === "right" && "justify-end"
      )}
    >
      {children}
      {active ? (
        <span className="mono text-[9px]">{dir === "asc" ? "↑" : "↓"}</span>
      ) : (
        <ArrowDownUp size={9} className="opacity-40" />
      )}
    </button>
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
