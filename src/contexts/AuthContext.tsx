import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/supabase-env";
import type { Plan } from "@/config/plans";
import { DEV_OVERRIDE_ROLE, ROLE_ORDER, type Role } from "@/config/roles";
import type { PermissionOverrides } from "@/config/permissions";

const ROLE_OVERRIDE_KEY = "dev:role";

function readRoleOverride(): Role | null {
  if (typeof sessionStorage === "undefined") return null;
  const raw = sessionStorage.getItem(ROLE_OVERRIDE_KEY);
  if (!raw) return null;
  return ROLE_ORDER.includes(raw as Role) ? (raw as Role) : null;
}

export type DaySchedule = {
  open: boolean;
  lunch: { start: string; end: string } | null;
  dinner: { start: string; end: string } | null;
};

export type WeekdayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type WeeklyHours = Record<WeekdayKey, DaySchedule>;

export type PaymentSettings = {
  card: boolean;
  cash: boolean;
  ticketResto: boolean;
  walletPay: boolean;
  amex: boolean;
  serviceRate: number;
  vatRate: number;
};

export type RestaurantProfile = {
  id: string;
  name: string;
  plan: Plan;
  billingCycle: "monthly" | "yearly";
  rolePermissions: PermissionOverrides;
  slug: string | null;
  logoUrl: string | null;
  businessType: string | null;
  addressLine: string | null;
  addressZip: string | null;
  addressCity: string | null;
  phone: string | null;
  contactEmail: string | null;
  siret: string | null;
  vatNumber: string | null;
  description: string | null;
  hours: WeeklyHours;
  payment: PaymentSettings;
};

export const WEEKDAYS: { key: WeekdayKey; label: string }[] = [
  { key: "mon", label: "Lundi" },
  { key: "tue", label: "Mardi" },
  { key: "wed", label: "Mercredi" },
  { key: "thu", label: "Jeudi" },
  { key: "fri", label: "Vendredi" },
  { key: "sat", label: "Samedi" },
  { key: "sun", label: "Dimanche" },
];

const DEFAULT_DAY: DaySchedule = {
  open: true,
  lunch: { start: "12:00", end: "14:30" },
  dinner: { start: "19:00", end: "23:00" },
};

export function defaultHours(): WeeklyHours {
  return WEEKDAYS.reduce((acc, { key }) => {
    acc[key] = { ...DEFAULT_DAY, lunch: { ...DEFAULT_DAY.lunch! }, dinner: { ...DEFAULT_DAY.dinner! } };
    return acc;
  }, {} as WeeklyHours);
}

export const DEFAULT_PAYMENT: PaymentSettings = {
  card: true,
  cash: true,
  ticketResto: true,
  walletPay: false,
  amex: false,
  serviceRate: 12,
  vatRate: 10,
};

function parseHours(raw: unknown): WeeklyHours {
  const base = defaultHours();
  if (!raw || typeof raw !== "object") return base;
  const obj = raw as Record<string, unknown>;
  for (const { key } of WEEKDAYS) {
    const v = obj[key];
    if (!v || typeof v !== "object") continue;
    const d = v as Record<string, unknown>;
    base[key] = {
      open: typeof d.open === "boolean" ? d.open : base[key].open,
      lunch:
        d.lunch === null
          ? null
          : isSlot(d.lunch)
          ? { start: String(d.lunch.start), end: String(d.lunch.end) }
          : base[key].lunch,
      dinner:
        d.dinner === null
          ? null
          : isSlot(d.dinner)
          ? { start: String(d.dinner.start), end: String(d.dinner.end) }
          : base[key].dinner,
    };
  }
  return base;
}

function isSlot(v: unknown): v is { start: string; end: string } {
  return typeof v === "object" && v !== null && "start" in v && "end" in v;
}

function parsePayment(raw: unknown): PaymentSettings {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_PAYMENT };
  const r = raw as Record<string, unknown>;
  const num = (v: unknown, d: number) => (typeof v === "number" && isFinite(v) ? v : d);
  const bool = (v: unknown, d: boolean) => (typeof v === "boolean" ? v : d);
  return {
    card: bool(r.card, DEFAULT_PAYMENT.card),
    cash: bool(r.cash, DEFAULT_PAYMENT.cash),
    ticketResto: bool(r.ticket_resto ?? r.ticketResto, DEFAULT_PAYMENT.ticketResto),
    walletPay: bool(r.wallet_pay ?? r.walletPay, DEFAULT_PAYMENT.walletPay),
    amex: bool(r.amex, DEFAULT_PAYMENT.amex),
    serviceRate: num(r.service_rate ?? r.serviceRate, DEFAULT_PAYMENT.serviceRate),
    vatRate: num(r.vat_rate ?? r.vatRate, DEFAULT_PAYMENT.vatRate),
  };
}

