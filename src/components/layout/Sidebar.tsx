import { NavLink } from "react-router-dom";
import {
  BarChart3,
  ClipboardList,
  CalendarDays,
  UtensilsCrossed,
  Star,
  Users,
  QrCode,
  Heart,
  Sparkles,
  Mail,
  Settings,
  ChevronsLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermission } from "@/hooks/usePermission";
import { useRole } from "@/hooks/useRole";
import { useSidebar, SIDEBAR_WIDTHS } from "@/lib/sidebar";

type Item = {
  to: string;
  resource: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
};

const pilotage: Item[] = [
  { to: "/dashboard", resource: "nav.dashboard", label: "Tableau de bord", icon: <BarChart3 size={17} /> },
  { to: "/commandes", resource: "nav.commandes", label: "Commandes", icon: <ClipboardList size={17} />, badge: "12" },
  { to: "/reservations", resource: "nav.reservations", label: "Réservations", icon: <CalendarDays size={17} />, badge: "11" },
  { to: "/menu", resource: "nav.menu", label: "Menu & stocks", icon: <UtensilsCrossed size={17} /> },
  { to: "/avis", resource: "nav.avis", label: "Avis clients", icon: <Star size={17} /> },
  { to: "/equipe", resource: "nav.equipe", label: "Équipe", icon: <Users size={17} /> },
  { to: "/menu-numerique", resource: "nav.menu-numerique", label: "Menu numérique", icon: <QrCode size={17} /> },
  { to: "/qrcode", resource: "nav.qrcode", label: "QR codes", icon: <QrCode size={17} /> },
  { to: "/fidelite", resource: "nav.fidelite", label: "Fidélité", icon: <Heart size={17} />, badge: "324" },
  { to: "/evenements", resource: "nav.evenements", label: "Événements", icon: <Sparkles size={17} /> },
  { to: "/clients", resource: "nav.clients", label: "Clients", icon: <Mail size={17} /> },
];

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

export function Sidebar() {
  const { can } = usePermission();
  const { isAtLeast } = useRole();
  const { collapsed, toggle } = useSidebar();
  const visibleItems = pilotage.filter((item) => can(item.resource));
  const showSettings = isAtLeast("manager");

  return (
    <aside
      className="bg-bg-1 border-r border-line flex flex-col gap-1 sticky top-0 h-screen overflow-x-hidden"
      style={{
        width: collapsed ? SIDEBAR_WIDTHS.collapsed : SIDEBAR_WIDTHS.expanded,
        padding: collapsed ? "22px 10px" : "22px 16px",
        transition: `width 280ms ${EASE}, padding 280ms ${EASE}`,
      }}
    >
      {/* Brand block */}
      <div
        className={cn(
          "flex items-center gap-[10px] pt-[6px] pb-5 border-b border-line mb-4 relative",
          collapsed ? "justify-center px-0" : "px-2"
        )}
      >
        <div
          className="w-[34px] h-[34px] rounded-[10px] grid place-items-center text-cream font-bold text-[18px] display shrink-0"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, var(--ember) 0%, var(--ember-deep) 60%, #5c2a0e 100%)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.2), 0 0 0 1px var(--line-2), 0 4px 12px rgba(232,115,58,0.15)",
          }}
        >
          S
        </div>
        <div
          className="overflow-hidden whitespace-nowrap min-w-0"
          style={{
            width: collapsed ? 0 : 140,
            opacity: collapsed ? 0 : 1,
            transition: `width 280ms ${EASE}, opacity 200ms ${EASE} ${collapsed ? "0ms" : "120ms"}`,
          }}
        >
          <div className="display font-semibold text-[17px] leading-tight">
            Sévère<span className="text-ember">.</span>
          </div>
          <div className="text-[11px] text-ink-3 mt-[1px]">Salle & Cuisine</div>
        </div>

        {/* Toggle floating button */}
        <button
          onClick={toggle}
          aria-label={collapsed ? "Déplier la barre latérale" : "Replier la barre latérale"}
          title={collapsed ? "Déplier" : "Replier"}
          className="absolute -right-[12px] top-[14px] z-20 w-[24px] h-[24px] rounded-full bg-bg-2 border border-line-2 grid place-items-center text-ink-3 hover:text-ember-soft hover:border-ember/60 hover:shadow-[0_0_0_3px_rgba(232,115,58,0.12)] transition-all"
          style={{
            transform: collapsed ? "translateX(0) rotate(180deg)" : "translateX(0) rotate(0deg)",
            transition: `transform 280ms ${EASE}, color 200ms, border-color 200ms, box-shadow 200ms`,
          }}
        >
          <ChevronsLeft size={13} strokeWidth={2.4} />
        </button>
      </div>

      <NavSection label="Pilotage" collapsed={collapsed} />
      {visibleItems.map((item, i) => (
        <NavItem key={item.to} {...item} collapsed={collapsed} index={i} />
      ))}

      {showSettings && (
        <>
          <NavSection label="Établissement" collapsed={collapsed} />
          <NavItem
            to="/parametres"
            label="Paramètres"
            icon={<Settings size={17} />}
            collapsed={collapsed}
            index={visibleItems.length}
          />
        </>
      )}

      {/* User chip */}
      <div
        className={cn(
          "mt-auto pt-3 border-t border-line flex items-center",
          collapsed ? "justify-center px-0 gap-0" : "gap-[10px] px-[10px]"
        )}
        style={{ transition: `padding 280ms ${EASE}` }}
      >
        <div className="avatar-circle w-8 h-8 text-xs shrink-0">MS</div>
        <div
          className="min-w-0 flex-1 overflow-hidden whitespace-nowrap"
          style={{
            width: collapsed ? 0 : "auto",
            opacity: collapsed ? 0 : 1,
            transition: `opacity 200ms ${EASE} ${collapsed ? "0ms" : "120ms"}`,
          }}
        >
          <div className="text-[12.5px] font-semibold truncate">Marc Sévère</div>
          <div className="text-[10.5px] text-ink-3">Gérant · Paris 11ᵉ</div>
        </div>
      </div>
    </aside>
  );
}

