export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function getPublicBase(): string {
  const fromEnv = (import.meta.env.VITE_PUBLIC_BASE_URL as string | undefined)?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "";
}

// Lien unique imprimé sur le QR client. Le hub /chez/:slug expose
// ensuite les trois actions (carte, réservation, fidélité).
export function publicHubUrl(slug: string, table?: number | string): string {
  const base = `${getPublicBase()}/chez/${slug}`;
  if (table === undefined || table === null || table === "") return base;
  return `${base}?table=${encodeURIComponent(String(table))}`;
}

export function publicMenuUrl(slug: string, table?: number | string): string {
  const base = `${getPublicBase()}/carte/${slug}`;
  if (table === undefined || table === null || table === "") return base;
  return `${base}?table=${encodeURIComponent(String(table))}`;
}

export function publicLoyaltyUrl(slug: string): string {
  return `${getPublicBase()}/fidelite/${slug}`;
}

export function publicReservationUrl(slug: string): string {
  return `${getPublicBase()}/reserver/${slug}`;
}