export type UserProfile = {
  id: string;
  email: string;
  role: Role;
};

type AuthResult = { error: string | null };

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  restaurant: RestaurantProfile | null;
  profile: UserProfile | null;
  role: Role;
  actualRole: Role;
  roleOverride: Role | null;
  setRoleOverride: (role: Role | null) => void;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (
    email: string,
    password: string,
    restaurantName: string
  ) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<AuthResult>;
  updatePassword: (password: string) => Promise<AuthResult>;
  refreshRestaurant: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

let supabasePromise: Promise<SupabaseClient | null> | null = null;
function getSupabase(): Promise<SupabaseClient | null> {
  if (!isSupabaseConfigured) return Promise.resolve(null);
  if (!supabasePromise) {
    supabasePromise = import("@/lib/supabase").then((m) => m.supabase);
  }
  return supabasePromise;
}

function translateAuthError(message: string | undefined): string {
  if (!message) return "Une erreur est survenue.";
  const m = message.toLowerCase();
  if (m.includes("invalid login") || m.includes("invalid credentials")) {
    return "Identifiants incorrects.";
  }
  if (m.includes("email not confirmed")) {
    return "Email non confirmé. Vérifiez votre boîte mail.";
  }
  if (m.includes("user already registered") || m.includes("already been registered")) {
    return "Cet email est déjà utilisé.";
  }
  if (m.includes("password should be") || m.includes("password must")) {
    return "Mot de passe trop court (6 caractères minimum).";
  }
  if (m.includes("rate limit")) {
    return "Trop de tentatives. Réessayez dans quelques minutes.";
  }
  if (m.includes("unable to validate email") || m.includes("invalid email")) {
    return "Email invalide.";
  }
  if (m.includes("network") || m.includes("fetch")) {
    return "Problème de connexion réseau.";
  }
  return message;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [restaurant, setRestaurant] = useState<RestaurantProfile | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleOverrideState, setRoleOverrideState] = useState<Role | null>(() =>
    readRoleOverride()
  );
  const mounted = useRef(true);

  const setRoleOverride = useCallback((next: Role | null) => {
    if (typeof sessionStorage !== "undefined") {
      if (next) sessionStorage.setItem(ROLE_OVERRIDE_KEY, next);
      else sessionStorage.removeItem(ROLE_OVERRIDE_KEY);
    }
    setRoleOverrideState(next);
  }, []);

  const loadRestaurant = useCallback(
    async (sb: SupabaseClient | null, uid: string | null) => {
      if (!sb || !uid) {
        setRestaurant(null);
        setProfile(null);
        return;
      }
      try {
        const { data, error } = await sb
          .from("app_users")
          .select(
            "id, email, role, restaurant_id, restaurants(id, name, plan, billing_cycle, role_permissions, slug, logo_url, business_type, address_line, address_zip, address_city, phone, contact_email, siret, vat_number, description, hours, payment)"
          )
          .eq("id", uid)
          .maybeSingle();

        if (error) {
          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.warn("[auth] loadRestaurant error:", error.message);
          }
          setRestaurant(null);
          setProfile(null);
          return;
        }
        if (!data) {
          setRestaurant(null);
          setProfile(null);
          return;
        }
        const row = data as unknown as {
          id: string;
          email: string;
          role: Role;
          restaurants:
            | {
                id: string;
                name: string;
                plan: Plan;
                billing_cycle: "monthly" | "yearly";
                role_permissions: PermissionOverrides | null;
                slug: string | null;
                logo_url: string | null;
                business_type: string | null;
                address_line: string | null;
                address_zip: string | null;
                address_city: string | null;
                phone: string | null;
                contact_email: string | null;
                siret: string | null;
                vat_number: string | null;
                description: string | null;
                hours: unknown;
                payment: unknown;
              }
            | null;
        };
        setProfile({ id: row.id, email: row.email, role: row.role });
        if (!row.restaurants) {
          setRestaurant(null);
          return;
        }
        const r = row.restaurants;
        setRestaurant({
          id: r.id,
          name: r.name,
          plan: r.plan,
          billingCycle: r.billing_cycle,
          rolePermissions: r.role_permissions ?? {},
          slug: r.slug ?? null,
          logoUrl: r.logo_url ?? null,
          businessType: r.business_type ?? null,
          addressLine: r.address_line ?? null,
          addressZip: r.address_zip ?? null,
          addressCity: r.address_city ?? null,
          phone: r.phone ?? null,
          contactEmail: r.contact_email ?? null,
          siret: r.siret ?? null,
          vatNumber: r.vat_number ?? null,
          description: r.description ?? null,
          hours: parseHours(r.hours),
          payment: parsePayment(r.payment),
        });
      } catch (e) {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.warn("[auth] loadRestaurant threw:", e);
        }
        setRestaurant(null);
        setProfile(null);
      }
    },
    []
  );

  useEffect(() => {
    mounted.current = true;
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    const safety = setTimeout(() => {
      if (mounted.current) setLoading(false);
    }, 5000);

    let unsub: (() => void) | null = null;

    void getSupabase().then(async (sb) => {
      if (!sb || !mounted.current) {
        if (mounted.current) setLoading(false);
        clearTimeout(safety);
        return;
      }
      try {
        const { data } = await sb.auth.getSession();
        if (!mounted.current) return;
        setSession(data.session);
        setUser(data.session?.user ?? null);
        setLoading(false);
        void loadRestaurant(sb, data.session?.user.id ?? null);
      } catch {
        if (mounted.current) setLoading(false);
      } finally {
        clearTimeout(safety);
      }

      const { data: sub } = sb.auth.onAuthStateChange((_event, newSession) => {
        if (!mounted.current) return;
        setSession(newSession);
        setUser(newSession?.user ?? null);
        void loadRestaurant(sb, newSession?.user.id ?? null);
      });
      unsub = () => sub.subscription.unsubscribe();
    });

    return () => {
      mounted.current = false;
      clearTimeout(safety);
      if (unsub) unsub();
    };
  }, [loadRestaurant]);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const sb = await getSupabase();
    if (!sb) return { error: "Configuration Supabase manquante." };
    const { error } = await sb.auth.signInWithPassword({ email, password });
    return { error: error ? translateAuthError(error.message) : null };
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, restaurantName: string): Promise<AuthResult> => {
      const sb = await getSupabase();
      if (!sb) return { error: "Configuration Supabase manquante." };
      const { error } = await sb.auth.signUp({
        email,
        password,
        options: {
          data: { restaurant_name: restaurantName },
        },
      });
      return { error: error ? translateAuthError(error.message) : null };
    },
    []
  );

  const signOut = useCallback(async () => {
    const sb = await getSupabase();
    if (!sb) return;
    await sb.auth.signOut();
    setRestaurant(null);
    setProfile(null);
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<AuthResult> => {
    const sb = await getSupabase();
    if (!sb) return { error: "Configuration Supabase manquante." };
    const redirectTo = `${window.location.origin}/reset-password`;
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo });
    return { error: error ? translateAuthError(error.message) : null };
  }, []);

  const updatePassword = useCallback(async (password: string): Promise<AuthResult> => {
    const sb = await getSupabase();
    if (!sb) return { error: "Configuration Supabase manquante." };
    const { error } = await sb.auth.updateUser({ password });
    return { error: error ? translateAuthError(error.message) : null };
  }, []);

  const refreshRestaurant = useCallback(async () => {
    const sb = await getSupabase();
    await loadRestaurant(sb, user?.id ?? null);
  }, [loadRestaurant, user?.id]);

  const actualRole: Role = DEV_OVERRIDE_ROLE || profile?.role || "owner";
  // Override autorisé uniquement si le rôle réel est developer.
  const effectiveOverride =
    actualRole === "developer" ? roleOverrideState : null;
  const role: Role = effectiveOverride ?? actualRole;

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      restaurant,
      profile,
      role,
      actualRole,
      roleOverride: effectiveOverride,
      setRoleOverride,
      loading,
      signIn,
      signUp,
      signOut,
      resetPassword,
      updatePassword,
      refreshRestaurant,
    }),
    [
      user,
      session,
      restaurant,
      profile,
      role,
      actualRole,
      effectiveOverride,
      setRoleOverride,
      loading,
      signIn,
      signUp,
      signOut,
      resetPassword,
      updatePassword,
      refreshRestaurant,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth doit être utilisé dans un AuthProvider");
  }
  return ctx;
}
