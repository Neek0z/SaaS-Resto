import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  Code,
  LogOut,
  MessageCircle,
  Plus,
  Search,
  Settings as SettingsIcon,
  Star,
  Users as UsersIcon,
  UtensilsCrossed,
} from "lucide-react";
import { RESTO } from "@/lib/mock-data";
import { useAuth } from "@/contexts/AuthContext";
import { PLAN_LABELS } from "@/config/plans";
import { ROLE_LABELS, ROLE_ORDER, isRoleAtLeast, type Role } from "@/config/roles";
import { cn } from "@/lib/utils";

type PopoverId = "notif" | "chat" | "menu" | "rolesim";

type NotifKind = "reservation" | "avis" | "stock" | "equipe" | "commande";

type Notif = {
  id: string;
  kind: NotifKind;
  text: string;
  ago: string;
  unread: boolean;
};

const NOTIFS: Notif[] = [
  {
    id: "n1",
    kind: "reservation",
    text: "Nouvelle réservation · 4 couverts · 20h30 · Pierre Martin",
    ago: "il y a 2 min",
    unread: true,
  },
  {
    id: "n2",
    kind: "avis",
    text: "Avis 2★ sur Google · « Service un peu lent ce soir »",
    ago: "il y a 18 min",
    unread: true,
  },
  {
    id: "n3",
    kind: "stock",
    text: "Stock bas · Côte de bœuf maturée · 2 portions restantes",
    ago: "il y a 32 min",
    unread: true,
  },
  {
    id: "n4",
    kind: "equipe",
    text: "Léa Moreau a pointé son arrivée à 16h47",
    ago: "il y a 1 h",
    unread: false,
  },
  {
    id: "n5",
    kind: "commande",
    text: "Commande #1208 servie · table 12",
    ago: "il y a 2 h",
    unread: false,
  },
];

const NOTIF_META: Record<NotifKind, { Icon: typeof Bell; tint: string; label: string }> = {
  reservation: { Icon: CalendarDays, tint: "var(--ember-soft)", label: "Réservation" },
  avis: { Icon: Star, tint: "var(--amber)", label: "Avis" },
  stock: { Icon: UtensilsCrossed, tint: "var(--danger)", label: "Stock" },
  equipe: { Icon: UsersIcon, tint: "var(--ink-3)", label: "Équipe" },
  commande: { Icon: ClipboardList, tint: "var(--ink-3)", label: "Commande" },
};

type Conversation = {
  id: string;
  name: string;
  role: string;
  initials: string;
  preview: string;
  ago: string;
  unread: number;
  online: boolean;
};

const CONVERSATIONS: Conversation[] = [
  {
    id: "c1",
    name: "Léa Moreau",
    role: "Manager salle",
    initials: "LM",
    preview: "Je prends la table 8, ils viennent d'arriver.",
    ago: "16h52",
    unread: 2,
    online: true,
  },
  {
    id: "c2",
    name: "Théo Laurent",
    role: "Chef de cuisine",
    initials: "TL",
    preview: "Plus de tartare ce soir, on remplace par carpaccio.",
    ago: "16h45",
    unread: 1,
    online: true,
  },
  {
    id: "c3",
    name: "Service Soir",
    role: "Groupe · 5 membres",
    initials: "SS",
    preview: "Marc : Pleine salle ce soir, on reste concentrés 💪",
    ago: "16h30",
    unread: 0,
    online: true,
  },
  {
    id: "c4",
    name: "Karim Aziz",
    role: "Plonge",
    initials: "KA",
    preview: "OK pour ouvrir demain à 9h.",
    ago: "15h12",
    unread: 0,
    online: false,
  },
];

