import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { CheckCircle2, Minus, Plus, Search, ShoppingBag, X } from "lucide-react";
import { fetchPublicMenu, type PublicMenuItem, type PublicMenuPayload } from "@/lib/api/public-menu";
import { createPublicOrder } from "@/lib/api/public-order";
import { extractErrorMessage } from "@/lib/errors";
import { formatEuros } from "@/lib/utils";

type State =
  | { status: "loading" }
  | { status: "not_found" }
  | { status: "error"; message: string }
  | { status: "ready"; data: PublicMenuPayload };

type Cart = Record<string, number>;

export default function PublicMenu() {
  const { slug } = useParams<{ slug: string }>();
  const [params] = useSearchParams();
  const tableParam = params.get("table")?.trim() || null;
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

  return (
    <PublicMenuContent
      data={state.data}
      activeCat={activeCat}
      setActiveCat={setActiveCat}
      slug={slug ?? ""}
      tableLabel={tableParam}
    />
  );
}

function PublicMenuContent({
  data,
  activeCat,
  setActiveCat,
  slug,
  tableLabel,
}: {
  data: PublicMenuPayload;
  activeCat: string | null;
  setActiveCat: (id: string) => void;
  slug: string;
  tableLabel: string | null;
}) {
  const { restaurant, categories } = data;
  const orderingEnabled = Boolean(tableLabel);
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<Cart>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [confirmation, setConfirmation] = useState<{ displayId: string; total: number } | null>(
    null
  );

  const trimmed = query.trim().toLowerCase();
  const isSearching = trimmed.length > 0;

  const itemsById = useMemo(() => {
    const map = new Map<string, PublicMenuItem>();
    for (const c of categories) for (const it of c.items) map.set(it.id, it);
    return map;
  }, [categories]);

  const visibleCats = useMemo(() => {
    const base = categories.filter((c) => c.items.length > 0);
    if (!isSearching) return base;
    return base
      .map((c) => ({
        ...c,
        items: c.items.filter((it) => {
          const haystack = [
            it.name,
            it.description ?? "",
            it.badge ?? "",
            it.tags.join(" "),
            it.allergenes.join(" "),
          ]
            .join(" ")
            .toLowerCase();
          return haystack.includes(trimmed);
        }),
      }))
      .filter((c) => c.items.length > 0);
  }, [categories, isSearching, trimmed]);

  const matchCount = useMemo(
    () => visibleCats.reduce((sum, c) => sum + c.items.length, 0),
    [visibleCats]
  );

  const cartLines = useMemo(() => {
    const lines: { item: PublicMenuItem; quantity: number }[] = [];
    for (const [id, qty] of Object.entries(cart)) {
      const item = itemsById.get(id);
      if (item && qty > 0) lines.push({ item, quantity: qty });
    }
    return lines;
  }, [cart, itemsById]);

  const cartCount = cartLines.reduce((s, l) => s + l.quantity, 0);
  const cartTotal = cartLines.reduce((s, l) => s + l.item.price * l.quantity, 0);

  const onJump = (id: string) => {
    setActiveCat(id);
    const el = document.getElementById(`cat-${id}`);
    if (el) {
      const offset = 110;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  const addToCart = (id: string) => {
    setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }));
  };
  const removeFromCart = (id: string) => {
    setCart((c) => {
      const next = { ...c };
      const cur = next[id] ?? 0;
      if (cur <= 1) delete next[id];
      else next[id] = cur - 1;
      return next;
    });
  };

  const handleConfirmed = (displayId: string, total: number) => {
    setCart({});
    setCartOpen(false);
    setConfirmation({ displayId, total });
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
            {orderingEnabled ? `Commande · table ${tableLabel}` : "Carte · service en salle"}
          </div>
        </div>
      </section>

      {/* Sticky search + category nav */}
      <nav
        className="sticky top-0 z-10 bg-bg-0/90 backdrop-blur border-b border-line"
        style={{ WebkitBackdropFilter: "blur(8px)" }}
      >
        <div className="max-w-[640px] mx-auto px-3 pt-2 pb-2 flex flex-col gap-2">
          <div className="flex items-center gap-2 bg-bg-2 border border-line rounded-[10px] px-3 py-[8px]">
            <Search size={14} className="text-ink-3 shrink-0" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un plat, ingrédient, allergène…"
              className="flex-1 bg-transparent border-0 outline-none text-[13px] text-ink-1 placeholder:text-ink-4"
            />
            {isSearching && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-ink-3 hover:text-ink-1 shrink-0"
                aria-label="Effacer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {!isSearching && categories.filter((c) => c.items.length > 0).length > 1 && (
            <div className="flex gap-1 overflow-x-auto scrollbar-none -mx-1 px-1">
              {categories
                .filter((c) => c.items.length > 0)
                .map((c) => {
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
          )}

          {isSearching && (
            <div className="text-[11px] text-ink-3 mono px-1">
              {matchCount} {matchCount > 1 ? "résultats" : "résultat"} pour
              <span className="text-ink-1"> « {query.trim()} »</span>
            </div>
          )}
        </div>
      </nav>

      {/* Categories */}
      <section className="max-w-[640px] mx-auto px-5 pb-32 pt-2">
        {visibleCats.length === 0 && (
          <div className="text-center text-ink-3 text-[13px] py-16">
            {isSearching
              ? "Aucun plat ne correspond à votre recherche."
              : "Le menu est en cours de préparation."}
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
                <ItemCard
                  key={it.id}
                  item={it}
                  quantity={cart[it.id] ?? 0}
                  orderingEnabled={orderingEnabled}
                  onAdd={() => addToCart(it.id)}
                  onRemove={() => removeFromCart(it.id)}
                />
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

      {/* Floating cart bar */}
      {orderingEnabled && cartCount > 0 && !cartOpen && (
        <div className="fixed inset-x-0 bottom-0 z-20 px-3 pb-3 pt-2 pointer-events-none">
          <div className="max-w-[640px] mx-auto pointer-events-auto">
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="w-full bg-ember text-[#1b0d04] rounded-[14px] px-4 py-[14px] flex items-center justify-between gap-3 shadow-[0_12px_32px_rgba(0,0,0,0.4)] font-semibold"
            >
              <span className="inline-flex items-center gap-2">
                <ShoppingBag size={16} />
                <span>{cartCount} article{cartCount > 1 ? "s" : ""}</span>
              </span>
              <span className="inline-flex items-center gap-2 mono">
                {formatEuros(cartTotal)} €<span className="opacity-70">·</span>Voir le panier
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Cart sheet */}
      {orderingEnabled && cartOpen && (
        <CartSheet
          slug={slug}
          tableLabel={tableLabel ?? ""}
          lines={cartLines}
          total={cartTotal}
          onClose={() => setCartOpen(false)}
          onIncrement={addToCart}
          onDecrement={removeFromCart}
          onConfirmed={handleConfirmed}
        />
      )}

      {/* Confirmation */}
      {confirmation && (
        <ConfirmationModal
          displayId={confirmation.displayId}
          total={confirmation.total}
          tableLabel={tableLabel ?? ""}
          onClose={() => setConfirmation(null)}
        />
      )}
    </main>
  );
}

function ItemCard({
  item,
  quantity,
  orderingEnabled,
  onAdd,
  onRemove,
}: {
  item: PublicMenuItem;
  quantity: number;
  orderingEnabled: boolean;
  onAdd: () => void;
  onRemove: () => void;
}) {
  const unavailable = !item.available;
  const canOrder = orderingEnabled && !unavailable;
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

          {canOrder && (
            <div className="flex items-center justify-end gap-2 mt-3">
              {quantity > 0 ? (
                <div className="inline-flex items-center gap-1 bg-bg-2 border border-line rounded-full p-[2px]">
                  <button
                    type="button"
                    onClick={onRemove}
                    aria-label="Retirer"
                    className="w-[28px] h-[28px] grid place-items-center text-ink-2 hover:text-ink-1 rounded-full"
                  >
                    <Minus size={13} />
                  </button>
                  <span className="mono text-[13px] font-semibold text-ink-1 min-w-[18px] text-center">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={onAdd}
                    aria-label="Ajouter"
                    className="w-[28px] h-[28px] grid place-items-center bg-ember text-[#1b0d04] rounded-full"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onAdd}
                  className="inline-flex items-center gap-1 bg-bg-2 border border-line text-ink-1 rounded-full px-3 py-[6px] text-[12px] font-semibold hover:border-ember hover:text-ember-soft"
                >
                  <Plus size={12} />
                  Ajouter
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function CartSheet({
  slug,
  tableLabel,
  lines,
  total,
  onClose,
  onIncrement,
  onDecrement,
  onConfirmed,
}: {
  slug: string;
  tableLabel: string;
  lines: { item: PublicMenuItem; quantity: number }[];
  total: number;
  onClose: () => void;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onConfirmed: (displayId: string, total: number) => void;
}) {
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const empty = lines.length === 0;

  const submit = async () => {
    if (empty || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await createPublicOrder({
        slug,
        tableLabel,
        items: lines.map((l) => ({ item_id: l.item.id, quantity: l.quantity })),
        name: name.trim(),
        note: note.trim(),
      });
      onConfirmed(res.display_id, res.total);
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-end sm:items-center sm:justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full sm:max-w-[480px] bg-bg-1 border-t sm:border border-line rounded-t-[18px] sm:rounded-[18px] max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-line">
          <div className="display text-[18px] font-medium">Votre commande</div>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-3 hover:text-ink-1"
            aria-label="Fermer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
          <div className="text-[11px] text-ink-3 mono uppercase tracking-[0.14em]">
            Table {tableLabel}
          </div>

          {empty ? (
            <div className="text-[13px] text-ink-3 italic py-8 text-center">
              Votre panier est vide.
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-line">
              {lines.map((l) => (
                <div key={l.item.id} className="py-3 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-ink-1 truncate">
                      {l.item.name}
                    </div>
                    <div className="text-[11.5px] text-ink-3 mono mt-[2px]">
                      {formatEuros(l.item.price)} € l&apos;unité
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-1 bg-bg-2 border border-line rounded-full p-[2px]">
                    <button
                      type="button"
                      onClick={() => onDecrement(l.item.id)}
                      aria-label="Retirer"
                      className="w-[24px] h-[24px] grid place-items-center text-ink-2 hover:text-ink-1 rounded-full"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="mono text-[12px] font-semibold text-ink-1 min-w-[16px] text-center">
                      {l.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => onIncrement(l.item.id)}
                      aria-label="Ajouter"
                      className="w-[24px] h-[24px] grid place-items-center bg-ember text-[#1b0d04] rounded-full"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <div className="mono text-[12.5px] font-semibold text-ember-soft whitespace-nowrap min-w-[60px] text-right">
                    {formatEuros(l.item.price * l.quantity)} €
                  </div>
                </div>
              ))}
            </div>
          )}

          {!empty && (
            <div className="flex flex-col gap-2 mt-2">
              <label className="flex flex-col gap-1">
                <span className="text-[10.5px] text-ink-3 mono uppercase tracking-[0.12em]">
                  Prénom (optionnel)
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Camille"
                  maxLength={40}
                  className="bg-bg-2 border border-line rounded-[10px] px-3 py-[8px] text-[13px] text-ink-1 outline-none focus:border-ember"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[10.5px] text-ink-3 mono uppercase tracking-[0.12em]">
                  Note pour la cuisine (optionnel)
                </span>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  maxLength={200}
                  placeholder="Allergie, cuisson, …"
                  className="bg-bg-2 border border-line rounded-[10px] px-3 py-[8px] text-[13px] text-ink-1 outline-none focus:border-ember resize-none"
                />
              </label>
            </div>
          )}

          {error && (
            <div className="text-[12px] text-danger bg-danger/10 border border-danger/30 rounded-[8px] px-3 py-2">
              {error}
            </div>
          )}
        </div>

        <div className="border-t border-line px-4 py-3 flex flex-col gap-2 bg-bg-1">
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-ink-3 mono uppercase tracking-[0.12em]">Total</span>
            <span className="display text-[20px] font-medium text-ember-soft mono">
              {formatEuros(total)} €
            </span>
          </div>
          <button
            type="button"
            onClick={submit}
            disabled={empty || submitting}
            className="w-full bg-ember text-[#1b0d04] rounded-[12px] py-[12px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Envoi en cours…" : "Envoyer la commande"}
          </button>
          <div className="text-[10.5px] text-ink-4 text-center mono">
            Paiement à régler en salle.
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfirmationModal({
  displayId,
  total,
  tableLabel,
  onClose,
}: {
  displayId: string;
  total: number;
  tableLabel: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-[420px] bg-bg-1 border border-line rounded-[18px] p-6 text-center flex flex-col items-center gap-3">
        <div className="w-[56px] h-[56px] rounded-full bg-ok/15 border border-ok/40 grid place-items-center text-ok">
          <CheckCircle2 size={28} />
        </div>
        <h2 className="display text-[22px] font-medium m-0">Commande envoyée</h2>
        <div className="text-[13px] text-ink-2 leading-relaxed">
          Votre commande{" "}
          <span className="mono text-ink-1 font-semibold">{displayId}</span> est transmise à
          l&apos;équipe.
          <br />
          Elle vous sera servie à la table{" "}
          <span className="mono text-ink-1 font-semibold">{tableLabel}</span>.
        </div>
        <div className="flex items-center justify-center gap-2 mono text-[13px] text-ember-soft mt-1">
          Total · <span className="font-semibold">{formatEuros(total)} €</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-2 bg-ember text-[#1b0d04] rounded-[10px] px-4 py-[10px] text-[13px] font-semibold"
        >
          Retour à la carte
        </button>
      </div>
    </div>
  );
}
