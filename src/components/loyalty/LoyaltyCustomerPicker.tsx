import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Star, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchCustomers } from "@/lib/api/loyalty-db";
import type { LoyaltyCustomer } from "@/lib/loyalty-types";
import { cn } from "@/lib/utils";

const TIER_LABEL: Record<string, string> = {
  bronze: "Bronze",
  silver: "Argent",
  gold: "Or",
  platine: "Platine",
};

export function LoyaltyCustomerPicker({
  value,
  onChange,
  label = "Client fidélité (facultatif)",
}: {
  value: string | null;
  onChange: (id: string | null, customer: LoyaltyCustomer | null) => void;
  label?: string;
}) {
  const { restaurant } = useAuth();
  const restaurantId = restaurant?.id ?? null;
  const [customers, setCustomers] = useState<LoyaltyCustomer[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!restaurantId) return;
    let cancelled = false;
    setLoading(true);
    fetchCustomers(restaurantId)
      .then((rows) => {
        if (!cancelled) setCustomers(rows);
      })
      .catch(() => {
        if (!cancelled) setCustomers([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [restaurantId]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const selected = useMemo(
    () => customers.find((c) => c.id === value) ?? null,
    [customers, value]
  );

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers.slice(0, 8);
    return customers
      .filter((c) => {
        const haystack = [c.name, c.email ?? "", c.phone ?? ""]
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      })
      .slice(0, 8);
  }, [customers, query]);

  const select = (c: LoyaltyCustomer) => {
    onChange(c.id, c);
    setQuery("");
    setOpen(false);
  };

  const clear = () => {
    onChange(null, null);
    setQuery("");
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label className="chip-uppercase block mb-[6px]">{label}</label>

      {selected ? (
        <div className="flex items-center gap-2 bg-bg-2 border border-line rounded-[10px] px-3 py-[9px]">
          <Star size={13} className="text-ember-soft shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-[13px] text-ink-1 truncate">{selected.name}</div>
            <div className="text-[11px] text-ink-3 mono">
              {TIER_LABEL[selected.tier] ?? selected.tier} ·{" "}
              {selected.points} pts
              {selected.email ? ` · ${selected.email}` : selected.phone ? ` · ${selected.phone}` : ""}
            </div>
          </div>
          <button
            type="button"
            onClick={clear}
            className="p-1 text-ink-4 hover:text-danger transition-colors"
            title="Retirer le client"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 bg-bg-2 border border-line rounded-[10px] px-3 py-[7px]">
          <Search size={13} className="text-ink-3 shrink-0" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={
              loading
                ? "Chargement…"
                : customers.length === 0
                ? "Aucun client fidélité"
                : "Rechercher par nom, email ou téléphone…"
            }
            disabled={loading || customers.length === 0}
            className="flex-1 bg-transparent border-0 outline-none text-[13px] text-ink-1 placeholder:text-ink-3"
          />
        </div>
      )}

      {open && !selected && matches.length > 0 && (
        <div className="absolute z-30 left-0 right-0 mt-1 bg-bg-1 border border-line rounded-[10px] shadow-lg max-h-[260px] overflow-auto">
          {matches.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => select(c)}
              className={cn(
                "w-full text-left px-3 py-2 hover:bg-bg-2 transition-colors border-b border-line last:border-b-0"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="text-[13px] text-ink-1 truncate">{c.name}</div>
                <div className="text-[10.5px] text-ember-soft mono shrink-0">
                  {c.points} pts
                </div>
              </div>
              <div className="text-[10.5px] text-ink-4 mono truncate">
                {TIER_LABEL[c.tier] ?? c.tier}
                {c.email ? ` · ${c.email}` : c.phone ? ` · ${c.phone}` : ""}
              </div>
            </button>
          ))}
        </div>
      )}

      {open && !selected && query && matches.length === 0 && (
        <div className="absolute z-30 left-0 right-0 mt-1 bg-bg-1 border border-line rounded-[10px] px-3 py-3 text-[12px] text-ink-3 italic">
          Aucun résultat pour « {query} ».
        </div>
      )}
    </div>
  );
}
