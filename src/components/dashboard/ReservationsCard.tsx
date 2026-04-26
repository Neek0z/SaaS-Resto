import { Link, useNavigate } from "react-router-dom";
import { useReservations } from "@/hooks/useReservations";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ResaRow } from "@/components/reservations/ResaRow";
import { CardLink } from "./CardLink";

function currentTimeKey(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function ReservationsCard() {
  const { reservations, loading, error } = useReservations();
  const navigate = useNavigate();
  const totalCovers = reservations.reduce((s, r) => s + r.covers, 0);
  const now = currentTimeKey();
  const currentTime = reservations
    .filter((r) => r.time <= now)
    .map((r) => r.time)
    .pop();

  return (
    <Card className="col-span-12 lg:col-span-5 p-[18px]">
      <CardHeader>
        <CardTitle>
          <Link to="/reservations" className="hover:text-ember-soft transition-colors">
            Réservations · <span className="text-ember-soft">aujourd'hui</span>
          </Link>
        </CardTitle>
        <span className="text-[11.5px] text-ink-3">
          {reservations.length} résas · {totalCovers} couverts
        </span>
      </CardHeader>

      {error ? (
        <div className="py-10 text-center text-[12px] text-danger">{error}</div>
      ) : loading && reservations.length === 0 ? (
        <div className="py-10 text-center text-[12px] text-ink-3">Chargement…</div>
      ) : reservations.length === 0 ? (
        <div className="py-10 text-center text-[12px] text-ink-3">
          Aucune réservation aujourd'hui.
        </div>
      ) : (
        <div className="flex flex-col gap-[2px] max-h-[480px] overflow-y-auto pr-[6px]">
          {reservations.map((r) => (
            <ResaRow
              key={r.id}
              r={r}
              current={r.time === currentTime}
              onClick={(res) => navigate("/reservations", { state: { openId: res.id } })}
            />
          ))}
        </div>
      )}
      <CardLink to="/reservations" label="Voir le plan de salle" />
    </Card>
  );
}
