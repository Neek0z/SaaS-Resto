export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

const PUBLIC_BASE = "https://severe.app";

export function publicMenuUrl(slug: string, table?: number | string): string {
  const base = `${PUBLIC_BASE}/carte/${slug}`;
  if (table === undefined || table === null || table === "") return base;
  return `${base}?table=${encodeURIComponent(String(table))}`;
}

export function publicLoyaltyUrl(slug: string): string {
  return `${PUBLIC_BASE}/fidelite/${slug}`;
}
