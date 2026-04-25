import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { RESTO } from "@/lib/mock-data";
import { useSidebar, SIDEBAR_WIDTHS } from "@/lib/sidebar";

export function AppShell() {
  const { collapsed } = useSidebar();
  const sidebarWidth = collapsed ? SIDEBAR_WIDTHS.collapsed : SIDEBAR_WIDTHS.expanded;
  return (
    <div
      className="grid min-h-screen relative z-[2]"
      style={{
        gridTemplateColumns: `${sidebarWidth}px 1fr`,
        transition: "grid-template-columns 280ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      <Sidebar />
      <main className="px-7 pb-10 overflow-x-hidden">
        <Topbar />
        <Outlet />
        <div className="mono text-center text-[11px] text-ink-4 py-6 mt-5 border-t border-line">
          Sévère. · SaaS Restauration · v2.4 — {RESTO.date}
        </div>
      </main>
    </div>
  );
}
