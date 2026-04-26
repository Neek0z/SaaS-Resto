export type TeamMemberStatus = "service" | "break" | "late";
export type TeamMemberKind = "service" | "kitchen" | "bar" | "late";

export const TEAM_KINDS: TeamMemberKind[] = ["service", "kitchen", "bar", "late"];
export const TEAM_STATUSES: TeamMemberStatus[] = ["service", "break", "late"];

export const KIND_LABEL: Record<TeamMemberKind, string> = {
  service: "Salle",
  kitchen: "Cuisine",
  bar: "Bar",
  late: "En retard",
};

export const STATUS_LABEL: Record<TeamMemberStatus, string> = {
  service: "En poste",
  break: "En pause",
  late: "En retard",
};

// Identité d'un membre — ne change pas d'un jour à l'autre.
export type TeamMember = {
  id: string;
  restaurantId: string;
  name: string;
  role: string;
  avatar: string;
  kind: TeamMemberKind;
  // Valeurs par défaut utilisées comme template pour de nouveaux shifts.
  defaultStart: number;
  defaultEnd: number;
  defaultBreakStart: number | null;
  defaultBreakEnd: number | null;
  defaultStatus: TeamMemberStatus;
  defaultHours: string;
  createdAt: string;
  updatedAt: string;
};

// Un shift = un membre × un jour, avec horaires/pause/statut spécifiques.
export type TeamShift = {
  id: string;
  restaurantId: string;
  memberId: string;
  date: string; // ISO yyyy-mm-dd
  start: number;
  end: number;
  breakStart: number | null;
  breakEnd: number | null;
  status: TeamMemberStatus;
  hours: string;
  createdAt: string;
  updatedAt: string;
};

// Membre résolu pour une date donnée.
// shift = null → le membre n'est pas planifié ce jour.
export type ResolvedTeamMember = TeamMember & {
  shift: TeamShift | null;
};

export type NewTeamMember = {
  name: string;
  role: string;
  avatar?: string;
  kind: TeamMemberKind;
  defaultStart: number;
  defaultEnd: number;
  defaultBreakStart?: number | null;
  defaultBreakEnd?: number | null;
  defaultStatus?: TeamMemberStatus;
  defaultHours?: string;
};

export type TeamMemberPatch = Partial<{
  name: string;
  role: string;
  avatar: string;
  kind: TeamMemberKind;
  defaultStart: number;
  defaultEnd: number;
  defaultBreakStart: number | null;
  defaultBreakEnd: number | null;
  defaultStatus: TeamMemberStatus;
  defaultHours: string;
}>;

export type ShiftInput = {
  start: number;
  end: number;
  breakStart: number | null;
  breakEnd: number | null;
  status: TeamMemberStatus;
  hours: string;
};

export function avatarFromName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function formatHourLabel(h: number): string {
  const hh = ((Math.floor(h) % 24) + 24) % 24;
  const mm = Math.round((h - Math.floor(h)) * 60);
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export function buildHoursLabel(start: number, end: number): string {
  return `${formatHourLabel(start)}–${formatHourLabel(end)}`;
}
