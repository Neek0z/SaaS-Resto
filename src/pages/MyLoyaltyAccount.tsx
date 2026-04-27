import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  CheckCircle2,
  Heart,
  LogOut,
  Mail,
  Star,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  fetchMyLoyaltyAccount,
  linkOrCreateMyLoyaltyAccount,
  redeemMyLoyaltyReward,
  sendLoyaltyMagicLink,
  type MyLoyaltyAccountResponse,
} from "@/lib/api/loyalty-account";
import { processLoyaltyEmails } from "@/lib/api/loyalty-emails";
import { fetchPublicReservationInfo, type PublicResaInfo } from "@/lib/api/public-reservation";
import { extractErrorMessage } from "@/lib/errors";
import { cn, formatEuros } from "@/lib/utils";

const TIER_LABEL: Record<string, string> = {
  bronze: "Bronze",
  silver: "Argent",
  gold: "Or",
  platine: "Platine",
};

const TIER_COLOR: Record<string, string> = {
  bronze: "#8a6a41",
  silver: "#b8b3a8",
  gold: "#d29528",
  platine: "#9bb0d4",
};

type Phase =
  | { kind: "loading" }
  | { kind: "not_found" }
  | { kind: "error"; message: string }
  | { kind: "signed_out"; resto: PublicResaInfo["restaurant"] }
  | {
      kind: "signed_in";
      resto: PublicResaInfo["restaurant"];
      account: MyLoyaltyAccountResponse;
    };

export default function MyLoyaltyAccount() {
  const { slug } = useParams<{ slug: string }>();
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });

  const refreshAccount = useCallback(
    async (slugArg: string, resto: PublicResaInfo["restaurant"]) => {
      // Lie (ou crée) si nécessaire, puis récupère l'état
      let createdNew = false;
      try {
        await linkOrCreateMyLoyaltyAccount(slugArg);
        createdNew = true;
      } catch {
        // l'erreur est levée si pas authentifié, on tombera dans signed_out plus bas
      }
      const account = await fetchMyLoyaltyAccount(slugArg);
      setPhase({ kind: "signed_in", resto, account });
      // Best-effort : drain la queue (email bienvenue / palier / récompense)
      if (createdNew && account.customer) {
        void processLoyaltyEmails(account.restaurant.id).catch(() => {});
      }
    },
    []
  );

  useEffect(() => {
    let cancelled = false;
    if (!slug) {
      setPhase({ kind: "not_found" });
      return;
    }
    setPhase({ kind: "loading" });

    void (async () => {
      try {
        const info = await fetchPublicReservationInfo(slug);
        if (cancelled) return;
        if (!info) {
          setPhase({ kind: "not_found" });
          return;
        }
        const resto = info.restaurant;

        if (!supabase) {
          setPhase({ kind: "error", message: "Configuration Supabase manquante." });
          return;
        }
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        if (!data.session) {
          setPhase({ kind: "signed_out", resto });
          return;
        }

        await refreshAccount(slug, resto);
      } catch (e) {
        if (!cancelled) setPhase({ kind: "error", message: extractErrorMessage(e) });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug, refreshAccount]);

  // Réagit aux changements d'auth (déconnexion ou login OTP)
  useEffect(() => {
    if (!supabase || !slug) return;
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      // Reload state when login/logout happens
      void (async () => {
        const info = await fetchPublicReservationInfo(slug);
        if (!info) {
          setPhase({ kind: "not_found" });
          return;
        }
        if (!session) {
          setPhase({ kind: "signed_out", resto: info.restaurant });
        } else {
          await refreshAccount(slug, info.restaurant);
        }
      })();
    });
    return () => sub.subscription.unsubscribe();
  }, [slug, refreshAccount]);

  useEffect(() => {
    document.body.classList.add("public-menu-mode");
    return () => document.body.classList.remove("public-menu-mode");
  }, []);

  if (phase.kind === "loading") {
    return (
      <main className="min-h-screen bg-bg-0 grid place-items-center text-ink-3 text-[13px]">
        Chargement…
      </main>
    );
  }

  if (phase.kind === "not_found") {
    return (
      <main className="min-h-screen bg-bg-0 grid place-items-center px-6">
        <div className="text-center max-w-sm">
          <div className="display text-[28px] font-medium mb-2">Établissement introuvable</div>
          <div className="text-[13px] text-ink-3">
            L&apos;adresse <span className="mono text-ink-2">/fidelite/{slug}/compte</span>{" "}
            ne correspond à aucun restaurant publié.
          </div>
        </div>
      </main>
    );
  }

  if (phase.kind === "error") {
    return (
      <main className="min-h-screen bg-bg-0 grid place-items-center px-6">
        <div className="text-center max-w-sm">
          <div className="display text-[22px] font-medium mb-2 text-danger">
            Une erreur est survenue
          </div>
          <div className="text-[12px] text-ink-3 mono">{phase.message}</div>
        </div>
      </main>
    );
  }

  if (phase.kind === "signed_out") {
    return <SignedOutView slug={slug!} resto={phase.resto} />;
  }

  return (
    <SignedInView
      slug={slug!}
      resto={phase.resto}
      account={phase.account}
      onChange={() => {
        if (slug) void refreshAccount(slug, phase.resto);
      }}
    />
  );
}

