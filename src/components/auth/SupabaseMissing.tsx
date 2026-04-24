import { AlertTriangle } from "lucide-react";

export function SupabaseMissing() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-0 px-6">
      <div className="max-w-[480px] w-full p-6 rounded-[14px] border border-danger/40 bg-bg-1">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={16} className="text-danger" />
          <div className="chip-uppercase !text-danger">Configuration Supabase manquante</div>
        </div>
        <h2 className="display font-medium text-[22px] leading-tight m-0 mb-3">
          L'authentification nécessite Supabase.
        </h2>
        <p className="text-[13px] text-ink-3 mb-4">
          Définissez les variables d'environnement ci-dessous dans un fichier{" "}
          <span className="mono text-ink-2">.env</span> à la racine du projet puis relancez le
          serveur.
        </p>
        <pre className="mono text-[11.5px] text-ink-2 bg-bg-2 border border-line rounded-[8px] p-3 overflow-x-auto">
{`VITE_SUPABASE_URL="https://xxx.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJ..."`}
        </pre>
      </div>
    </div>
  );
}
