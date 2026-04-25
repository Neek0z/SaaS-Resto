import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { listOrders } from "@/lib/api/orders";
import { listReservations } from "@/lib/api/reservations";
import type { Order, OrderStatus, Reservation } from "@/lib/mock-data";
import { OrderRow } from "@/components/orders/OrderRow";
import { ResaRow } from "@/components/reservations/ResaRow";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { RESTO } from "@/lib/mock-data";

export default function EmployeeView() {
  const navigate = useNavigate();
  const { restaurant, user, signOut } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [resas, setResas] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const [o, r] = await Promise.all([listOrders(), listReservations()]);
      setOrders(o);
      setResas(r);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const updateOrderStatus = (id: string, status: OrderStatus) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  };

  const activeOrders = useMemo(
    () => orders.filter((o) => o.status !== "served" && o.status !== "cancelled"),
    [orders]
  );
  const servedCount = orders.filter((o) => o.status === "served").length;

  const todayResas = useMemo(
    () =>
      [...resas].sort((a, b) => a.time.localeCompare(b.time)),
    [resas]
  );

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  const restoName = restaurant?.name ?? RESTO.name;
  const userInitials = (user?.email ?? "?").slice(0, 1).toUpperCase();

  return (
    <div className="min-h-screen bg-bg-0 text-ink-1">
      <header
        className="sticky top-0 z-10 flex items-center gap-4 px-6 py-4 border-b border-line"
        style={{ background: "linear-gradient(180deg, var(--bg-0) 80%, transparent)" }}
      >
        <div
          className="w-9 h-9 rounded-[10px] grid place-items-center text-cream font-bold display"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, var(--ember) 0%, var(--ember-deep) 60%, #5c2a0e 100%)",
          }}
        >
          S
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] mono uppercase tracking-[0.12em] text-ink-4">
            Vue service · employé
          </div>
          <div className="display font-medium text-[18px] truncate">{restoName}</div>
        </div>
        <button
          className="btn-ghost inline-flex items-center gap-2"
          onClick={() => void refresh()}
          disabled={loading}
        >
          <RefreshCw size={13} className={cn(loading && "animate-spin")} />
          Actualiser
        </button>
        <div className="flex items-center gap-2 pl-3 border-l border-line">
          <span className="avatar-circle w-8 h-8 text-[12px]">{userInitials}</span>
          <button
            className="btn-ghost inline-flex items-center gap-2"
            onClick={handleSignOut}
            title="Se déconnecter"
          >
            <LogOut size={13} />
            Déconnexion
          </button>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-2 gap-5 p-6">
        <section>
          <Card>
            <CardHeader>
              <CardTitle>
                Commandes en cours ·{" "}
                <span className="text-ember-soft">{activeOrders.length}</span>
              </CardTitle>
              <span className="text-[11px] text-ink-4 mono uppercase tracking-[0.08em]">
                {servedCount} servies aujourd'hui
              </span>
            </CardHeader>
            {loading ? (
              <div className="py-16 text-center text-ink-3 text-[13px]">Chargement…</div>
            ) : activeOrders.length === 0 ? (
              <div className="py-16 text-center text-ink-3 text-[13px]">
                Aucune commande en cours.
              </div>
            ) : (
              <div className="flex flex-col gap-[2px]">
                {activeOrders.map((o) => (
                  <OrderRow
                    key={o.id}
                    order={o}
                    onClick={() => {
                      const next = nextStatus(o.status);
                      if (next) updateOrderStatus(o.id, next);
                    }}
                  />
                ))}
              </div>
            )}
            <div className="mt-3 px-1 text-[11px] text-ink-4">
              Tap sur une commande pour passer au statut suivant.
            </div>
          </Card>
        </section>

        <section>
          <Card>
            <CardHeader>
              <CardTitle>
                Réservations du jour ·{" "}
                <span className="text-ember-soft">{todayResas.length}</span>
              </CardTitle>
              <span className="text-[11px] text-ink-4 mono uppercase tracking-[0.08em]">
                Lecture seule
              </span>
            </CardHeader>
            {loading ? (
              <div className="py-16 text-center text-ink-3 text-[13px]">Chargement…</div>
            ) : todayResas.length === 0 ? (
              <div className="py-16 text-center text-ink-3 text-[13px]">
                Aucune réservation aujourd'hui.
              </div>
            ) : (
              <div className="flex flex-col gap-[2px]">
                {todayResas.map((r) => (
                  <ResaRow key={`${r.time}-${r.table}`} r={r} />
                ))}
              </div>
            )}
          </Card>
        </section>
      </main>
    </div>
  );
}

function nextStatus(s: OrderStatus): OrderStatus | null {
  if (s === "pending") return "preparing";
  if (s === "preparing") return "served";
  return null;
}