// ---------------------------------------------------------------
// Vue déconnectée : formulaire OTP magic link
// ---------------------------------------------------------------
function SignedOutView({
  slug,
  resto,
}: {
  slug: string;
  resto: PublicResaInfo["restaurant"];
}) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || submitting) return;
    setSubmitting(true);
    try {
      await sendLoyaltyMagicLink(email.trim(), slug);
      setSent(true);
    } catch (e2) {
      setError(extractErrorMessage(e2));
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <main className="min-h-screen bg-bg-0 px-6 py-10">
        <div className="max-w-[420px] mx-auto text-center">
          <div className="w-[64px] h-[64px] rounded-full mx-auto mb-4 grid place-items-center bg-ok/15 text-ok border border-ok/30">
            <Mail size={28} />
          </div>
          <h1 className="display font-medium text-[24px] leading-tight mb-2">
            Vérifiez votre boîte mail
          </h1>
          <p className="text-[13px] text-ink-3 mb-6">
            Un lien de connexion a été envoyé à{" "}
            <span className="text-ink-1 mono">{email}</span>. Cliquez dessus pour accéder à
            votre compte fidélité chez {resto.name}.
          </p>
          <button onClick={() => setSent(false)} className="btn-ghost">
            Renvoyer un lien
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg-0 text-ink-1">
      <header className="max-w-[480px] mx-auto px-6 pt-8 pb-4">
        <Link
          to={`/fidelite/${resto.slug}`}
          className="inline-flex items-center gap-2 text-[12px] text-ink-3 hover:text-ink-1 transition-colors mb-4"
        >
          <ArrowLeft size={13} />
          Retour
        </Link>
        <div className="flex items-center gap-3 mb-3">
          <span
            className="w-[44px] h-[44px] rounded-[12px] grid place-items-center text-cream"
            style={{
              background: "linear-gradient(135deg, var(--ember), var(--ember-deep))",
              boxShadow: "0 4px 16px rgba(232,115,58,0.25)",
            }}
          >
            <Heart size={20} />
          </span>
          <div>
            <div className="chip-uppercase mb-1">Mon compte fidélité</div>
            <h1 className="display font-medium text-[24px] leading-tight m-0">
              {resto.name}
            </h1>
          </div>
        </div>
        <p className="text-[13px] text-ink-3 leading-snug">
          Saisissez votre email : nous vous envoyons un lien magique pour accéder à votre
          solde de points et vos récompenses.
        </p>
      </header>

      <form onSubmit={submit} className="max-w-[480px] mx-auto px-6 pb-10 flex flex-col gap-4">
        <div>
          <label className="chip-uppercase block mb-[6px]">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.com"
            className="w-full bg-bg-2 border border-line rounded-[10px] px-3 py-[10px] text-[14px] text-ink-1 outline-none focus:border-line-2"
          />
        </div>

        {error && (
          <div className="p-3 rounded-[10px] border border-danger/40 bg-danger/10 text-danger text-[12px]">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!email.trim() || submitting}
          className="btn-primary w-full inline-flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
        >
          <Mail size={14} />
          {submitting ? "Envoi…" : "Recevoir mon lien magique"}
        </button>

        <p className="text-[11px] text-ink-4 text-center">
          Pas encore inscrit ?{" "}
          <Link to={`/fidelite/${resto.slug}`} className="text-ember-soft hover:underline">
            Rejoindre le programme
          </Link>
        </p>
      </form>
    </main>
  );
}

