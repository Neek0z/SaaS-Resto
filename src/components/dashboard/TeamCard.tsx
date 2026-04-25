import { useTeam } from "@/hooks/useTeam";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamChip } from "@/components/team/TeamChip";
import { CardLink } from "./CardLink";

export function TeamCard() {
  const { team, loading, error } = useTeam();

  const counts = team.reduce(
    (acc, m) => ({ ...acc, [m.status]: (acc[m.status] ?? 0) + 1 }),
    {} as Record<string, number>
  );

  return (
    <Card className="col-span-7 p-[18px]">
      <CardHeader>
        <CardTitle>
          Équipe · <span className="text-ember-soft">en service</span>
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
