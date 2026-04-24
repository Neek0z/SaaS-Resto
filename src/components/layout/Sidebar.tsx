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
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Item = {
  to: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
};

const pilotage: Item[] = [
  { to: "/", label: "Tableau de bord", icon: <BarChart3 size={17} /> },
  { to: "/commandes", label: "Commandes", icon: <ClipboardList size={17} />, badge: "12" },
  { to: "/reservations", label: "Réservations", icon: <CalendarDays size={17} />, badge: "11" },
  { to: "/menu", label: "Menu & stocks", icon: <UtensilsCrossed size={17} /> },
  { to: "/avis", label: "Avis clients", icon: <Star size={17} /> },
  { to: "/equipe", label: "Équipe", icon: <Users size={17} /> },
  { to: "/menu-numerique", label: "Menu numérique", icon: <QrCode size={17} /> },
  { to: "/fidelite", label: "Fidélité", icon: <Heart size={17} />, badge: "324" },
];

export function Sidebar() {
  return (
    <aside className="bg-bg-1 border-r border-line px-4 py-[22px] flex flex-col gap-1 sticky top-0 h-screen">
      <div className="flex items-center gap-[10px] px-2 pt-[6px] pb-5 border-b border-line mb-4">
        <div
          className="w-[34px] h-[34px] rounded-[10px] grid place-items-center text-cream font-bold text-[18px] display"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, var(--ember) 0%, var(--ember-deep) 60%, #5c2a0e 100%)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.2), 0 0 0 1px var(--line-2), 0 4px 12px rgba(232,115,58,0.15)",
          }}
        >
          S
        </div>
        <div>
          <div className="display font-semibold text-[17px] leading-tight">
            Sévère<span className="text-ember">.</span>
          </div>
          <div className="text-[11px] text-ink-3 mt-[1px]">Salle & Cuisine</div>
        </div>
      </div>

      <NavSection label="Pilotage" />
      {pilotage.map((item) => (
        <NavItem key={item.to} {...item} />
      ))}

      <NavSection label="Établissement" />
      <NavItem to="/parametres" label="Paramètres" icon={<Settings size={17} />} />

      <div className="mt-auto pt-3 px-[10px] border-t border-line flex items-center gap-[10px]">
        <div className="avatar-circle w-8 h-8 text-xs">MS</div>
        <div className="min-w-0 flex-1">
          <div className="text-[12.5px] font-semibold truncate">Marc Sévère</div>
          <div className="text-[10.5px] text-ink-3">Gérant · Paris 11ᵉ</div>
        </div>
      </div>
    </aside>
  );
}

function NavSection({ label }: { label: string }) {
  return (
    <div className="text-[10px] uppercase tracking-[0.12em] text-ink-4 px-[10px] pt-[14px] pb-[6px]">
      {label}
    </div>
  );
}

function NavItem({ to, label, icon, badge }: Item) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-[11px] px-[10px] py-[9px] rounded-lg text-[13.5px] font-medium transition-all relative",
          isActive
            ? "text-ember-soft shadow-[inset_2px_0_0_var(--ember)]"
            : "text-ink-2 hover:bg-bg-2 hover:text-ink-1"
        )
      }
      style={({ isActive }) =>
        isActive
          ? {
              background:
                "linear-gradient(90deg, rgba(232,115,58,0.15), rgba(232,115,58,0.04))",
            }
          : undefined
      }
    >
      <span className="opacity-90">{icon}</span>
      <span>{label}</span>
      {badge && (
        <span className="ml-auto bg-ember text-[#1b0d04] text-[10px] font-bold px-[6px] py-[1px] rounded-full min-w-[18px] text-center">
          {badge}
        </span>
      )}
    </NavLink>
  );
}
