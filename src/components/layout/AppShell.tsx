import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useSidebar, SIDEBAR_WIDTHS } from "@/lib/sidebar";
import { formatLongDateFr } from "@/lib/utils";

export function AppShell() {
  const { collapsed, mobileOpen, setMobileOpen } = useSidebar();
  const sidebarWidth = collapsed ? SIDEBAR_WIDTHS.collapsed : SIDEBAR_WIDTHS.expanded;
  const location = useLocation();

  // Ferme le drawer mobile à chaque changement de route.
  useEffect(() => {
    if (mobileOpen) setMobileOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Empêche le scroll du body quand le drawer mobile est ouvert.
  useEffect(() => {
    if (mobileOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [mobileOpen]);

  return (
    <div className="relative min-h-screen z-[2] md:grid"
      style={{
        gridTemplateColumns: `${sidebarWidth}px 1fr`,
        transition: "grid-template-columns 280ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      {/* Sidebar : drawer sur mobile, colonne fixe sur desktop */}
      <div
        className={
          // Mobile : fixed drawer + transform ; desktop (md+) : statique dans la grille
          "fixed inset-y-0 left-0 z-50 md:static md:z-auto transform transition-transform duration-300 ease-out " +
          (mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0")
        }
      >
        <Sidebar />
      </div>

      {/* Backdrop mobile */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Fermer le menu"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] md:hidden"
        />
      )}

      <main className="px-4 sm:px-6 md:px-7 pb-10 overflow-x-hidden min-w-0">
        <Topbar />
        <Outlet />
        <div className="mono text-center text-[11px] text-ink-4 py-6 mt-5 border-t border-line">
          Sévère. · SaaS Restauration · v2.4 — {formatLongDateFr()}
        </div>
      </main>
    </div>
  );
}
