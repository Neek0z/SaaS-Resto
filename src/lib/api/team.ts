import { supabase } from "@/lib/supabase";
import {
  avatarFromName,
  buildHoursLabel,
  type NewTeamMember,
  type TeamMember,
  type TeamMemberKind,
  type TeamMemberStatus,
  type TeamPatch,
} from "@/lib/team-types";

function requireClient() {
  if (!supabase) throw new Error("Supabase non configuré.");
  return supabase;
}

type Row = {
  id: string;
  restaurant_id: string;
  name: string;
  role: string;
  status: TeamMemberStatus;
  avatar: string;
  hours: string;
  start_at: number | string;
  end_at: number | string;
  kind: TeamMemberKind;
  break_start: number | string | null;
  break_end: number | string | null;
  created_at: string;
  updated_at: string;
};

const SELECT =
  "id, restaurant_id, name, role, status, avatar, hours, start_at, end_at, kind, break_start, break_end, created_at, updated_at";

function num(v: number | string | null): number | null {
  if (v === null) return null;
  return typeof v === "string" ? Number(v) : v;
}

function mapRow(r: Row): TeamMember {
  return {
    id: r.id,
    restaurantId: r.restaurant_id,
    name: r.name,
    role: r.role,
    status: r.status,
    avatar: r.avatar,
    hours: r.hours,
    start: num(r.start_at) ?? 0,
    end: num(r.end_at) ?? 0,
    kind: r.kind,
    breakStart: num(r.break_start),
    breakEnd: num(r.break_end),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function listTeam(): Promise<TeamMember[]> {
  const sb = requireClient();
  const { data, error } = await sb.from("team_members").select(SELECT).order("start_at");
  if (error) throw error;
  return ((data ?? []) as Row[]).map(mapRow);
}

export async function createTeamMember(input: NewTeamMember): Promise<TeamMember> {
  const sb = requireClient();
  const row = {
    name: input.name,
    role: input.role,
    status: input.status ?? "service",
    avatar: input.avatar ?? avatarFromName(input.name),
    hours: input.hours || buildHoursLabel(input.start, input.end),
    start_at: input.start,
    end_at: input.end,
    kind: input.kind,
    break_start: input.breakStart ?? null,
    break_end: input.breakEnd ?? null,
  };
  const { data, error } = await sb.from("team_members").insert(row).select(SELECT).single();
  if (error) throw error;
  return mapRow(data as Row);
}

export async function updateTeamMember(id: string, patch: TeamPatch): Promise<void> {
  const sb = requireClient();
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.role !== undefined) row.role = patch.role;
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.avatar !== undefined) row.avatar = patch.avatar;
  if (patch.hours !== undefined) row.hours = patch.hours;
  if (patch.start !== undefined) row.start_at = patch.start;
  if (patch.end !== undefined) row.end_at = patch.end;
  if (patch.kind !== undefined) row.kind = patch.kind;
  if (patch.breakStart !== undefined) row.break_start = patch.breakStart;
  if (patch.breakEnd !== undefined) row.break_end = patch.breakEnd;
  if (Object.keys(row).length === 0) return;
  const { error } = await sb.from("team_members").update(row).eq("id", id);
  if (error) throw error;
}

export async function deleteTeamMember(id: string): Promise<void> {
  const sb = requireClient();
  const { error } = await sb.from("team_members").delete().eq("id", id);
  if (error) throw error;
}
