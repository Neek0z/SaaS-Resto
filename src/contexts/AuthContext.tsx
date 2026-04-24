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
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { Plan } from "@/config/plans";

export type RestaurantProfile = {
  id: string;
  name: string;
  plan: Plan;
  billingCycle: "monthly" | "yearly";
};

type AuthResult = { error: string | null };

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  restaurant: RestaurantProfile | null;
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
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  const loadRestaurant = useCallback(async (uid: string | null) => {
    if (!supabase || !uid) {
      setRestaurant(null);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("app_users")
        .select("restaurant_id, restaurants(id, name, plan, billing_cycle)")
        .eq("id", uid)
        .maybeSingle();

      if (error) {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.warn("[auth] loadRestaurant error:", error.message);
        }
        setRestaurant(null);
        return;
      }
      if (!data) {
        setRestaurant(null);
        return;
      }
      const r = (data as unknown as {
        restaurants:
          | { id: string; name: string; plan: Plan; billing_cycle: "monthly" | "yearly" }
          | null;
      }).restaurants;
      if (!r) {
        setRestaurant(null);
        return;
      }
      setRestaurant({
        id: r.id,
        name: r.name,
        plan: r.plan,
        billingCycle: r.billing_cycle,
      });
    } catch (e) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn("[auth] loadRestaurant threw:", e);
      }
      setRestaurant(null);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Fallback de sécurité : si rien ne répond en 5s, on débloque l'UI.
    const safety = setTimeout(() => {
      if (mounted.current) setLoading(false);
    }, 5000);

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted.current) return;
        setSession(data.session);
        setUser(data.session?.user ?? null);
        setLoading(false);
        // Chargement du restaurant en arrière-plan — ne bloque pas l'UI.
        void loadRestaurant(data.session?.user.id ?? null);
      })
      .catch(() => {
        if (mounted.current) setLoading(false);
      })
      .finally(() => clearTimeout(safety));

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted.current) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);
      void loadRestaurant(newSession?.user.id ?? null);
    });

    return () => {
      mounted.current = false;
      sub.subscription.unsubscribe();
    };
  }, [loadRestaurant]);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (!supabase) return { error: "Configuration Supabase manquante." };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? translateAuthError(error.message) : null };
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, restaurantName: string): Promise<AuthResult> => {
      if (!supabase) return { error: "Configuration Supabase manquante." };
      const { error } = await supabase.auth.signUp({
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
    if (!supabase) return;
    await supabase.auth.signOut();
    setRestaurant(null);
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<AuthResult> => {
    if (!supabase) return { error: "Configuration Supabase manquante." };
    const redirectTo = `${window.location.origin}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    return { error: error ? translateAuthError(error.message) : null };
  }, []);

  const updatePassword = useCallback(async (password: string): Promise<AuthResult> => {
    if (!supabase) return { error: "Configuration Supabase manquante." };
    const { error } = await supabase.auth.updateUser({ password });
    return { error: error ? translateAuthError(error.message) : null };
  }, []);

  const refreshRestaurant = useCallback(async () => {
    await loadRestaurant(user?.id ?? null);
  }, [loadRestaurant, user?.id]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      restaurant,
      loading,
      signIn,
      signUp,
      signOut,
      resetPassword,
      updatePassword,
      refreshRestaurant,
    }),
    [user, session, restaurant, loading, signIn, signUp, signOut, resetPassword, updatePassword, refreshRestaurant]
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
