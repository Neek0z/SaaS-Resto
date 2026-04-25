import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, type NavigateFunction } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  CalendarPlus,
  ClipboardList,
  Heart,
  Mail,
  MessageSquare,
  QrCode,
  Search,
  Settings,
  Sparkles,
  Star,
  User,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { usePermission } from "@/hooks/usePermission";
import { useRole } from "@/hooks/useRole";
import { useAuth } from "@/contexts/AuthContext";
import { listReservations } from "@/lib/api/reservations";
import { listOrders } from "@/lib/api/orders";
import { fetchMenu } from "@/lib/api/menu-db";
import { fetchAllCustomers } from "@/lib/api/customers-db";
import { listReviews } from "@/lib/api/reviews";
import { listTeam } from "@/lib/api/team";
import { extractErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";

type ResultGroup =
  | "Navigation"
  | "Actions"
  | "Réservations"
  | "Commandes"
  | "Menu"
  | "Clients"
  | "Avis"
  | "Équipe";

type Result = {
  id: string;
  label: string;
  hint?: string;
  group: ResultGroup;
  resource?: string;
  icon: React.ReactNode;
  onSelect: (nav: NavigateFunction) => void;
  keywords?: string[];
};

const STATIC: Result[] = [
  {
    id: "nav.dashboard",
    label: "Tableau de bord",
    hint: "Vue d'ensemble",
    group: "Navigation",
    resource: "nav.dashboard",
    icon: <BarChart3 size={14} />,
    onSelect: (nav) => nav("/dashboard"),
    keywords: ["accueil", "home", "kpi", "stats"],
  },
  {
    id: "nav.commandes",
    label: "Commandes",
    hint: "En cours, salle, livraison",
    group: "Navigation",
    resource: "nav.commandes",
    icon: <ClipboardList size={14} />,
    onSelect: (nav) => nav("/commandes"),
    keywords: ["orders", "tickets", "ko"],
  },
  {
    id: "nav.reservations",
    label: "Réservations",
    hint: "Plan de salle live",
    group: "Navigation",
    resource: "nav.reservations",
    icon: <CalendarDays size={14} />,
    onSelect: (nav) => nav("/reservations"),
    keywords: ["resa", "tables", "service"],
  },
  {
    id: "nav.menu",
    label: "Menu & stocks",
    group: "Navigation",
    resource: "nav.menu",
    icon: <UtensilsCrossed size={14} />,
    onSelect: (nav) => nav("/menu"),
    keywords: ["plats", "carte", "stock", "ingrédients"],
  },
  {
    id: "nav.avis",
    label: "Avis clients",
    group: "Navigation",
    resource: "nav.avis",
    icon: <Star size={14} />,
    onSelect: (nav) => nav("/avis"),
    keywords: ["reviews", "google", "tripadvisor"],
  },
  {
    id: "nav.equipe",
    label: "Équipe",
    hint: "Planning, présence",
    group: "Navigation",
    resource: "nav.equipe",
    icon: <Users size={14} />,
    onSelect: (nav) => nav("/equipe"),
    keywords: ["staff", "planning", "team"],
  },
  {
    id: "nav.menu-numerique",
    label: "Menu numérique",
    hint: "Carte publique",
    group: "Navigation",
    resource: "nav.menu-numerique",
    icon: <QrCode size={14} />,
    onSelect: (nav) => nav("/menu-numerique"),
    keywords: ["public", "qr"],
  },
  {
    id: "nav.qrcode",
    label: "QR codes",
    hint: "Tables, vitrine",
    group: "Navigation",
    resource: "nav.qrcode",
    icon: <QrCode size={14} />,
    onSelect: (nav) => nav("/qrcode"),
    keywords: ["qr", "table", "stickers"],
  },
  {
    id: "nav.fidelite",
    label: "Fidélité",
    group: "Navigation",
    resource: "nav.fidelite",
    icon: <Heart size={14} />,
    onSelect: (nav) => nav("/fidelite"),
    keywords: ["loyalty", "points", "récompenses"],
  },
  {
    id: "nav.evenements",
    label: "Événements",
    group: "Navigation",
    resource: "nav.evenements",
    icon: <Sparkles size={14} />,
    onSelect: (nav) => nav("/evenements"),
    keywords: ["promo", "happy hour"],
  },
  {
    id: "nav.clients",
    label: "Clients",
    group: "Navigation",
    resource: "nav.clients",
    icon: <Mail size={14} />,
    onSelect: (nav) => nav("/clients"),
    keywords: ["crm", "newsletter", "emailing"],
  },
  {
    id: "nav.parametres",
    label: "Paramètres",
    group: "Navigation",
    icon: <Settings size={14} />,
    onSelect: (nav) => nav("/parametres"),
    keywords: ["settings", "config", "compte"],
  },
  {
    id: "action.new-resa",
    label: "Nouvelle réservation",
    hint: "Ouvre le formulaire",
    group: "Actions",
    resource: "nav.reservations",
    icon: <CalendarPlus size={14} />,
    onSelect: (nav) => nav("/reservations", { state: { openNew: true } }),
    keywords: ["créer", "ajouter", "resa"],
  },
];

type DynamicData = {
  reservations: Result[];
  orders: Result[];
  menu: Result[];
  customers: Result[];
  reviews: Result[];
  team: Result[];
};

const EMPTY_DYNAMIC: DynamicData = {
  reservations: [],
  orders: [],
  menu: [],
  customers: [],
  reviews: [],
  team: [],
};

const todayIso = () => new Date().toISOString().slice(0, 10);

function score(label: string, keywords: string[] | undefined, q: string): number {
  if (!q) return 0;
  const lq = q.toLowerCase();
  const ll = label.toLowerCase();
  if (ll.startsWith(lq)) return 100;
  if (ll.includes(lq)) return 50;
  if (keywords?.some((k) => k.toLowerCase().includes(lq))) return 25;
  return -1;
}

const GROUP_ORDER: ResultGroup[] = [
  "Navigation",
  "Actions",
  "Réservations",
  "Commandes",
  "Menu",
  "Clients",
  "Avis",
  "Équipe",
];

export function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const { can } = usePermission();
  const { isAtLeast } = useRole();
  const { restaurant } = useAuth();
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const [dynamic, setDynamic] = useState<DynamicData>(EMPTY_DYNAMIC);
  const [dynLoading, setDynLoading] = useState(false);
  const [dynError, setDynError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIdx(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Lazy-load dynamic sources when palette opens
  useEffect(() => {
    if (!open || !restaurant?.id) return;
    let cancelled = false;
    setDynLoading(true);
    setDynError(null);

    const tasks: Promise<Partial<DynamicData>>[] = [
      listReservations(todayIso())
        .then((rows): Partial<DynamicData> => ({
          reservations: rows.map((r) => ({
            id: `resa.${r.id}`,
            label: r.name,
            hint: `${r.time} · ${r.covers} cv · Table ${r.table}`,
            group: "Réservations",
            resource: "nav.reservations",
            icon: <CalendarDays size={14} />,
            onSelect: (nav) =>
              nav("/reservations", { state: { openId: r.id } }),
            keywords: [r.table, r.phone, r.email, r.note].filter(Boolean) as string[],
          })),
        }))
        .catch(() => ({ reservations: [] })),
      listOrders()
        .then((rows): Partial<DynamicData> => ({
          orders: rows
            .filter((o) => o.status !== "served" && o.status !== "cancelled")
            .map((o) => ({
              id: `order.${o.id}`,
              label: `${o.displayId} · ${o.table}`,
              hint: `${o.covers} cv · ${o.items.slice(0, 2).join(", ")}`,
              group: "Commandes",
              resource: "nav.commandes",
              icon: <ClipboardList size={14} />,
              onSelect: (nav) =>
                nav("/commandes", { state: { openId: o.id } }),
              keywords: [o.table, o.waiter, ...o.items],
            })),
        }))
        .catch(() => ({ orders: [] })),
      fetchMenu(restaurant.id)
        .then(({ items, categories }): Partial<DynamicData> => {
          const catName = new Map(categories.map((c) => [c.id, c.name]));
          return {
            menu: items.map((it) => ({
              id: `menu.${it.id}`,
              label: it.name,
              hint: `${catName.get(it.categoryId) ?? "Plat"} · ${it.price.toFixed(2)} €`,
              group: "Menu",
              resource: "nav.menu",
              icon: <UtensilsCrossed size={14} />,
              onSelect: (nav) => nav("/menu"),
              keywords: [
                catName.get(it.categoryId) ?? "",
                ...(it.tags ?? []),
                it.description ?? "",
              ],
            })),
          };
        })
        .catch(() => ({ menu: [] })),
      can("nav.clients")
        ? fetchAllCustomers(restaurant.id)
            .then((rows): Partial<DynamicData> => ({
              customers: rows.slice(0, 200).map((c) => ({
                id: `cust.${c.id}`,
                label: c.name,
                hint: c.email || c.phone || "—",
                group: "Clients",
                resource: "nav.clients",
                icon: <User size={14} />,
                onSelect: (nav) => nav("/clients"),
                keywords: [c.email, c.phone, ...(c.tags ?? [])].filter(
                  Boolean
                ) as string[],
              })),
            }))
            .catch(() => ({ customers: [] }))
        : Promise.resolve({ customers: [] as Result[] }),
      listReviews()
        .then((rows): Partial<DynamicData> => ({
          reviews: rows.slice(0, 50).map((r) => ({
            id: `review.${r.id}`,
            label: r.author,
            hint: `${r.source} · ${r.rating}/${r.scale}`,
            group: "Avis",
            resource: "nav.avis",
            icon: <MessageSquare size={14} />,
            onSelect: (nav) => nav("/avis"),
            keywords: [r.text, r.source],
          })),
        }))
        .catch(() => ({ reviews: [] })),
      listTeam()
        .then((rows): Partial<DynamicData> => ({
          team: rows.map((m) => ({
            id: `team.${m.id}`,
            label: m.name,
            hint: m.role,
            group: "Équipe",
            resource: "nav.equipe",
            icon: <Users size={14} />,
            onSelect: (nav) => nav("/equipe"),
            keywords: [m.role, m.kind],
          })),
        }))
        .catch(() => ({ team: [] })),
    ];

    Promise.all(tasks)
      .then((parts) => {
        if (cancelled) return;
        const merged = parts.reduce<DynamicData>(
          (acc, p) => ({ ...acc, ...p }),
          { ...EMPTY_DYNAMIC }
        );
        setDynamic(merged);
      })
      .catch((e) => {
        if (!cancelled) setDynError(extractErrorMessage(e));
      })
      .finally(() => {
        if (!cancelled) setDynLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, restaurant?.id, can]);

  const items = useMemo(() => {
    const all: Result[] = [
      ...STATIC,
      ...dynamic.reservations,
      ...dynamic.orders,
      ...dynamic.menu,
      ...dynamic.customers,
      ...dynamic.reviews,
      ...dynamic.team,
    ];
    const allowed = all.filter((a) => {
      if (a.id === "nav.parametres") return isAtLeast("manager");
      if (!a.resource) return true;
      return can(a.resource);
    });
    if (!query.trim()) {
      return allowed.filter((a) => a.group === "Navigation" || a.group === "Actions");
    }
    return allowed
      .map((a) => ({ a, s: score(a.label, a.keywords, query) }))
      .filter((x) => x.s >= 0)
      .sort((x, y) => y.s - x.s)
      .slice(0, 30)
      .map((x) => x.a);
  }, [query, can, isAtLeast, dynamic]);

  useEffect(() => {
    if (activeIdx >= items.length) setActiveIdx(0);
  }, [items.length, activeIdx]);

  if (!open) return null;

  const groups = items.reduce<Record<string, Result[]>>((acc, a) => {
    (acc[a.group] ||= []).push(a);
    return acc;
  }, {});

  const select = (a: Result) => {
    a.onSelect(navigate);
    onClose();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(items.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const a = items[activeIdx];
      if (a) select(a);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center px-4 bg-black/60 backdrop-blur-[2px] animate-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[640px] bg-bg-1 border border-line-2 rounded-[14px] shadow-[0_24px_60px_rgba(0,0,0,0.5)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-[10px] px-4 py-[12px] border-b border-line">
          <Search size={16} className="text-ink-3 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIdx(0);
            }}
            placeholder="Rechercher partout : page, résa, commande, plat, client…"
            className="flex-1 bg-transparent border-0 outline-none text-[14px] text-ink-1 placeholder:text-ink-4"
          />
          {dynLoading && (
            <span className="mono text-[10px] text-ink-4">Indexation…</span>
          )}
          <span className="mono text-[10px] text-ink-4 px-[6px] py-[2px] border border-line-2 rounded">
            ESC
          </span>
        </div>

        {dynError && (
          <div className="px-4 py-2 text-[11.5px] text-danger border-b border-line">
            {dynError}
          </div>
        )}

        <div className="max-h-[60vh] overflow-y-auto py-1">
          {items.length === 0 ? (
            <div className="px-4 py-8 text-center text-[12.5px] text-ink-4">
              Aucun résultat pour « {query} ».
            </div>
          ) : (
            GROUP_ORDER.map((g) => {
              const list = groups[g];
              if (!list?.length) return null;
              return (
                <div key={g} className="py-[6px]">
                  <div className="px-4 py-[4px] text-[10px] uppercase tracking-[0.12em] text-ink-4 font-semibold">
                    {g}
                  </div>
                  {list.map((a) => {
                    const idx = items.indexOf(a);
                    const active = idx === activeIdx;
                    return (
                      <button
                        key={a.id}
                        onMouseEnter={() => setActiveIdx(idx)}
                        onClick={() => select(a)}
                        className={cn(
                          "w-full flex items-center gap-[10px] px-4 py-[9px] text-left text-[13px] transition-colors",
                          active ? "bg-bg-2 text-ink-1" : "text-ink-2 hover:bg-bg-2"
                        )}
                      >
                        <span className="text-ink-3 flex-shrink-0">{a.icon}</span>
                        <span className="flex-1 min-w-0 truncate">{a.label}</span>
                        {a.hint && (
                          <span className="text-[11px] text-ink-4 truncate max-w-[220px]">
                            {a.hint}
                          </span>
                        )}
                        {active && (
                          <ArrowRight size={12} className="text-ember-soft flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        <div className="px-4 py-[8px] border-t border-line bg-bg-1 flex items-center gap-3 text-[10.5px] text-ink-4">
          <span className="inline-flex items-center gap-[5px]">
            <kbd className="mono px-[5px] py-[1px] border border-line-2 rounded">↑↓</kbd>
            naviguer
          </span>
          <span className="inline-flex items-center gap-[5px]">
            <kbd className="mono px-[5px] py-[1px] border border-line-2 rounded">↵</kbd>
            valider
          </span>
          <span className="ml-auto inline-flex items-center gap-[5px]">
            <kbd className="mono px-[5px] py-[1px] border border-line-2 rounded">⌘K</kbd>
            ouvrir
          </span>
        </div>
      </div>
    </div>
  );
}
