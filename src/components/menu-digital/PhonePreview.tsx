import type { DigitalMenuConfig } from "@/lib/mock-data";
import { formatEuros } from "@/lib/utils";

export function PhonePreview({ menu }: { menu: DigitalMenuConfig }) {
  return (
    <div
      className="relative mx-auto rounded-[36px] border border-line-2 bg-bg-0 shadow-2xl overflow-hidden"
      style={{ width: 280, height: 560 }}
    >
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[100px] h-[22px] bg-[#0a0808] rounded-b-[14px] z-20" />

      <div className="h-full overflow-y-auto">
        {/* Hero */}
        <div className="relative px-5 pt-8 pb-4 bg-gradient-to-b from-ember/20 via-transparent to-transparent">
          <div className="chip-uppercase !text-[9px] mb-1">{menu.url}</div>
          <div className="display text-[22px] leading-tight font-medium">
            Maison <em className="not-italic italic text-ember-soft">Sévère</em>
          </div>
          <div className="text-[10.5px] text-ink-3 mt-1">Brasserie · Paris 11ᵉ</div>

          <div className="flex gap-1 mt-3">
            {menu.languages.map((l) => (
              <span
                key={l}
                className="text-[9px] mono font-semibold px-[6px] py-[2px] rounded-[5px] bg-bg-2 border border-line text-ink-2"
              >
                {l}
              </span>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="px-5 pb-10">
          {menu.categories.map((cat) => (
            <div key={cat.id} className="mt-4">
              <div className="chip-uppercase mb-2 !text-[9.5px]">{cat.name}</div>
              <div className="flex flex-col gap-[10px]">
                {cat.items.map((it) => (
                  <div
                    key={it.name}
                    className="py-[8px] border-b border-line/60 last:border-b-0"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-[12px] font-semibold leading-tight text-ink-1 flex-1">
                        {it.name}
                        {it.tag === "signature" && (
                          <span className="ml-[6px] text-[8.5px] mono font-semibold text-ember-soft uppercase tracking-[0.08em]">
                            · signature
                          </span>
                        )}
                        {it.tag === "limité" && (
                          <span className="ml-[6px] text-[8.5px] mono font-semibold text-amber uppercase tracking-[0.08em]">
                            · limité
                          </span>
                        )}
                        {it.tag === "rupture" && (
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
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
