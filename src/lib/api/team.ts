import { supabase } from "@/lib/supabase";
import { TEAM, type TeamMember } from "@/lib/mock-data";

// Supabase schema (expected):
// create table team_members (
//   id uuid primary key default gen_random_uuid(),
//   name text not null,
//   role text not null,
//   status text not null check (status in ('service','break','late')),
//   avatar text not null,
//   hours text not null,
//   start_at numeric not null,
//   end_at numeric not null,
//   kind text not null check (kind in ('service','kitchen','bar','late')),
//   break_start numeric,
//   break_end numeric
// );

export async function listTeam(): Promise<TeamMember[]> {
  if (!supabase) return TEAM;
  const { data, error } = await supabase
    .from("team_members")
    .select("name, role, status, avatar, hours, start_at, end_at, kind, break_start, break_end");
  if (error || !data) return TEAM;
  return data.map((row: Record<string, unknown>) => ({
    name: row.name as string,
    role: row.role as string,
    status: row.status as TeamMember["status"],
    avatar: row.avatar as string,
    hours: row.hours as string,
    start: row.start_at as number,
    end: row.end_at as number,
    kind: row.kind as TeamMember["kind"],
    breakStart: (row.break_start as number | null) ?? undefined,
    breakEnd: (row.break_end as number | null) ?? undefined,
  }));
}
