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

// Lien unique imprimé sur le QR client. Le hub /chez/:slug expose
// ensuite les trois actions (carte, réservation, fidélité).
export function publicHubUrl(slug: string, table?: number | string): string {
  const base = `${PUBLIC_BASE}/chez/${slug}`;
  if (table === undefined || table === null || table === "") return base;
  return `${base}?table=${encodeURIComponent(String(table))}`;
}

export function publicMenuUrl(slug: string, table?: number | string): string {
  const base = `${PUBLIC_BASE}/carte/${slug}`;
  if (table === undefined || table === null || table === "") return base;
  return `${base}?table=${encodeURIComponent(String(table))}`;
}

export function publicLoyaltyUrl(slug: string): string {
  return `${PUBLIC_BASE}/fidelite/${slug}`;
}

export function publicReservationUrl(slug: string): string {
  return `${PUBLIC_BASE}/reserver/${slug}`;
}
