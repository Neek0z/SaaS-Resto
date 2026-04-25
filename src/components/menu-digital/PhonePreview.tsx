import type { MenuCategory, MenuItem } from "@/lib/menu-types";
import { formatEuros } from "@/lib/utils";

export function PhonePreview({
  restaurantName,
  logoUrl,
  url,
  categories,
  items,
}: {
  restaurantName: string;
  logoUrl: string | null;
  url: string;
  categories: MenuCategory[];
  items: MenuItem[];
}) {
  const visibleCats = categories
    .filter((c) => c.active)
    .sort((a, b) => a.position - b.position);

  return (
    <div
      className="relative mx-auto rounded-[36px] border border-line-2 bg-bg-0 shadow-2xl overflow-hidden"
      style={{ width: 280, height: 560 }}
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[100px] h-[22px] bg-[#0a0808] rounded-b-[14px] z-20" />

      <div className="h-full overflow-y-auto">
        <div className="relative px-5 pt-8 pb-4 bg-gradient-to-b from-ember/20 via-transparent to-transparent">
          <div className="chip-uppercase !text-[9px] mb-2 truncate">{url}</div>
          <div className="flex items-center gap-2">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={restaurantName}
                className="w-9 h-9 rounded-[8px] object-cover border border-line-2"
              />
            ) : (
              <div
                className="w-9 h-9 rounded-[8px] grid place-items-center text-cream font-bold text-[16px] display"
                style={{
                  background:
                    "radial-gradient(circle at 30% 30%, var(--ember) 0%, var(--ember-deep) 60%, #5c2a0e 100%)",
                }}
              >
                {restaurantName.trim().charAt(0).toUpperCase() || "•"}
              </div>
            )}
            <div className="display text-[18px] leading-tight font-medium truncate">
              {restaurantName}
            </div>
          </div>
          <div className="text-[10.5px] text-ink-3 mt-1">Menu numérique</div>
        </div>

        <div className="px-5 pb-10">
          {visibleCats.length === 0 ? (
            <div className="text-[11px] text-ink-4 italic mt-6 text-center">
              Aucune catégorie active.
            </div>
          ) : (
            visibleCats.map((cat) => {
              const catItems = items
                .filter((i) => i.categoryId === cat.id)
                .sort((a, b) => a.position - b.position);
              return (
                <div key={cat.id} className="mt-4">
                  <div className="chip-uppercase mb-2 !text-[9.5px]">{cat.name}</div>
                  <div className="flex flex-col gap-[10px]">
                    {catItems.length === 0 ? (
                      <div className="text-[10.5px] text-ink-4 italic">Vide</div>
                    ) : (
                      catItems.map((it) => (
                        <div
                          key={it.id}
                          className={
                            "py-[8px] border-b border-line/60 last:border-b-0 " +
                            (it.available ? "" : "opacity-50")
                          }
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="text-[12px] font-semibold leading-tight text-ink-1 flex-1">
                              {it.name}
                              {it.badge && (
                                <span className="ml-[6px] text-[8.5px] mono font-semibold text-ember-soft uppercase tracking-[0.08em]">
                                  · {it.badge}
                                </span>
                              )}
                              {!it.available && (
                                <span className="ml-[6px] text-[8.5px] mono font-semibold text-danger uppercase tracking-[0.08em]">
                                  · rupture
                                </span>
                              )}
                            </div>
                            <div className="mono text-[11.5px] font-semibold text-ember-soft whitespace-nowrap">
                              {formatEuros(it.price)} €
                            </div>
                          </div>
                          {it.description && (
                            <div className="text-[10.5px] text-ink-3 mt-[3px] leading-snug">
                              {it.description}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
