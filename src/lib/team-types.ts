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

export type TeamMember = {
  id: string;
  restaurantId: string;
  name: string;
  role: string;
  status: TeamMemberStatus;
  avatar: string;
  hours: string;
  start: number;
  end: number;
  kind: TeamMemberKind;
  breakStart: number | null;
  breakEnd: number | null;
  createdAt: string;
  updatedAt: string;
};

export type NewTeamMember = {
  name: string;
  role: string;
  status?: TeamMemberStatus;
  avatar?: string;
  hours: string;
  start: number;
  end: number;
  kind: TeamMemberKind;
  breakStart?: number | null;
  breakEnd?: number | null;
};

export type TeamPatch = Partial<{
  name: string;
  role: string;
  status: TeamMemberStatus;
  avatar: string;
  hours: string;
  start: number;
  end: number;
  kind: TeamMemberKind;
  breakStart: number | null;
  breakEnd: number | null;
}>;

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
