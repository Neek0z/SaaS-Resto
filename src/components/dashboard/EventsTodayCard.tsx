import { Link } from "react-router-dom";
import { Calendar, Plus } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { useActiveEvents } from "@/hooks/useEvents";
import { EventBadge } from "@/components/events/EventBadge";
import { summarizeEvent } from "@/lib/event-types";

export function EventsTodayCard() {
  const { activeEvents, loading } = useActiveEvents();

  return (
    <Card className="col-span-12 p-[18px]">
      <CardHeader>
        <CardTitle className="inline-flex items-center gap-2">
          <Calendar size={13} />
          Événements aujourd'hui
        </CardTitle>
        <Link
          to="/evenements"
          className="text-[11.5px] text-ember-soft hover:text-ember transition-colors"
        >
          Voir tout →
        </Link>
      </CardHeader>

      {loading ? (
        <div className="py-6 text-center text-ink-3 text-[12.5px]">Chargement…</div>
      ) : activeEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 gap-3">
          <div className="text-[13px] text-ink-3 italic">Aucun événement aujourd'hui</div>
          <Link
            to="/evenements"
            className="btn-ghost inline-flex items-center gap-2 text-[12px]"
          >
            <Plus size={13} />
            Créer un événement
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {activeEvents.map((ev) => (
            <Link
              key={ev.id}
              to="/evenements"
              className="flex items-center gap-3 p-[10px_12px] rounded-lg bg-bg-2 border border-line text-[12.5px] hover:bg-bg-3 transition-colors"
            >
              <EventBadge event={ev} size="sm" />
              <span className="text-ink-3 text-[11.5px] truncate flex-1">
                {summarizeEvent(ev)}
              </span>
              {(ev.startTime || ev.endTime) && (
                <span className="mono text-[10.5px] text-ink-4 flex-shrink-0">
                  {ev.startTime ?? "—"}–{ev.endTime ?? "—"}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}
