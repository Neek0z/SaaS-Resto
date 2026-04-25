import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  createTeamMember,
  deleteTeamMember,
  listTeam,
  updateTeamMember,
} from "@/lib/api/team";
import type { NewTeamMember, TeamMember, TeamPatch } from "@/lib/team-types";
import { extractErrorMessage } from "@/lib/errors";

function translateError(e: unknown): string {
  const msg = extractErrorMessage(e);
  const lower = msg.toLowerCase();
  if (lower.includes("row level security") || lower.includes("permission")) {
    return "Accès refusé. Vérifiez votre rôle.";
  }
  if (lower.includes("not configured") || lower.includes("non configur")) {
    return "Supabase non configuré.";
  }
  if (lower.includes("network") || lower.includes("failed to fetch")) {
    return "Connexion réseau indisponible.";
  }
  return msg;
}

type UseTeam = {
  team: TeamMember[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  add: (input: NewTeamMember) => Promise<TeamMember | null>;
  update: (id: string, patch: TeamPatch) => Promise<void>;
  remove: (id: string) => Promise<void>;
};

export function useTeam(): UseTeam {
  const { restaurant } = useAuth();
  const restaurantId = restaurant?.id ?? null;
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const load = useCallback(async () => {
    if (!restaurantId) {
      setTeam([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const rows = await listTeam();
      if (!mounted.current) return;
      setTeam(rows);
    } catch (e) {
      if (mounted.current) setError(translateError(e));
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    mounted.current = true;
    void load();
    return () => {
      mounted.current = false;
    };
  }, [load]);

  const add = useCallback(async (input: NewTeamMember): Promise<TeamMember | null> => {
    try {
      const created = await createTeamMember(input);
      setTeam((prev) => [...prev, created].sort((a, b) => a.start - b.start));
      return created;
    } catch (e) {
      setError(translateError(e));
      return null;
    }
  }, []);

  const update = useCallback(
    async (id: string, patch: TeamPatch) => {
      const before = team;
      setTeam((prev) =>
        prev.map((m) =>
          m.id === id
            ? {
                ...m,
                ...(patch.name !== undefined ? { name: patch.name } : {}),
                ...(patch.role !== undefined ? { role: patch.role } : {}),
                ...(patch.status !== undefined ? { status: patch.status } : {}),
                ...(patch.avatar !== undefined ? { avatar: patch.avatar } : {}),
                ...(patch.hours !== undefined ? { hours: patch.hours } : {}),
                ...(patch.start !== undefined ? { start: patch.start } : {}),
                ...(patch.end !== undefined ? { end: patch.end } : {}),
                ...(patch.kind !== undefined ? { kind: patch.kind } : {}),
                ...(patch.breakStart !== undefined ? { breakStart: patch.breakStart } : {}),
                ...(patch.breakEnd !== undefined ? { breakEnd: patch.breakEnd } : {}),
              }
            : m
        )
      );
      try {
        await updateTeamMember(id, patch);
      } catch (e) {
        setTeam(before);
        setError(translateError(e));
      }
    },
    [team]
  );

  const remove = useCallback(
    async (id: string) => {
      const before = team;
      setTeam((prev) => prev.filter((m) => m.id !== id));
      try {
        await deleteTeamMember(id);
      } catch (e) {
        setTeam(before);
        setError(translateError(e));
      }
    },
    [team]
  );

  return { team, loading, error, reload: load, add, update, remove };
}
