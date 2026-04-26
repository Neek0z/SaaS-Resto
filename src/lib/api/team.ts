import { supabase } from "@/lib/supabase";
import {
  avatarFromName,
  buildHoursLabel,
  type NewTeamMember,
  type ResolvedTeamMember,
  type ShiftInput,
  type TeamMember,
  type TeamMemberKind,
  type TeamMemberPatch,
  type TeamMemberStatus,
  type TeamShift,
} from "@/lib/team-types";

function requireClient() {
  if (!supabase) throw new Error("Supabase non configuré.");
  return supabase;
}

type MemberRow = {
  id: string;
  restaurant_id: string;
  name: string;
  role: string;
  avatar: string;
  kind: TeamMemberKind;
  start_at: number | string;
  end_at: number | string;
  break_start: number | string | null;
  break_end: number | string | null;
  status: TeamMemberStatus;
  hours: string;
  created_at: string;
  updated_at: string;
};

type ShiftRow = {
  id: string;
  restaurant_id: string;
  member_id: string;
  shift_date: string;
  start_at: number | string;
  end_at: number | string;
  break_start: number | string | null;
  break_end: number | string | null;
  status: TeamMemberStatus;
  hours: string;
  created_at: string;
  updated_at: string;
};

const MEMBER_SELECT =
  "id, restaurant_id, name, role, avatar, kind, start_at, end_at, break_start, break_end, status, hours, created_at, updated_at";

const SHIFT_SELECT =
  "id, restaurant_id, member_id, shift_date, start_at, end_at, break_start, break_end, status, hours, created_at, updated_at";

function num(v: number | string | null): number | null {
  if (v === null) return null;
  return typeof v === "string" ? Number(v) : v;
}

function mapMember(r: MemberRow): TeamMember {
  return {
    id: r.id,
    restaurantId: r.restaurant_id,
    name: r.name,
    role: r.role,
    avatar: r.avatar,
    kind: r.kind,
    defaultStart: num(r.start_at) ?? 0,
    defaultEnd: num(r.end_at) ?? 0,
    defaultBreakStart: num(r.break_start),
    defaultBreakEnd: num(r.break_end),
    defaultStatus: r.status,
    defaultHours: r.hours,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapShift(r: ShiftRow): TeamShift {
  return {
    id: r.id,
    restaurantId: r.restaurant_id,
    memberId: r.member_id,
    date: r.shift_date,
    start: num(r.start_at) ?? 0,
    end: num(r.end_at) ?? 0,
    breakStart: num(r.break_start),
    breakEnd: num(r.break_end),
    status: r.status,
    hours: r.hours,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function listTeamMembers(): Promise<TeamMember[]> {
  const sb = requireClient();
  const { data, error } = await sb
    .from("team_members")
    .select(MEMBER_SELECT)
    .order("name");
  if (error) throw error;
  return ((data ?? []) as MemberRow[]).map(mapMember);
}

export async function listShifts(date: string): Promise<TeamShift[]> {
  const sb = requireClient();
  const { data, error } = await sb
    .from("team_shifts")
    .select(SHIFT_SELECT)
    .eq("shift_date", date);
  if (error) throw error;
  return ((data ?? []) as ShiftRow[]).map(mapShift);
}

export async function listResolvedTeam(date: string): Promise<ResolvedTeamMember[]> {
  const [members, shifts] = await Promise.all([listTeamMembers(), listShifts(date)]);
  const byMember = new Map<string, TeamShift>();
  for (const s of shifts) byMember.set(s.memberId, s);
  return members.map((m) => ({ ...m, shift: byMember.get(m.id) ?? null }));
}

export async function createMember(input: NewTeamMember): Promise<TeamMember> {
  const sb = requireClient();
  const hours =
    input.defaultHours || buildHoursLabel(input.defaultStart, input.defaultEnd);
  const row = {
    name: input.name,
    role: input.role,
    avatar: input.avatar ?? avatarFromName(input.name),
    kind: input.kind,
    start_at: input.defaultStart,
    end_at: input.defaultEnd,
    break_start: input.defaultBreakStart ?? null,
    break_end: input.defaultBreakEnd ?? null,
    status: input.defaultStatus ?? "service",
    hours,
  };
  const { data, error } = await sb
    .from("team_members")
    .insert(row)
    .select(MEMBER_SELECT)
    .single();
  if (error) throw error;
  return mapMember(data as MemberRow);
}

export async function updateMember(id: string, patch: TeamMemberPatch): Promise<void> {
  const sb = requireClient();
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.role !== undefined) row.role = patch.role;
  if (patch.avatar !== undefined) row.avatar = patch.avatar;
  if (patch.kind !== undefined) row.kind = patch.kind;
  if (patch.defaultStart !== undefined) row.start_at = patch.defaultStart;
  if (patch.defaultEnd !== undefined) row.end_at = patch.defaultEnd;
  if (patch.defaultBreakStart !== undefined) row.break_start = patch.defaultBreakStart;
  if (patch.defaultBreakEnd !== undefined) row.break_end = patch.defaultBreakEnd;
  if (patch.defaultStatus !== undefined) row.status = patch.defaultStatus;
  if (patch.defaultHours !== undefined) row.hours = patch.defaultHours;
  if (Object.keys(row).length === 0) return;
  const { error } = await sb.from("team_members").update(row).eq("id", id);
  if (error) throw error;
}

export async function deleteMember(id: string): Promise<void> {
  const sb = requireClient();
  const { error } = await sb.from("team_members").delete().eq("id", id);
  if (error) throw error;
}

export async function upsertShift(
  memberId: string,
  date: string,
  shift: ShiftInput
): Promise<TeamShift> {
  const sb = requireClient();
  const row = {
    member_id: memberId,
    shift_date: date,
    start_at: shift.start,
    end_at: shift.end,
    break_start: shift.breakStart,
    break_end: shift.breakEnd,
    status: shift.status,
    hours: shift.hours,
  };
  const { data, error } = await sb
    .from("team_shifts")
    .upsert(row, { onConflict: "restaurant_id,member_id,shift_date" })
    .select(SHIFT_SELECT)
    .single();
  if (error) throw error;
  return mapShift(data as ShiftRow);
}

export async function deleteShift(memberId: string, date: string): Promise<void> {
  const sb = requireClient();
  const { error } = await sb
    .from("team_shifts")
    .delete()
    .eq("member_id", memberId)
    .eq("shift_date", date);
  if (error) throw error;
}
