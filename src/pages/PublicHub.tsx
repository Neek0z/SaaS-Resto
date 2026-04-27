import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { CalendarCheck, ChevronRight, Heart, MapPin, Star, UtensilsCrossed } from "lucide-react";
import {
  fetchPublicReservationInfo,
  type PublicResaInfo,
} from "@/lib/api/public-reservation";
import { extractErrorMessage } from "@/lib/errors";

type State =
  | { status: "loading" }
  | { status: "not_found" }
  | { status: "error"; message: string }
  | { status: "ready"; data: PublicResaInfo };

export default function PublicHub() {
  const { slug } = useParams<{ slug: string }>();
  const [params] = useSearchParams();
  const table = params.get("table") ?? undefined;
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    if (!slug) {
      setState({ status: "not_found" });
      return;
    }
    setState({ status: "loading" });
    fetchPublicReservationInfo(slug)
      .then((data) => {
        if (cancelled) return;
        if (!data) {
          setState({ status: "not_found" });
          return;
        }
        setState({ status: "ready", data });
      })
      .catch((e) => {
        if (cancelled) return;
        setState({ status: "error", message: extractErrorMessage(e) });
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    document.body.classList.add("public-menu-mode");
    return () => document.body.classList.remove("public-menu-mode");
  }, []);

  if (state.status === "loading") {
    return (
      <main className="min-h-screen bg-bg-0 grid place-items-center text-ink-3 text-[13px]">
        Chargement…
      </main>
    );
  }

  if (state.status === "not_found") {
    return (
      <main className="min-h-screen bg-bg-0 grid place-items-center px-6">
        <div className="text-center max-w-sm">
          <div className="display text-[28px] font-medium mb-2">Établissement introuvable</div>
          <div className="text-[13px] text-ink-3">
            L&apos;adresse <span className="mono text-ink-2">/chez/{slug}</span> ne correspond
            à aucun restaurant publié.
          </div>
        </div>
      </main>
    );
  }

  if (state.status === "error") {
    return (
      <main className="min-h-screen bg-bg-0 grid place-items-center px-6">
        <div className="text-center max-w-sm">
          <div className="display text-[22px] font-medium mb-2 text-danger">
            Une erreur est survenue
          </div>
          <div className="text-[12px] text-ink-3 mono">{state.message}</div>
        </div>
      </main>
    );
  }

  const r = state.data.restaurant;
  const menuHref = table ? `/carte/${r.slug}?table=${encodeURIComponent(table)}` : `/carte/${r.slug}`;

  return (
    <main className="min-h-screen bg-bg-0 text-ink-1">
      <header className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 opacity-50"
          style={{
            background:
              "radial-gradient(circle at 30% 20%, var(--ember) 0%, transparent 55%), radial-gradient(circle at 75% 90%, var(--ember-deep) 0%, transparent 60%)",
          }}
        />
        <div className="relative max-w-[480px] mx-auto px-6 pt-12 pb-8 text-center">
          {r.logo_url ? (
            <img
              src={r.logo_url}
              alt={r.name}
              className="w-[72px] h-[72px] rounded-2xl mx-auto mb-4 object-cover border border-line-2 shadow-lg"
            />
          ) : (
            <div
              className="w-[72px] h-[72px] rounded-2xl mx-auto mb-4 grid place-items-center display text-[32px] font-bold text-cream border border-line-2 shadow-lg"
              style={{
                background:
                  "radial-gradient(circle at 30% 30%, var(--ember) 0%, var(--ember-deep) 60%, #5c2a0e 100%)",
              }}
            >
              {r.name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="chip-uppercase mb-2">Bienvenue chez</div>
          <h1 className="display font-medium text-[32px] leading-tight m-0">
            {r.name}
          </h1>
          {table && (
            <div className="mt-3 inline-flex items-center gap-2 text-[12px] text-ember-soft mono uppercase tracking-[0.1em] bg-ember/10 border border-ember-deep/40 rounded-full px-3 py-[5px]">
              <MapPin size={12} />
              Table {table}
            </div>
          )}
        </div>
      </header>

      <section className="max-w-[480px] mx-auto px-6 pb-10 flex flex-col gap-3">
        <HubTile
          to={menuHref}
          icon={<UtensilsCrossed size={22} />}
          title="Voir la carte"
          subtitle="Plats, boissons, allergènes"
          accent="cream"
        />
        <HubTile
          to={`/reserver/${r.slug}`}
          icon={<CalendarCheck size={22} />}
          title="Réserver une table"
          subtitle="Demande envoyée à l'équipe"
          accent="ember"
        />
        <HubTile
          to={`/fidelite/${r.slug}`}
          icon={<Heart size={22} />}
          title="Programme fidélité"
          subtitle="Cumulez des points à chaque visite"
          accent="cream"
        />
        <HubTile
          to={`/fidelite/${r.slug}/compte`}
          icon={<Star size={22} />}
          title="Mon compte fidélité"
          subtitle="Voir mes points et mes récompenses"
          accent="cream"
        />
      </section>

      <footer className="text-center text-[10.5px] text-ink-4 pb-8 px-4 mono uppercase tracking-[0.12em]">
        Propulsé par Sévère
      </footer>
    </main>
  );
}

function HubTile({
  to,
  icon,
  title,
  subtitle,
  accent,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  accent: "ember" | "cream";
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-4 p-4 rounded-[14px] border border-line bg-bg-1 hover:bg-bg-2 hover:border-line-2 transition-all active:scale-[0.99]"
    >
      <span
        className="w-[52px] h-[52px] rounded-[12px] grid place-items-center flex-shrink-0"
        style={{
          background:
            accent === "ember"
              ? "linear-gradient(135deg, var(--ember), var(--ember-deep))"
              : "var(--bg-3)",
          color: accent === "ember" ? "var(--cream)" : "var(--ember-soft)",
          boxShadow: accent === "ember" ? "0 4px 16px rgba(232,115,58,0.25)" : undefined,
        }}
      >
        {icon}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[15px] font-semibold text-ink-1 leading-tight">
          {title}
        </span>
        <span className="block text-[12.5px] text-ink-3 mt-[3px]">{subtitle}</span>
      </span>
      <ChevronRight size={18} className="text-ink-3 flex-shrink-0" />
    </Link>
  );
}
