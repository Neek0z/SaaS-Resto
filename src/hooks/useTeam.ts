import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  createMember,
  deleteMember as apiDeleteMember,
  deleteShift as apiDeleteShift,
  listResolvedTeam,
  updateMember as apiUpdateMember,
  upsertShift as apiUpsertShift,
} from "@/lib/api/team";
import type {
  NewTeamMember,
  ResolvedTeamMember,
  ShiftInput,
  TeamMember,
  TeamMemberPatch,
} from "@/lib/team-types";
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
  team: ResolvedTeamMember[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  add: (input: NewTeamMember) => Promise<TeamMember | null>;
  update: (id: string, patch: TeamMemberPatch) => Promise<void>;
  remove: (id: string) => Promise<void>;
  upsertShift: (memberId: string, shift: ShiftInput) => Promise<void>;
  deleteShift: (memberId: string) => Promise<void>;
};

export function useTeam(date: string): UseTeam {
  const { restaurant } = useAuth();
  const restaurantId = restaurant?.id ?? null;
  const [team, setTeam] = useState<ResolvedTeamMember[]>([]);
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
      const rows = await listResolvedTeam(date);
      if (!mounted.current) return;
      setTeam(rows);
    } catch (e) {
      if (mounted.current) setError(translateError(e));
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [restaurantId, date]);

  useEffect(() => {
    mounted.current = true;
    void load();
    return () => {
      mounted.current = false;
    };
  }, [load]);

  const add = useCallback(
    async (input: NewTeamMember): Promise<TeamMember | null> => {
      try {
        const created = await createMember(input);
        setTeam((prev) =>
          [...prev, { ...created, shift: null }].sort((a, b) =>
            a.name.localeCompare(b.name)
          )
        );
        return created;
      } catch (e) {
        setError(translateError(e));
        return null;
      }
    },
    []
  );

  const update = useCallback(
    async (id: string, patch: TeamMemberPatch) => {
      const before = team;
      setTeam((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...patch } : m))
      );
      try {
        await apiUpdateMember(id, patch);
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
        await apiDeleteMember(id);
      } catch (e) {
        setTeam(before);
        setError(translateError(e));
      }
    },
    [team]
  );

  const upsertShift = useCallback(
    async (memberId: string, shift: ShiftInput) => {
      const before = team;
      try {
        const created = await apiUpsertShift(memberId, date, shift);
        setTeam((prev) =>
          prev.map((m) => (m.id === memberId ? { ...m, shift: created } : m))
        );
      } catch (e) {
        setTeam(before);
        setError(translateError(e));
      }
    },
    [team, date]
  );

  const deleteShift = useCallback(
    async (memberId: string) => {
      const before = team;
      setTeam((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, shift: null } : m))
      );
      try {
        await apiDeleteShift(memberId, date);
      } catch (e) {
        setTeam(before);
        setError(translateError(e));
      }
    },
    [team, date]
  );

  return {
    team,
    loading,
    error,
    reload: load,
    add,
    update,
    remove,
    upsertShift,
    deleteShift,
  };
}