function NavSection({ label, collapsed }: { label: string; collapsed: boolean }) {
  return (
    <div
      className="text-[10px] uppercase tracking-[0.12em] text-ink-4 overflow-hidden whitespace-nowrap"
      style={{
        height: collapsed ? 8 : 28,
        paddingLeft: collapsed ? 0 : 10,
        paddingTop: collapsed ? 6 : 14,
        paddingBottom: collapsed ? 2 : 6,
        opacity: collapsed ? 0 : 1,
        transition: `opacity 180ms ${EASE}, height 280ms ${EASE}, padding 280ms ${EASE}`,
      }}
    >
      {label}
    </div>
  );
}

function NavItem({
  to,
  label,
  icon,
  badge,
  collapsed,
  index,
}: Omit<Item, "resource"> & { collapsed: boolean; index: number }) {
  return (
    <NavLink
      to={to}
      end={to === "/dashboard"}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        cn(
          "group relative flex items-center rounded-lg text-[13.5px] font-medium transition-all",
          collapsed
            ? "justify-center h-[40px] w-[44px] mx-auto"
            : "gap-[11px] px-[10px] py-[9px]",
          isActive
            ? "text-ember-soft shadow-[inset_2px_0_0_var(--ember)]"
            : "text-ink-2 hover:bg-bg-2 hover:text-ink-1"
        )
      }
      style={({ isActive }) => ({
        background: isActive
          ? "linear-gradient(90deg, rgba(232,115,58,0.15), rgba(232,115,58,0.04))"
          : undefined,
        transition: `background 180ms ${EASE}, color 180ms, padding 280ms ${EASE}, width 280ms ${EASE}`,
        animation: collapsed ? undefined : `sb-fade-in 320ms ${EASE} ${index * 18}ms both`,
      })}
    >
      <span className="relative opacity-90 shrink-0 grid place-items-center">
        {icon}
        {/* Collapsed-mode badge dot */}
        {badge && collapsed && (
          <span
            className="absolute top-[-2px] right-[-3px] w-[7px] h-[7px] rounded-full bg-ember"
            style={{ boxShadow: "0 0 0 2px var(--bg-1)" }}
          />
        )}
      </span>

      <span
        className="overflow-hidden whitespace-nowrap"
        style={{
          width: collapsed ? 0 : "auto",
          opacity: collapsed ? 0 : 1,
          transition: `opacity 200ms ${EASE} ${collapsed ? "0ms" : "120ms"}`,
        }}
      >
        {label}
      </span>

      {badge && !collapsed && (
        <span
          className="ml-auto bg-ember text-[#1b0d04] text-[10px] font-bold px-[6px] py-[1px] rounded-full min-w-[18px] text-center"
          style={{
            opacity: collapsed ? 0 : 1,
            transition: `opacity 200ms ${EASE}`,
          }}
        >
          {badge}
        </span>
      )}

      {/* Collapsed tooltip */}
      {collapsed && (
        <span
          className="pointer-events-none absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2 z-50 px-[10px] py-[6px] rounded-[8px] bg-bg-3 border border-line-2 text-ink-1 text-[12px] font-medium whitespace-nowrap opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 shadow-[0_8px_24px_rgba(0,0,0,0.4)] transition-all duration-200"
          style={{ transitionTimingFunction: EASE }}
        >
          {label}
          {badge && (
            <span className="ml-2 bg-ember text-[#1b0d04] text-[9.5px] font-bold px-[5px] py-[1px] rounded-full">
              {badge}
            </span>
          )}
          <span
            className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0"
            style={{
              borderTop: "5px solid transparent",
              borderBottom: "5px solid transparent",
              borderRight: "5px solid var(--line-2)",
            }}
          />
        </span>
      )}
    </NavLink>
  );
}
