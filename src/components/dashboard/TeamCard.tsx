import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useTeam } from "@/hooks/useTeam";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamChip } from "@/components/team/TeamChip";
import { CardLink } from "./CardLink";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function TeamCard() {
  const today = useMemo(todayIso, []);
  const { team, loading, error } = useTeam(today);

  const counts = team.reduce(
    (acc, m) => {
      const s = m.shift?.status;
      if (!s) return acc;
      return { ...acc, [s]: (acc[s] ?? 0) + 1 };
    },
    {} as Record<string, number>
  );

  return (
    <Card className="col-span-12 lg:col-span-7 p-[18px]">
      <CardHeader>
        <CardTitle>
          <Link to="/equipe" className="hover:text-ember-soft transition-colors">
            Équipe · <span className="text-ember-soft">en service</span>
          </Link>
        </CardTitle>
        <div className="flex gap-3 text-[11.5px] text-ink-3 mono">
          <span className="text-ok">● {counts.service ?? 0} en poste</span>
          <span className="text-amber">● {counts.break ?? 0} en pause</span>
          <span className="text-danger">● {counts.late ?? 0} retard</span>
        </div>
      </CardHeader>

      {error ? (
        <div className="py-10 text-center text-[12px] text-danger">{error}</div>
      ) : loading && team.length === 0 ? (
        <div className="py-10 text-center text-[12px] text-ink-3">Chargement…</div>
      ) : team.length === 0 ? (
        <div className="py-10 text-center text-[12px] text-ink-3">
          Aucun membre planifié.
        </div>
      ) : (
        <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
          {team.map((m) => (
            <TeamChip key={m.id} m={m} />
          ))}
        </div>
      )}
      <CardLink to="/equipe" label="Planning complet" />
    </Card>
  );
}
