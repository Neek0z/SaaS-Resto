import { KpiStrip } from "@/components/dashboard/KpiStrip";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { CoversChart } from "@/components/dashboard/CoversChart";
import { OrdersCard } from "@/components/dashboard/OrdersCard";
import { ReservationsCard } from "@/components/dashboard/ReservationsCard";
import { MenuCard } from "@/components/dashboard/MenuCard";
import { ReviewsCard } from "@/components/dashboard/ReviewsCard";
import { TeamCard } from "@/components/dashboard/TeamCard";
import { AlertsCard } from "@/components/dashboard/AlertsCard";

export default function Dashboard() {
  return (
    <>
      <KpiStrip />

      <div className="grid grid-cols-12 gap-4 mb-4">
        <RevenueChart />
        <CoversChart />
      </div>

      <div className="grid grid-cols-12 gap-4 mb-4">
        <OrdersCard />
        <ReservationsCard />
      </div>

      <div className="grid grid-cols-12 gap-4 mb-4">
        <MenuCard />
        <ReviewsCard />
      </div>

      <div className="grid grid-cols-12 gap-4 mb-4">
        <TeamCard />
        <AlertsCard />
      </div>
    </>
  );
}
