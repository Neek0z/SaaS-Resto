import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowRight, Clock, Users } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

type PendingRow = {
  id: string;
  reservation_date: string;
  reservation_time: string;
  name: string;
  covers: number;
  table_label: string;
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDateLabel(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  const today = todayIso();
  if (iso === today) return "Aujourd'hui";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export function AlertsCard() {
  const { restaurant } = useAuth();
  const restaurantId = restaurant?.id ?? null;
  const [rows, setRows] = useState<PendingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    if (!restaurantId || !supabase) {
      setRows([]);
      setLoading(false);
      return () => {
        mounted.current = false;
      };
    }

    const load = async () => {
      const { data, error } = await supabase!
        .from("reservations")
        .select("id, reservation_date, reservation_time, name, covers, table_label")
        .eq("restaurant_id", restaurantId)
        .eq("status", "pending")
        .gte("reservation_date", todayIso())
        .order("reservation_date", { ascending: true })
        .order("reservation_time", { ascending: true })
        .limit(8);
      if (!mounted.current) return;
      if (error) {
        setRows([]);
      } else {
        setRows((data ?? []) as PendingRow[]);
      }
      setLoading(false);
    };

    void load();
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 30_000);
    return () => {
      mounted.current = false;
      window.clearInterval(id);
    };
  }, [restaurantId]);

  return (
    <Card className="col-span-5 p-[18px]">
      <CardHeader>
        <CardTitle>
          <Link to="/reservations" className="hover:text-ember-soft transition-colors">
            Demandes · <span className="text-ember-soft">en attente</span>
          </Link>
        </CardTitle>
        <span className="text-[11.5px] text-ink-3">
          {rows.length} {rows.length > 1 ? "demandes" : "demande"}
        </span>
      </CardHeader>

      {loading ? (
        <div className="py-10 text-center text-[12px] text-ink-3">Chargement…</div>
      ) : rows.length === 0 ? (
        <div className="py-8 text-center text-[12px] text-ink-3">
          Aucune demande en attente.
        </div>
      ) : (
        <div className="flex flex-col gap-[2px] max-h-[260px] overflow-y-auto pr-[6px]">
          {rows.map((r) => (
            <button
              key={r.id}
              onClick={() => navigate("/reservations", { state: { openId: r.id } })}
              className="flex items-center gap-3 px-[10px] py-[10px] rounded-[8px] border border-ember-soft/30 bg-ember/5 hover:bg-ember/10 transition-colors text-left group"
            >
              <span className="w-[28px] h-[28px] rounded-[8px] grid place-items-center bg-ember/15 text-ember-soft shrink-0">
                <AlertTriangle size={13} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-ink-1 truncate">
                  {r.name}
                </div>
                <div className="text-[11px] text-ink-3 mono inline-flex items-center gap-2 mt-[1px]">
                  <span>{formatDateLabel(r.reservation_date)} · {r.reservation_time}</span>
                  <span className="inline-flex items-center gap-[3px]">
                    <Users size={10} />
                    {r.covers}
                  </span>
                  {r.table_label && (
                    <span className="inline-flex items-center gap-[3px]">
                      <Clock size={10} />
                      {r.table_label}
                    </span>
                  )}
                </div>
              </div>
              <ArrowRight
                size={14}
                className="text-ink-4 group-hover:text-ember-soft group-hover:translate-x-[2px] transition-all shrink-0"
              />
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}
