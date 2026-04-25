import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PlanGate } from "@/components/PlanGate";
import Landing from "@/pages/Landing";

const AppShell = lazy(() =>
  import("@/components/layout/AppShell").then((m) => ({ default: m.AppShell })),
);

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Orders = lazy(() => import("@/pages/Orders"));
const Reservations = lazy(() => import("@/pages/Reservations"));
const Menu = lazy(() => import("@/pages/Menu"));
const Reviews = lazy(() => import("@/pages/Reviews"));
const Team = lazy(() => import("@/pages/Team"));
const DigitalMenu = lazy(() => import("@/pages/DigitalMenu"));
const Loyalty = lazy(() => import("@/pages/Loyalty"));
const Events = lazy(() => import("@/pages/Events"));
const Customers = lazy(() => import("@/pages/Customers"));
const QRCodes = lazy(() => import("@/pages/QRCodes"));
const Settings = lazy(() => import("@/pages/Settings"));
const EmployeeView = lazy(() => import("@/pages/EmployeeView"));

const Login = lazy(() => import("@/pages/auth/Login"));
const Register = lazy(() => import("@/pages/auth/Register"));
const ForgotPassword = lazy(() => import("@/pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/auth/ResetPassword"));

const PublicMenu = lazy(() => import("@/pages/PublicMenu"));

function RouteFallback() {
  return (
    <div className="min-h-screen grid place-items-center bg-bg-0 text-ink-3 text-[13px]">
      Chargement…
    </div>
  );
}

function RoleAwareShell() {
  const { role, actualRole } = useAuth();
  // Un developer qui simule "employee" reste libre d'explorer le dashboard ;
  // seuls les vrais employés sont redirigés vers /service.
  if (role === "employee" && actualRole === "employee") {
    return <Navigate to="/service" replace />;
  }
  return <AppShell />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/carte/:slug" element={<PublicMenu />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route
              path="/service"
              element={
                <ProtectedRoute>
                  <EmployeeView />
                </ProtectedRoute>
              }
            />

            <Route
              element={
                <ProtectedRoute>
                  <RoleAwareShell />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="commandes" element={<Orders />} />
              <Route path="reservations" element={<Reservations />} />
              <Route path="menu" element={<Menu />} />
              <Route path="avis" element={<Reviews />} />
              <Route path="equipe" element={<Team />} />
              <Route path="menu-numerique" element={<DigitalMenu />} />
              <Route path="qrcode" element={<QRCodes />} />
              <Route
                path="fidelite"
                element={
                  <PlanGate feature="fidelite" requiredPlan="pro">
                    <Loyalty />
                  </PlanGate>
                }
              />
              <Route
                path="evenements"
                element={
                  <PlanGate feature="evenements" requiredPlan="pro">
                    <Events />
                  </PlanGate>
                }
              />
              <Route
                path="clients"
                element={
                  <PlanGate feature="suivi_client" requiredPlan="pro">
                    <Customers />
                  </PlanGate>
                }
              />
              <Route path="parametres" element={<Settings />} />
            </Route>
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
