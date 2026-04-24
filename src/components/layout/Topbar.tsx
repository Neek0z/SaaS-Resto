import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ChevronDown, LogOut, MessageCircle, Plus, Search, Settings as SettingsIcon } from "lucide-react";
import { RESTO } from "@/lib/mock-data";
import { useAuth } from "@/contexts/AuthContext";
import { PLAN_LABELS } from "@/config/plans";
import { cn } from "@/lib/utils";

export function Topbar() {
  const navigate = useNavigate();
  const { user, restaurant, signOut } = useAuth();
  const [time, setTime] = useState(() => currentTime());
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const id = setInterval(() => setTime(currentTime()), 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  const displayName = restaurant?.name ?? user?.email ?? RESTO.name;
  const initials = (restaurant?.name ?? user?.email ?? "?").slice(0, 1).toUpperCase();

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

      <button className="icon-btn" title="Messagerie">
        <MessageCircle size={15} />
      </button>
      <button className="icon-btn" title="Notifications">
        <Bell size={15} />
        <span className="dot" />
      </button>
      <button
        className="btn-primary"
        onClick={() => navigate("/reservations", { state: { openNew: true } })}
      >
        <Plus size={14} />
        Nouvelle résa
      </button>

      <div ref={menuRef} className="relative">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className={cn(
            "flex items-center gap-2 pl-[6px] pr-[8px] py-[5px] rounded-[10px] border transition-colors",
            menuOpen ? "border-line-2 bg-bg-2" : "border-line bg-bg-1 hover:bg-bg-2"
          )}
          title="Compte"
        >
          <span className="avatar-circle w-7 h-7 text-[12px]">{initials}</span>
          <ChevronDown size={13} className="text-ink-3" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-[calc(100%+6px)] w-[240px] bg-bg-1 border border-line-2 rounded-[12px] shadow-lg overflow-hidden z-20">
            <div className="px-3 py-3 border-b border-line">
              <div className="text-[12.5px] font-semibold truncate">{displayName}</div>
              <div className="text-[11px] text-ink-4 truncate mono">{user?.email ?? "—"}</div>
              {restaurant && (
                <div className="mt-2 inline-flex items-center gap-[6px] text-[10.5px] mono uppercase tracking-[0.08em] text-ember-soft">
                  ● Plan {PLAN_LABELS[restaurant.plan]}
                </div>
              )}
            </div>
            <button
              onClick={() => {
                setMenuOpen(false);
                navigate("/parametres");
              }}
              className="w-full flex items-center gap-[10px] px-3 py-[9px] text-[12.5px] text-ink-2 hover:bg-bg-2 transition-colors"
            >
              <SettingsIcon size={13} className="text-ink-3" />
              Paramètres
            </button>
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

function currentTime() {
  const d = new Date();
  return (
    String(d.getHours()).padStart(2, "0") +
    ":" +
    String(d.getMinutes()).padStart(2, "0")
  );
}
