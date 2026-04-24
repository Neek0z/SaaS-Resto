import type { ReactNode } from "react";

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: ReactNode;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-bg-0">
      {/* Left : marque */}
      <aside
        className="hidden md:flex flex-col justify-between p-10 border-r border-line relative overflow-hidden"
        style={{
          background:
            "linear-gradient(180deg, var(--bg-1) 0%, var(--bg-0) 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.12] pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 30% 20%, var(--ember), transparent 55%)",
          }}
        />
        <div className="relative">
          <div className="chip-uppercase mb-3">Sévère. · SaaS Restauration</div>
          <h1 className="display font-medium text-[34px] leading-tight m-0">
            Le pilotage{" "}
            <em className="not-italic italic text-ember-soft font-normal">
              complet
            </em>{" "}
            de votre établissement.
          </h1>
          <p className="text-[13px] text-ink-3 mt-4 max-w-[360px]">
            Commandes, réservations, fidélité, menu numérique — une console
            unique, pensée pour le service.
          </p>
        </div>

        <div className="relative mono text-[11px] text-ink-4 uppercase tracking-[0.12em]">
          v2.4 · Brasserie édition
        </div>
      </aside>

      {/* Right : formulaire */}
      <main className="flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-[400px]">
          <div className="mb-7">
            <h2 className="display font-medium text-[26px] leading-tight m-0">
              {title}
            </h2>
            {subtitle && (
              <p className="text-[13px] text-ink-3 mt-2">{subtitle}</p>
            )}
          </div>
          {children}
          {footer && (
            <div className="mt-6 text-[12.5px] text-ink-3 text-center">
              {footer}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export function AuthField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-[6px]">
      <span className="chip-uppercase">{label}</span>
      {children}
    </label>
  );
}

export function AuthInput(
  props: React.InputHTMLAttributes<HTMLInputElement>
) {
  return (
    <input
      {...props}
      className="bg-bg-2 border border-line rounded-[10px] px-3 py-[10px] text-[13px] text-ink-1 outline-none focus:border-line-2 transition-colors"
    />
  );
}

export function AuthError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="text-[12px] text-danger bg-danger/10 border border-danger/30 rounded-[8px] px-3 py-[8px]">
      {message}
    </div>
  );
}

export function AuthSuccess({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="text-[12px] text-ok bg-ok/10 border border-ok/30 rounded-[8px] px-3 py-[8px]">
      {message}
    </div>
  );
}
