import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Send } from "lucide-react";
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

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isSupabaseConfigured) return <SupabaseMissing />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);
    const { error } = await resetPassword(email.trim());
    setSubmitting(false);
    if (error) {
      setError(error);
      return;
    }
    setInfo("Si un compte existe pour cet email, un lien de réinitialisation a été envoyé.");
  };

  return (
    <AuthLayout
      title={
        <>
          Mot de passe{" "}
          <em className="not-italic italic text-ember-soft font-normal">oublié ?</em>
        </>
      }
      subtitle="Recevez un lien pour réinitialiser votre mot de passe."
      footer={
        <span className="text-ink-4">
          <Link to="/login" className="text-ember-soft hover:underline">
            ← Retour à la connexion
          </Link>
        </span>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <AuthField label="Email du compte">
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

        <AuthError message={error} />
        <AuthSuccess message={info} />

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Send size={13} />
          {submitting ? "Envoi…" : "Envoyer le lien"}
        </button>
      </form>
    </AuthLayout>
  );
}
