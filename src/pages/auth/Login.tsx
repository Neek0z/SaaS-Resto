import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { LogIn } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { isSupabaseConfigured } from "@/lib/supabase";
import { SupabaseMissing } from "@/components/auth/SupabaseMissing";
import {
  AuthError,
  AuthField,
  AuthInput,
  AuthLayout,
} from "@/components/auth/AuthLayout";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isSupabaseConfigured) return <SupabaseMissing />;

  if (user) {
    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate to={from && from !== "/login" ? from : "/"} replace />;
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error } = await signIn(email.trim(), password);
    setSubmitting(false);
    if (error) {
      setError(error);
      return;
    }
    navigate("/", { replace: true });
  };

  return (
    <AuthLayout
      title={
        <>
          Connexion{" "}
          <em className="not-italic italic text-ember-soft font-normal">au compte</em>
        </>
      }
      subtitle="Accédez à votre console de gestion."
      footer={
        <span className="text-ink-4">
          Pas encore de compte ?{" "}
          <Link to="/register" className="text-ember-soft hover:underline">
            Créer un compte
          </Link>
        </span>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <AuthField label="Email">
          <AuthInput
            type="email"
            required
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@restaurant.fr"
          />
        </AuthField>

        <AuthField label="Mot de passe">
          <AuthInput
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </AuthField>

        <div className="text-right -mt-1">
          <Link
            to="/forgot-password"
            className="text-[11.5px] text-ink-3 hover:text-ember-soft transition-colors"
          >
            Mot de passe oublié ?
          </Link>
        </div>

        <AuthError message={error} />

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <LogIn size={13} />
          {submitting ? "Connexion…" : "Se connecter"}
        </button>
      </form>
    </AuthLayout>
  );
}
