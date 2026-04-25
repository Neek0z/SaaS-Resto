import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatEuros(v: number) {
  return v.toLocaleString("fr-FR");
}

export function formatLongDateFr(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function currentServiceLabel(d: Date = new Date()): string {
  return d.getHours() < 17 ? "Service du midi" : "Service du soir";
}