// ---------------------------------------------------------------
// Vue connectée : solde, récompenses, historique
// ---------------------------------------------------------------
function SignedInView({
  slug,
  resto,
  account,
  onChange,
}: {
  slug: string;
  resto: PublicResaInfo["restaurant"];
  account: MyLoyaltyAccountResponse;
  onChange: () => void | Promise<void>;
}) {
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [redeemed, setRedeemed] = useState<{ name: string } | null>(null);

  const customer = account.customer;

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  const handleRedeem = async (rewardId: string, name: string) => {
    if (redeeming) return;
    setRedeemError(null);
    setRedeeming(rewardId);
    try {
      await redeemMyLoyaltyReward(slug, rewardId);
      setRedeemed({ name });
      await onChange();
      // Best-effort : déclenche l'envoi de l'email de confirmation.
      // Échec silencieux — le staff peut toujours drainer manuellement.
      void processLoyaltyEmails(account.restaurant.id).catch(() => {});
    } catch (e) {
      setRedeemError(extractErrorMessage(e));
    } finally {
      setRedeeming(null);
    }
  };

  if (!customer) {
    return (
      <main className="min-h-screen bg-bg-0 grid place-items-center px-6">
        <div className="text-center max-w-sm">
          <div className="display text-[22px] font-medium mb-2">Compte en cours de création…</div>
          <div className="text-[12px] text-ink-3">
            Si rien ne se passe, rechargez la page.
          </div>
        </div>
      </main>
    );
  }

  const tierColor = TIER_COLOR[customer.tier] ?? "var(--ember-soft)";
  const tierLabel = TIER_LABEL[customer.tier] ?? customer.tier;
  const config = account.config;

  // Progression vers le tier suivant
  const nextThreshold =
    customer.tier === "bronze"
      ? config?.threshold_silver ?? 500
      : customer.tier === "silver"
      ? config?.threshold_gold ?? 1500
      : null;
  const nextTierLabel =
    customer.tier === "bronze"
      ? "Argent"
      : customer.tier === "silver"
      ? "Or"
      : null;
  const progress = nextThreshold
    ? Math.min(100, Math.round((customer.points / nextThreshold) * 100))
    : 100;

  return (
    <main className="min-h-screen bg-bg-0 text-ink-1">
      <header className="max-w-[480px] mx-auto px-6 pt-8 pb-3 flex items-center justify-between">
        <Link
          to={`/chez/${resto.slug}`}
          className="inline-flex items-center gap-2 text-[12px] text-ink-3 hover:text-ink-1 transition-colors"
        >
          <ArrowLeft size={13} />
          {resto.name}
        </Link>
        <button
          onClick={handleSignOut}
          className="inline-flex items-center gap-1 text-[11px] text-ink-3 hover:text-danger transition-colors"
          title="Se déconnecter"
        >
          <LogOut size={12} />
          Se déconnecter
        </button>
      </header>

      {/* Carte de solde */}
      <section className="max-w-[480px] mx-auto px-6">
        <div
          className="rounded-[18px] p-5 border border-line-2 mb-5"
          style={{
            background:
              "linear-gradient(135deg, rgba(232,115,58,0.18), rgba(92,42,14,0.25))",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="chip-uppercase">Mon solde</div>
            <span
              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-[3px] rounded-full border"
              style={{
                color: tierColor,
                borderColor: `${tierColor}55`,
                background: `${tierColor}15`,
              }}
            >
              <Award size={11} />
              {tierLabel}
            </span>
          </div>
          <div className="display text-[42px] font-medium leading-none mb-1 text-ember-soft">
            {customer.points.toLocaleString("fr-FR")}
          </div>
          <div className="text-[11.5px] text-ink-3 mono uppercase tracking-[0.08em]">
            points cumulés
          </div>

          {nextThreshold && nextTierLabel && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-[11px] text-ink-3 mb-[4px]">
                <span>
                  Encore{" "}
                  <span className="text-ink-1 mono font-semibold">
                    {Math.max(0, nextThreshold - customer.points)}
                  </span>{" "}
                  pts → {nextTierLabel}
                </span>
                <span className="mono">{progress}%</span>
              </div>
              <div className="h-[6px] rounded-full bg-bg-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${progress}%`,
                    background:
                      "linear-gradient(90deg, var(--ember), var(--ember-deep))",
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-[480px] mx-auto px-6 grid grid-cols-3 gap-2 mb-6">
        <MiniStat
          label="Visites"
          value={customer.visit_count.toString()}
        />
        <MiniStat
          label="Total dépensé"
          value={`${formatEuros(Number(customer.total_spent) || 0)} €`}
        />
        <MiniStat
          label="Membre depuis"
          value={new Date(customer.created_at).toLocaleDateString("fr-FR", {
            month: "short",
            year: "2-digit",
          })}
        />
      </section>

      {/* Récompenses */}
      <section className="max-w-[480px] mx-auto px-6 mb-6">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="display text-[18px] font-medium m-0">Mes récompenses</h2>
          <span className="text-[11px] text-ink-4">{account.rewards.length} disponibles</span>
        </div>

        {redeemed && (
          <div className="mb-3 p-3 rounded-[10px] border border-ok/40 bg-ok/10 flex items-start gap-2">
            <CheckCircle2 size={16} className="text-ok shrink-0 mt-[1px]" />
            <div className="text-[12.5px] text-ink-1">
              <span className="font-semibold">{redeemed.name}</span> réservée. Présentez ce
              compte à votre prochaine visite pour en profiter.
            </div>
          </div>
        )}

        {redeemError && (
          <div className="mb-3 p-3 rounded-[10px] border border-danger/40 bg-danger/10 text-danger text-[12px]">
            {redeemError}
          </div>
        )}

        {account.rewards.length === 0 ? (
          <div className="p-4 text-center text-[12.5px] text-ink-3 border border-line rounded-[10px]">
            Aucune récompense disponible pour le moment.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {account.rewards.map((r) => {
              const affordable = customer.points >= r.points_cost;
              return (
                <div
                  key={r.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-[12px] border bg-bg-1",
                    affordable
                      ? "border-line-2"
                      : "border-line opacity-70"
                  )}
                >
                  <span
                    className="w-[42px] h-[42px] rounded-[10px] grid place-items-center shrink-0"
                    style={{
                      background: affordable
                        ? "linear-gradient(135deg, var(--ember), var(--ember-deep))"
                        : "var(--bg-3)",
                      color: affordable ? "var(--cream)" : "var(--ink-3)",
                    }}
                  >
                    <Star size={18} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold truncate">{r.name}</div>
                    {r.description && (
                      <div className="text-[11.5px] text-ink-3 truncate">{r.description}</div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <div className="text-[12px] mono text-ember-soft font-semibold">
                      {r.points_cost} pts
                    </div>
                    <button
                      disabled={!affordable || redeeming === r.id}
                      onClick={() => handleRedeem(r.id, r.name)}
                      className={cn(
                        "text-[11px] px-2 py-[4px] rounded-[8px] border transition-colors",
                        affordable
                          ? "btn-primary"
                          : "border-line text-ink-4 cursor-not-allowed"
                      )}
                    >
                      {redeeming === r.id
                        ? "…"
                        : affordable
                        ? "Échanger"
                        : `–${r.points_cost - customer.points}`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Historique */}
      <section className="max-w-[480px] mx-auto px-6 pb-12">
        <h2 className="display text-[18px] font-medium m-0 mb-3">Historique</h2>
        {account.transactions.length === 0 ? (
          <div className="p-4 text-center text-[12.5px] text-ink-3 border border-line rounded-[10px]">
            Pas encore de transactions. Vos points apparaîtront ici à chaque visite.
          </div>
        ) : (
          <div className="flex flex-col">
            {account.transactions.map((t) => {
              const isEarn = t.type === "earn";
              return (
                <div
                  key={t.id}
                  className="flex items-center justify-between gap-3 py-[10px] border-b border-line last:border-b-0"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={cn(
                        "w-[26px] h-[26px] rounded-full grid place-items-center shrink-0",
                        isEarn ? "bg-ok/15 text-ok" : "bg-ember/15 text-ember-soft"
                      )}
                    >
                      <ArrowRight
                        size={13}
                        className={isEarn ? "rotate-[-90deg]" : "rotate-90"}
                      />
                    </span>
                    <div className="min-w-0">
                      <div className="text-[13px] truncate">
                        {t.description ?? (isEarn ? "Crédit fidélité" : "Échange récompense")}
                      </div>
                      <div className="text-[10.5px] text-ink-4 mono">
                        {new Date(t.created_at).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "mono text-[13px] font-semibold shrink-0",
                      isEarn ? "text-ok" : "text-ember-soft"
                    )}
                  >
                    {isEarn ? "+" : ""}
                    {t.points} pts
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-bg-1 border border-line rounded-[10px] text-center">
      <div className="text-[14px] font-semibold text-ink-1 leading-tight">{value}</div>
      <div className="text-[10px] text-ink-4 mono uppercase tracking-[0.06em] mt-[2px]">
        {label}
      </div>
    </div>
  );
}
