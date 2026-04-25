import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { isSupabaseConfigured } from "@/lib/supabase";
import { SupabaseMissing } from "@/components/auth/SupabaseMissing";
import {
  AuthError,
  AuthField,
  AuthInput,
  AuthLayout,
  AuthSuccess,
} from "@/components/auth/AuthLayout";

export default function Register() {
  const navigate = useNavigate();
  const { signUp, signIn, user } = useAuth();
  const [restaurantName, setRestaurantName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isSupabaseConfigured) return <SupabaseMissing />;
  if (user) return <Navigate to="/dashboard" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!restaurantName.trim()) {
      setError("Le nom du restaurant est requis.");
      return;
    }
    if (password.length < 6) {
      setError("Mot de passe trop court (6 caractères minimum).");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setSubmitting(true);
    const { error: upErr } = await signUp(email.trim(), password, restaurantName.trim());
    if (upErr) {
      setSubmitting(false);
      setError(upErr);
      return;
    }

    // Tenter une connexion immédiate (dépend de la config confirmation email).
    const { error: inErr } = await signIn(email.trim(), password);
    setSubmitting(false);
    if (inErr) {
      setInfo(
        "Compte créé. Confirmez votre email pour vous connecter, ou connectez-vous si la confirmation n'est pas activée."
      );
      return;
    }
    navigate("/dashboard", { replace: true });
  };

  return (
    <AuthLayout
      title={
        <>
          Créer{" "}
          <em className="not-italic italic text-ember-soft font-normal">
            votre compte
          </em>
        </>
      }
      subtitle="Commencez gratuitement avec le plan Essentiel."
      footer={
        <span className="text-ink-4">
          Déjà un compte ?{" "}
          <Link to="/login" className="text-ember-soft hover:underline">
            Se connecter
          </Link>
        </span>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <AuthField label="Nom du restaurant">
          <AuthInput
            required
            autoFocus
            value={restaurantName}
            onChange={(e) => setRestaurantName(e.target.value)}
            placeholder="Maison Sévère"
          />
        </AuthField>

        <AuthField label="Email">
          <AuthInput
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@restaurant.fr"
          />
        </AuthField>

        <AuthField label="Mot de passe">
          <AuthInput
            type="password"
            required
            autoComplete="new-password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="6 caractères minimum"
          />
        </AuthField>

        <AuthField label="Confirmation">
          <AuthInput
            type="password"
            required
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Répéter le mot de passe"
          />
        </AuthField>

        <AuthError message={error} />
        <AuthSuccess message={info} />

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <UserPlus size={13} />
          {submitting ? "Création…" : "Créer le compte"}
        </button>

        <p className="text-[11px] text-ink-4 text-center mt-1">
          En créant un compte, vous acceptez les conditions d'utilisation.
        </p>
      </form>
    </AuthLayout>
  );
}