export function Topbar() {
  const navigate = useNavigate();
  const { user, restaurant, signOut, actualRole, role, roleOverride, setRoleOverride } = useAuth();
  const [time, setTime] = useState(() => currentTime());
  const [openPopover, setOpenPopover] = useState<PopoverId | null>(null);
  const [notifs, setNotifs] = useState(NOTIFS);
  const containersRef = useRef<Record<PopoverId, HTMLDivElement | null>>({
    notif: null,
    chat: null,
    menu: null,
    rolesim: null,
  });

  useEffect(() => {
    const id = setInterval(() => setTime(currentTime()), 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!openPopover) return;
    const onClick = (e: MouseEvent) => {
      const node = containersRef.current[openPopover];
      if (node && !node.contains(e.target as Node)) {
        setOpenPopover(null);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [openPopover]);

  const toggle = (id: PopoverId) =>
    setOpenPopover((cur) => (cur === id ? null : id));

  const displayName = restaurant?.name ?? user?.email ?? RESTO.name;
  const initials = (restaurant?.name ?? user?.email ?? "?").slice(0, 1).toUpperCase();

  const unreadNotifs = notifs.filter((n) => n.unread).length;
  const unreadChats = CONVERSATIONS.reduce((sum, c) => sum + c.unread, 0);

  const markAllRead = () => setNotifs((arr) => arr.map((n) => ({ ...n, unread: false })));

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div
      className="flex items-center gap-4 py-5 sticky top-0 z-10"
      style={{
        background: "linear-gradient(180deg, var(--bg-0) 60%, transparent)",
      }}
    >
      <div className="flex-1">
        <div className="mono text-[12px] text-ink-3 mb-[2px] uppercase tracking-wide">
          {RESTO.date.toUpperCase()} · {RESTO.service.toUpperCase()}
        </div>
        <h1 className="display font-medium text-[28px] m-0 leading-tight">
          Bonsoir {displayName},{" "}
          <em className="not-italic italic text-ember-soft font-normal">
            le service commence.
          </em>
        </h1>
      </div>

      <span className="live-dot">Live · {time}</span>

      <div className="flex items-center gap-2 bg-bg-1 border border-line rounded-[10px] px-3 py-[7px] w-[240px] text-ink-3 text-[13px] hover:border-line-2 cursor-pointer transition-colors">
        <Search size={15} />
        <span className="flex-1 text-ink-3">Rechercher commande, action…</span>
        <span className="mono text-[10px] text-ink-4 px-[5px] py-[1px] border border-line-2 rounded">
          ⌘K
        </span>
      </div>

      {actualRole === "developer" && (
        <div
          ref={(el) => {
            containersRef.current.rolesim = el;
          }}
          className="relative"
        >
          <button
            onClick={() => toggle("rolesim")}
            className={cn(
              "flex items-center gap-2 px-[10px] py-[7px] rounded-[10px] border text-[12px] transition-colors",
              roleOverride
                ? "border-ember text-ember-soft bg-bg-2"
                : openPopover === "rolesim"
                ? "border-line-2 bg-bg-2 text-ink-1"
                : "border-line bg-bg-1 text-ink-3 hover:bg-bg-2 hover:text-ink-1"
            )}
            title="Simuler un rôle (dev)"
          >
            <Code size={13} />
            <span className="mono uppercase tracking-[0.06em] text-[10.5px]">
              {ROLE_LABELS[role]}
            </span>
            <ChevronDown size={12} />
          </button>
          {openPopover === "rolesim" && (
            <RoleSimPopover
              effective={role}
              override={roleOverride}
              onPick={(r) => {
                setRoleOverride(r);
                setOpenPopover(null);
              }}
              onReset={() => {
                setRoleOverride(null);
                setOpenPopover(null);
              }}
            />
          )}
        </div>
      )}

      <div
        ref={(el) => {
          containersRef.current.chat = el;
        }}
        className="relative"
      >
        <button
          className={cn("icon-btn relative", openPopover === "chat" && "is-active")}
          title="Messagerie équipe"
          onClick={() => toggle("chat")}
        >
          <MessageCircle size={15} />
          {unreadChats > 0 && <CountBadge value={unreadChats} />}
        </button>
        {openPopover === "chat" && (
          <ChatPopover
            conversations={CONVERSATIONS}
            unread={unreadChats}
            onClose={() => setOpenPopover(null)}
          />
        )}
      </div>

      <div
        ref={(el) => {
          containersRef.current.notif = el;
        }}
        className="relative"
      >
        <button
          className={cn("icon-btn relative", openPopover === "notif" && "is-active")}
          title="Notifications"
          onClick={() => toggle("notif")}
        >
          <Bell size={15} />
          {unreadNotifs > 0 && <CountBadge value={unreadNotifs} />}
        </button>
        {openPopover === "notif" && (
          <NotifPopover
            notifs={notifs}
            unread={unreadNotifs}
            onMarkAll={markAllRead}
            onClose={() => setOpenPopover(null)}
          />
        )}
      </div>

      <button
        className="btn-primary"
        onClick={() => navigate("/reservations", { state: { openNew: true } })}
      >
        <Plus size={14} />
        Nouvelle résa
      </button>

      <div
        ref={(el) => {
          containersRef.current.menu = el;
        }}
        className="relative"
      >
        <button
          onClick={() => toggle("menu")}
          className={cn(
            "flex items-center gap-2 pl-[6px] pr-[8px] py-[5px] rounded-[10px] border transition-colors",
            openPopover === "menu" ? "border-line-2 bg-bg-2" : "border-line bg-bg-1 hover:bg-bg-2"
          )}
          title="Compte"
        >
          <span className="avatar-circle w-7 h-7 text-[12px]">{initials}</span>
          <ChevronDown size={13} className="text-ink-3" />
        </button>

        {openPopover === "menu" && (
          <div className="absolute right-0 top-[calc(100%+6px)] w-[240px] bg-bg-1 border border-line-2 rounded-[12px] shadow-lg overflow-hidden z-30">
            <div className="px-3 py-3 border-b border-line">
              <div className="text-[12.5px] font-semibold truncate">{displayName}</div>
              <div className="text-[11px] text-ink-4 truncate mono">{user?.email ?? "—"}</div>
              {restaurant && (
                <div className="mt-2 inline-flex items-center gap-[6px] text-[10.5px] mono uppercase tracking-[0.08em] text-ember-soft">
                  ● Plan {PLAN_LABELS[restaurant.plan]}
                </div>
              )}
            </div>
            {isRoleAtLeast(role, "manager") && (
              <button
                onClick={() => {
                  setOpenPopover(null);
                  navigate("/parametres");
                }}
                className="w-full flex items-center gap-[10px] px-3 py-[9px] text-[12.5px] text-ink-2 hover:bg-bg-2 transition-colors"
              >
                <SettingsIcon size={13} className="text-ink-3" />
                Paramètres
              </button>
            )}
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-[10px] px-3 py-[9px] text-[12.5px] text-danger hover:bg-danger/10 transition-colors border-t border-line"
            >
              <LogOut size={13} />
              Se déconnecter
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CountBadge({ value }: { value: number }) {
  return (
    <span
      className="absolute -top-1 -right-1 mono text-[9px] font-bold leading-none px-[5px] py-[3px] rounded-full text-cream"
      style={{
        background: "var(--ember)",
        boxShadow: "0 0 0 2px var(--bg-0)",
        minWidth: 16,
        textAlign: "center",
      }}
    >
      {value > 9 ? "9+" : value}
    </span>
  );
}

function NotifPopover({
  notifs,
  unread,
  onMarkAll,
  onClose,
}: {
  notifs: Notif[];
  unread: number;
  onMarkAll: () => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute right-0 top-[calc(100%+8px)] w-[380px] bg-bg-1 border border-line-2 rounded-[12px] shadow-lg overflow-hidden z-30 animate-in">
      <div className="flex items-center justify-between px-4 pt-3 pb-[10px] border-b border-line">
        <div className="flex items-baseline gap-2">
          <div className="display font-medium text-[15px]">Notifications</div>
          <div className="text-[10.5px] mono uppercase tracking-[0.08em] text-ink-4">
            {unread} non lue{unread > 1 ? "s" : ""}
          </div>
        </div>
        {unread > 0 && (
          <button
            onClick={onMarkAll}
            className="text-[11px] text-ember-soft hover:underline"
          >
            Tout marquer lu
          </button>
        )}
      </div>

      <div className="max-h-[420px] overflow-y-auto">
        {notifs.length === 0 ? (
          <EmptyState text="Aucune notification pour l'instant." />
        ) : (
          <ul className="flex flex-col">
            {notifs.map((n) => {
              const meta = NOTIF_META[n.kind];
              const Icon = meta.Icon;
              return (
                <li
                  key={n.id}
                  className={cn(
                    "relative flex items-start gap-3 px-4 py-3 border-b border-line last:border-b-0 hover:bg-bg-2 transition-colors",
                    n.unread && "bg-bg-2/40"
                  )}
                >
                  <span
                    className="w-8 h-8 rounded-[10px] grid place-items-center flex-shrink-0 mt-[1px]"
                    style={{
                      background: "var(--bg-2)",
                      border: "1px solid var(--line)",
                      color: meta.tint,
                    }}
                  >
                    <Icon size={14} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="chip-uppercase text-[10px] mb-[2px]" style={{ color: meta.tint }}>
                      {meta.label}
                    </div>
                    <div className="text-[12.5px] text-ink-1 leading-snug">{n.text}</div>
                    <div className="mono text-[10.5px] text-ink-4 mt-1">{n.ago}</div>
                  </div>
                  {n.unread && (
                    <span
                      className="w-[6px] h-[6px] rounded-full mt-[10px] flex-shrink-0"
                      style={{ background: "var(--ember)" }}
                      aria-label="Non lu"
                    />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="px-4 py-[10px] border-t border-line bg-bg-1">
        <button
          onClick={onClose}
          className="text-[11.5px] text-ink-3 hover:text-ink-1 transition-colors w-full text-center"
        >
          Fermer
        </button>
      </div>
    </div>
  );
}

function ChatPopover({
  conversations,
  unread,
  onClose,
}: {
  conversations: Conversation[];
  unread: number;
  onClose: () => void;
}) {
  const onlineCount = conversations.filter((c) => c.online).length;

  return (
    <div className="absolute right-0 top-[calc(100%+8px)] w-[380px] bg-bg-1 border border-line-2 rounded-[12px] shadow-lg overflow-hidden z-30 animate-in">
      <div className="flex items-center justify-between px-4 pt-3 pb-[10px] border-b border-line">
        <div className="flex items-baseline gap-2">
          <div className="display font-medium text-[15px]">Équipe</div>
          <div className="text-[10.5px] mono uppercase tracking-[0.08em] text-ink-4">
            {onlineCount} en ligne · {unread} non lu{unread > 1 ? "s" : ""}
          </div>
        </div>
      </div>

      <div className="max-h-[420px] overflow-y-auto">
        {conversations.length === 0 ? (
          <EmptyState text="Aucune conversation." />
        ) : (
          <ul className="flex flex-col">
            {conversations.map((c) => (
              <li
                key={c.id}
                className={cn(
                  "flex items-start gap-3 px-4 py-3 border-b border-line last:border-b-0 hover:bg-bg-2 transition-colors cursor-pointer",
                  c.unread > 0 && "bg-bg-2/40"
                )}
              >
                <div className="relative flex-shrink-0 mt-[1px]">
                  <span className="avatar-circle w-9 h-9 text-[12px]">{c.initials}</span>
                  {c.online && (
                    <span
                      className="absolute bottom-0 right-0 w-[10px] h-[10px] rounded-full"
                      style={{
                        background: "var(--ok)",
                        boxShadow: "0 0 0 2px var(--bg-1)",
                      }}
                      aria-label="En ligne"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="text-[13px] font-semibold truncate">{c.name}</div>
                    <span className="mono text-[10.5px] text-ink-4 ml-auto flex-shrink-0">
                      {c.ago}
                    </span>
                  </div>
                  <div className="text-[10.5px] text-ink-4 mb-[3px]">{c.role}</div>
                  <div
                    className={cn(
                      "text-[12px] leading-snug truncate",
                      c.unread > 0 ? "text-ink-1 font-medium" : "text-ink-3"
                    )}
                  >
                    {c.preview}
                  </div>
                </div>
                {c.unread > 0 && (
                  <span
                    className="mono text-[10px] font-bold leading-none px-[6px] py-[3px] rounded-full text-cream flex-shrink-0 mt-[2px]"
                    style={{ background: "var(--ember)", minWidth: 18, textAlign: "center" }}
                  >
                    {c.unread}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="px-4 py-[10px] border-t border-line bg-bg-1">
        <button
          onClick={onClose}
          className="text-[11.5px] text-ink-3 hover:text-ink-1 transition-colors w-full text-center"
        >
          Fermer
        </button>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="px-4 py-8 text-center text-[12.5px] text-ink-4">{text}</div>
  );
}

function RoleSimPopover({
  effective,
  override,
  onPick,
  onReset,
}: {
  effective: Role;
  override: Role | null;
  onPick: (role: Role) => void;
  onReset: () => void;
}) {
  return (
    <div className="absolute right-0 top-[calc(100%+8px)] w-[260px] bg-bg-1 border border-line-2 rounded-[12px] shadow-lg overflow-hidden z-30 animate-in">
      <div className="px-4 pt-3 pb-[10px] border-b border-line">
        <div className="flex items-center gap-2 mb-1">
          <Code size={13} className="text-ember-soft" />
          <div className="display font-medium text-[14px]">Vue par rôle</div>
        </div>
        <div className="text-[11px] text-ink-3 leading-snug">
          Affiche le dashboard comme si tu étais ce rôle. Session uniquement.
        </div>
      </div>

      <ul className="flex flex-col py-1">
        {ROLE_ORDER.map((r) => {
          const isActive = effective === r;
          return (
            <li key={r}>
              <button
                onClick={() => onPick(r)}
                className={cn(
                  "w-full flex items-center gap-2 px-4 py-[9px] text-[12.5px] text-left transition-colors",
                  isActive ? "text-ember-soft bg-bg-2" : "text-ink-2 hover:bg-bg-2 hover:text-ink-1"
                )}
              >
                <span
                  className={cn(
                    "w-[6px] h-[6px] rounded-full",
                    isActive ? "bg-ember" : "bg-bg-3"
                  )}
                />
                {ROLE_LABELS[r]}
                {isActive && (
                  <span className="ml-auto mono text-[10px] uppercase tracking-[0.08em] text-ember-soft">
                    actif
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {override && (
        <div className="px-4 py-[10px] border-t border-line bg-bg-1">
          <button
            onClick={onReset}
            className="text-[11.5px] text-ink-3 hover:text-ink-1 transition-colors w-full text-center"
          >
            Revenir à mon rôle réel
          </button>
        </div>
      )}
    </div>
  );
}

function currentTime() {
  const d = new Date();
  return (
    String(d.getHours()).padStart(2, "0") +
    ":" +
    String(d.getMinutes()).padStart(2, "0")
  );
}
