import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { PlanGate } from "@/components/PlanGate";
import Dashboard from "@/pages/Dashboard";
import Orders from "@/pages/Orders";
import Reservations from "@/pages/Reservations";
import Menu from "@/pages/Menu";
import Reviews from "@/pages/Reviews";
import Team from "@/pages/Team";
import DigitalMenu from "@/pages/DigitalMenu";
import Loyalty from "@/pages/Loyalty";
import Settings from "@/pages/Settings";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import ResetPassword from "@/pages/auth/ResetPassword";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="commandes" element={<Orders />} />
            <Route path="reservations" element={<Reservations />} />
            <Route path="menu" element={<Menu />} />
            <Route path="avis" element={<Reviews />} />
            <Route path="equipe" element={<Team />} />
            <Route path="menu-numerique" element={<DigitalMenu />} />
            <Route
              path="fidelite"
              element={
                <PlanGate feature="fidelite" requiredPlan="pro">
                  <Loyalty />
                </PlanGate>
              }
            />
            <Route path="parametres" element={<Settings />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
