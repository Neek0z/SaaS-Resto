import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isSupabaseConfigured } from "@/lib/supabase-env";
import { useAuth } from "@/contexts/AuthContext";
import { SupabaseMissing } from "./SupabaseMissing";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { user, loading } = useAuth();

  if (!isSupabaseConfigured) {
    return <SupabaseMissing />;
  }

  if (loading) {
    return <AuthLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}

function AuthLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-0">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-line border-t-ember-soft animate-spin" />
        <div className="mono text-[11px] text-ink-4 uppercase tracking-[0.12em]">
          Chargement…
        </div>
      </div>
    </div>
  );
}
