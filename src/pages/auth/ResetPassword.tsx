import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { SupabaseMissing } from "@/components/auth/SupabaseMissing";
import {
  AuthError,
  AuthField,
  AuthInput,
  AuthLayout,
  AuthSuccess,
} from "@/components/auth/AuthLayout";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setReady(!!data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!isSupabaseConfigured) return <SupabaseMissing />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (password.length < 6) {
      setError("Mot de passe trop court (6 caractères minimum).");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setSubmitting(true);
    const { error } = await updatePassword(password);
    setSubmitting(false);
    if (error) {
      setError(error);
      return;
    }
    setInfo("Mot de passe mis à jour. Redirection…");
    setTimeout(() => navigate("/dashboard", { replace: true }), 1200);
  };

  return (
    <AuthLayout
      title={
        <>
          Nouveau{" "}
          <em className="not-italic italic text-ember-soft font-normal">
            mot de passe
          </em>
        </>
      }
      subtitle={
        ready
          ? "Choisissez un nouveau mot de passe pour votre compte."
          : "Lien invalide ou expiré. Demandez un nouveau lien."
      }
      footer={
        <span className="text-ink-4">
          <Link to="/login" className="text-ember-soft hover:underline">
            ← Retour à la connexion
          </Link>
        </span>
      }
    >
      {ready ? (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <AuthField label="Nouveau mot de passe">
            <AuthInput
              type="password"
              required
              autoComplete="new-password"
              autoFocus
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
            <Check size={13} />
            {submitting ? "Mise à jour…" : "Mettre à jour"}
          </button>
        </form>
      ) : (
        <div className="text-[13px] text-ink-3">
          Si vous êtes arrivé ici depuis un email, le lien peut avoir expiré. Retournez à la page{" "}
          <Link to="/forgot-password" className="text-ember-soft hover:underline">
            mot de passe oublié
          </Link>{" "}
          pour en recevoir un nouveau.
        </div>
      )}
    </AuthLayout>
  );
}
