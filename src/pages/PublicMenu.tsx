import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchPublicMenu, type PublicMenuPayload } from "@/lib/api/public-menu";
import { formatEuros } from "@/lib/utils";

type State =
  | { status: "loading" }
  | { status: "not_found" }
  | { status: "error"; message: string }
  | { status: "ready"; data: PublicMenuPayload };

export default function PublicMenu() {
  const { slug } = useParams<{ slug: string }>();
  const [state, setState] = useState<State>({ status: "loading" });
  const [activeCat, setActiveCat] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!slug) {
      setState({ status: "not_found" });
      return;
    }
    setState({ status: "loading" });
    fetchPublicMenu(slug)
      .then((data) => {
        if (cancelled) return;
        if (!data) {
          setState({ status: "not_found" });
          return;
        }
        setState({ status: "ready", data });
        const first = data.categories[0]?.id ?? null;
        setActiveCat(first);
      })
      .catch((e) => {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : String(e);
        setState({ status: "error", message: msg });
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
          <div className="display text-[28px] font-medium mb-2">Menu introuvable</div>
          <div className="text-[13px] text-ink-3">
            L&apos;adresse <span className="mono text-ink-2">/carte/{slug}</span> ne correspond
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

  return <PublicMenuContent data={state.data} activeCat={activeCat} setActiveCat={setActiveCat} />;
}

function PublicMenuContent({
  data,
  activeCat,
  setActiveCat,
}: {
  data: PublicMenuPayload;
  activeCat: string | null;
  setActiveCat: (id: string) => void;
}) {
  const { restaurant, categories } = data;
  const visibleCats = useMemo(
    () => categories.filter((c) => c.items.length > 0),
    [categories]
  );

  const onJump = (id: string) => {
    setActiveCat(id);
    const el = document.getElementById(`cat-${id}`);
    if (el) {
      const offset = 110;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  return (
    <main className="min-h-screen bg-bg-0 text-ink-1">
      {/* Hero */}
      <section className="relative pt-10 pb-6 px-6 max-w-[640px] mx-auto">
        <div
          className="absolute inset-x-0 top-0 h-[260px] -z-10 opacity-90"
          style={{
            background:
              "radial-gradient(ellipse 60% 80% at 50% 0%, rgba(232,115,58,0.18), transparent 70%)",
          }}
        />
        <div className="flex flex-col items-center text-center gap-3">
          {restaurant.logo_url ? (
            <img
              src={restaurant.logo_url}
              alt={restaurant.name}
              className="w-[72px] h-[72px] rounded-[18px] object-cover border border-line-2 shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
            />
          ) : (
            <div
              className="w-[72px] h-[72px] rounded-[18px] grid place-items-center text-cream font-bold text-[32px] display"
              style={{
                background:
                  "radial-gradient(circle at 30% 30%, var(--ember) 0%, var(--ember-deep) 60%, #5c2a0e 100%)",
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.2), 0 0 0 1px var(--line-2), 0 8px 24px rgba(232,115,58,0.18)",
              }}
            >
              {restaurant.name.trim().charAt(0).toUpperCase() || "•"}
            </div>
          )}
          <h1 className="display font-medium text-[28px] leading-tight m-0">
            {restaurant.name}
          </h1>
          <div className="text-[11px] text-ink-3 mono uppercase tracking-[0.18em]">
            Carte · service en salle
          </div>
        </div>
      </section>

      {/* Sticky category nav */}
      {visibleCats.length > 1 && (
        <nav
          className="sticky top-0 z-10 bg-bg-0/90 backdrop-blur border-b border-line"
          style={{ WebkitBackdropFilter: "blur(8px)" }}
        >
          <div className="max-w-[640px] mx-auto px-2">
            <div className="flex gap-1 overflow-x-auto py-2 scrollbar-none">
              {visibleCats.map((c) => {
                const active = c.id === activeCat;
                return (
                  <button
                    key={c.id}
                    onClick={() => onJump(c.id)}
                    className={
                      "shrink-0 px-3 py-[7px] rounded-full text-[12px] font-medium transition-colors whitespace-nowrap " +
                      (active
                        ? "bg-ember text-[#1b0d04]"
                        : "text-ink-2 hover:text-ink-1 bg-bg-2 border border-line")
                    }
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>
        </nav>
      )}

      {/* Categories */}
      <section className="max-w-[640px] mx-auto px-5 pb-16 pt-2">
        {visibleCats.length === 0 && (
          <div className="text-center text-ink-3 text-[13px] py-16">
            Le menu est en cours de préparation.
          </div>
        )}

        {visibleCats.map((cat) => (
          <div key={cat.id} id={`cat-${cat.id}`} className="pt-6">
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="display text-[20px] font-medium leading-tight">{cat.name}</h2>
              <span className="text-[10.5px] text-ink-4 mono uppercase tracking-[0.12em]">
                {cat.items.length} {cat.items.length > 1 ? "plats" : "plat"}
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {cat.items.map((it) => (
                <ItemCard key={it.id} item={it} />
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer className="border-t border-line py-6 text-center">
        <div className="text-[10.5px] text-ink-4 mono uppercase tracking-[0.16em]">
          Maison Sévère · Menu numérique
        </div>
      </footer>
    </main>
  );
}

function ItemCard({ item }: { item: import("@/lib/api/public-menu").PublicMenuItem }) {
  const unavailable = !item.available;
  return (
    <article
      className={
        "rounded-[14px] border border-line bg-bg-1 overflow-hidden transition-opacity " +
        (unavailable ? "opacity-50" : "opacity-100")
      }
    >
      <div className="flex gap-3 p-3">
        {item.photo_url && (
          <img
            src={item.photo_url}
            alt={item.name}
            className="w-[88px] h-[88px] rounded-[10px] object-cover border border-line shrink-0"
            loading="lazy"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[14px] font-semibold leading-tight text-ink-1">
                {item.name}
                {item.badge && (
                  <span className="ml-[6px] text-[9px] mono font-semibold text-ember-soft uppercase tracking-[0.1em]">
                    · {item.badge}
                  </span>
                )}
                {unavailable && (
                  <span className="ml-[6px] text-[9px] mono font-semibold text-danger uppercase tracking-[0.1em]">
                    · indisponible
                  </span>
                )}
              </div>
              {item.description && (
                <div className="text-[12px] text-ink-3 mt-[3px] leading-snug">
                  {item.description}
                </div>
              )}
            </div>
            <div className="mono text-[13px] font-semibold text-ember-soft whitespace-nowrap pt-[1px]">
              {formatEuros(item.price)} €
            </div>
          </div>

          {(item.tags.length > 0 || item.allergenes.length > 0) && (
            <div className="flex flex-wrap gap-1 mt-2">
              {item.tags.map((t) => (
                <span
                  key={`tag-${t}`}
                  className="text-[9.5px] mono font-semibold px-[6px] py-[2px] rounded-[5px] bg-bg-2 border border-line text-ink-2 uppercase tracking-[0.06em]"
                >
                  {t}
                </span>
              ))}
              {item.allergenes.length > 0 && (
                <span
                  className="text-[9.5px] mono font-medium px-[6px] py-[2px] rounded-[5px] bg-transparent border border-line text-ink-3 italic"
                  title={item.allergenes.join(", ")}
                >
                  allergènes : {item.allergenes.join(", ")}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
