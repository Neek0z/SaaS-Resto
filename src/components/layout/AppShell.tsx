import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { RESTO } from "@/lib/mock-data";

export function AppShell() {
  return (
    <div
      className="grid min-h-screen relative z-[2]"
      style={{ gridTemplateColumns: "240px 1fr" }}
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
