import { DashboardProvider } from "@/hooks/useDashboard";
import { KpiStrip } from "@/components/dashboard/KpiStrip";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { CoversChart } from "@/components/dashboard/CoversChart";
import { OrdersCard } from "@/components/dashboard/OrdersCard";
import { ReservationsCard } from "@/components/dashboard/ReservationsCard";
import { MenuCard } from "@/components/dashboard/MenuCard";
import { ReviewsCard } from "@/components/dashboard/ReviewsCard";
import { TeamCard } from "@/components/dashboard/TeamCard";
import { AlertsCard } from "@/components/dashboard/AlertsCard";
import { EventsTodayCard } from "@/components/dashboard/EventsTodayCard";

export default function Dashboard() {
  return (
    <DashboardProvider>
      <KpiStrip />

      <div className="grid grid-cols-12 gap-4 mb-4">
        <RevenueChart />
        <CoversChart />
      </div>

      <div className="grid grid-cols-12 gap-4 mb-4">
        <EventsTodayCard />
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
    </DashboardProvider>
  );
}
