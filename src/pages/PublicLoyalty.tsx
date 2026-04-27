import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Heart } from "lucide-react";
import {
  fetchPublicReservationInfo,
  type PublicResaInfo,
} from "@/lib/api/public-reservation";
import { createPublicLoyaltySignup } from "@/lib/api/public-loyalty";
import { extractErrorMessage } from "@/lib/errors";

type State =
  | { status: "loading" }
  | { status: "not_found" }
  | { status: "error"; message: string }
  | { status: "ready"; data: PublicResaInfo };

export default function PublicLoyalty() {
  const { slug } = useParams<{ slug: string }>();
  const [state, setState] = useState<State>({ status: "loading" });
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [optedIn, setOptedIn] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState<"created" | "updated" | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!slug) {
      setState({ status: "not_found" });
      return;
    }
    setState({ status: "loading" });
    fetchPublicReservationInfo(slug)
      .then((data) => {
        if (cancelled) return;
        if (!data) {
          setState({ status: "not_found" });
          return;
        }
        setState({ status: "ready", data });
      })
      .catch((e) => {
        if (cancelled) return;
        setState({ status: "error", message: extractErrorMessage(e) });
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    document.body.classList.add("public-menu-mode");
    return () => document.body.classList.remove("public-menu-mode");
  }, []);

  if (state.status === "loading") {
    return (
      <main className="min-h-screen bg-bg-0 grid place-items-center text-ink-3 text-[13px]">
        Chargement…
      </main>
    );
  }

  if (state.status === "not_found") {
    return (
      <main className="min-h-screen bg-bg-0 grid place-items-center px-6">
        <div className="text-center max-w-sm">
          <div className="display text-[28px] font-medium mb-2">Établissement introuvable</div>
          <div className="text-[13px] text-ink-3">
            L&apos;adresse <span className="mono text-ink-2">/fidelite/{slug}</span> ne
            correspond à aucun restaurant publié.
          </div>
        </div>
      </main>
    );
  }

  if (state.status === "error") {
    return (
      <main className="min-h-screen bg-bg-0 grid place-items-center px-6">
        <div className="text-center max-w-sm">
          <div className="display text-[22px] font-medium mb-2 text-danger">
            Une erreur est survenue
          </div>
          <div className="text-[12px] text-ink-3 mono">{state.message}</div>
        </div>
      </main>
    );
  }

  const r = state.data.restaurant;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await createPublicLoyaltySignup(slug, {
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        optedInEmail: optedIn,
      });
      setDone(res.status);
    } catch (e2) {
      setSubmitError(extractErrorMessage(e2));
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <main className="min-h-screen bg-bg-0 px-6 py-10">
        <div className="max-w-[420px] mx-auto text-center">
          <div className="w-[64px] h-[64px] rounded-full mx-auto mb-4 grid place-items-center bg-ok/15 text-ok border border-ok/30">
            <CheckCircle2 size={28} />
          </div>
          <h1 className="display font-medium text-[28px] leading-tight mb-2">
            {done === "created" ? "Bienvenue !" : "Compte mis à jour"}
          </h1>
          <p className="text-[13px] text-ink-3 mb-6">
            {done === "created"
              ? `Vous êtes maintenant inscrit·e au programme fidélité de ${r.name}. Vous gagnerez des points à chaque visite.`
              : `Vos préférences ont été mises à jour pour ${r.name}.`}
          </p>
          <div className="flex flex-col items-center gap-3">
            <Link
              to={`/fidelite/${r.slug}/compte`}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Heart size={13} />
              Accéder à mon compte
            </Link>
            <Link
              to={`/chez/${r.slug}`}
              className="text-[12px] text-ink-3 hover:text-ink-1 inline-flex items-center gap-1"
            >
              <ArrowLeft size={12} />
              Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const canSubmit =
    name.trim().length >= 2 && (email.trim().length > 0 || phone.trim().length > 0);

  return (
    <main className="min-h-screen bg-bg-0 text-ink-1">
      <header className="max-w-[480px] mx-auto px-6 pt-8 pb-4">
        <Link
          to={`/chez/${r.slug}`}
          className="inline-flex items-center gap-2 text-[12px] text-ink-3 hover:text-ink-1 transition-colors mb-4"
        >
          <ArrowLeft size={13} />
          Retour
        </Link>
        <div className="flex items-center gap-3 mb-3">
          <span
            className="w-[44px] h-[44px] rounded-[12px] grid place-items-center text-cream"
            style={{
              background:
                "linear-gradient(135deg, var(--ember), var(--ember-deep))",
              boxShadow: "0 4px 16px rgba(232,115,58,0.25)",
            }}
          >
            <Heart size={20} />
          </span>
          <div>
            <div className="chip-uppercase mb-1">Programme fidélité</div>
            <h1 className="display font-medium text-[24px] leading-tight m-0">
              {r.name}
            </h1>
          </div>
        </div>
        <p className="text-[13px] text-ink-3 leading-snug">
          Inscrivez-vous en 30 secondes pour cumuler des points et recevoir nos offres exclusives.
        </p>
      </header>

      <form onSubmit={submit} className="max-w-[480px] mx-auto px-6 pb-10 flex flex-col gap-4">
        <Field label="Nom">
          <input
            type="text"
            required
            minLength={2}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Votre nom"
            className="w-full bg-bg-2 border border-line rounded-[10px] px-3 py-[10px] text-[14px] text-ink-1 outline-none focus:border-line-2"
          />
        </Field>

        <Field label="Email" hint="Recommandé pour recevoir les offres">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.com"
            className="w-full bg-bg-2 border border-line rounded-[10px] px-3 py-[10px] text-[14px] text-ink-1 outline-none focus:border-line-2"
          />
        </Field>

        <Field label="Téléphone" hint="Facultatif si vous donnez un email">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="06 12 34 56 78"
            className="w-full bg-bg-2 border border-line rounded-[10px] px-3 py-[10px] text-[14px] text-ink-1 outline-none focus:border-line-2 mono"
          />
        </Field>

        <label className="flex items-start gap-2 text-[12.5px] text-ink-2 leading-snug cursor-pointer">
          <input
            type="checkbox"
            checked={optedIn}
            onChange={(e) => setOptedIn(e.target.checked)}
            className="mt-[2px] accent-ember"
          />
          <span>
            J&apos;accepte de recevoir par email les offres et nouveautés de {r.name}. Vous
            pourrez vous désinscrire à tout moment.
          </span>
        </label>

        {submitError && (
          <div className="p-3 rounded-[10px] border border-danger/40 bg-danger/10 text-danger text-[12px]">
            {submitError}
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit || submitting}
          className="btn-primary w-full inline-flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Heart size={14} />
          {submitting ? "Inscription en cours…" : "Rejoindre le programme"}
        </button>

        <div className="text-center text-[12px] text-ink-3 mt-1">
          Déjà inscrit·e ?{" "}
          <Link
            to={`/fidelite/${r.slug}/compte`}
            className="text-ember-soft hover:underline"
          >
            Accéder à mon compte
          </Link>
        </div>

        <p className="text-[11px] text-ink-4 text-center mt-2">
          Vos informations restent strictement confidentielles et ne sont jamais revendues.
        </p>
      </form>
    </main>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-[6px]">
        <label className="chip-uppercase">{label}</label>
        {hint && <span className="text-[10.5px] text-ink-4">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
