import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  ClipboardList,
  Heart,
  LogIn,
  Mail,
  MessageSquare,
  QrCode,
  Sparkles,
  Star,
  UtensilsCrossed,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  FEATURE_LABELS,
  PLAN_FEATURES,
  PLAN_LABELS,
  PLAN_ORDER,
  PLAN_PRICES,
  type Feature,
  type Plan,
} from "@/config/plans";
import { cn } from "@/lib/utils";

// =============================================================
// Hook : reveal au scroll (IntersectionObserver natif)
// =============================================================
function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -10% 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        "transition-all duration-700 ease-out",
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-6",
        className
      )}
    >
      {children}
    </div>
  );
}

// =============================================================
// Landing
// =============================================================
export default function Landing() {
  const { user, loading } = useAuth();
  const preview =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("preview") === "1";
  if (loading) return null;
  if (user && !preview) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-bg-0 text-ink-1 relative overflow-x-hidden">
      <Header />
      <main>
        <Hero />
        <ProblemSolution />
        <Features />
        <Pricing />
        <Testimonials />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}

// =============================================================
// Header fixe
// =============================================================
function Header() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all",
        scrolled
          ? "bg-bg-0/80 backdrop-blur-md border-b border-line"
          : "bg-transparent border-b border-transparent"
      )}
    >
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 h-[60px] flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-[10px] flex-shrink-0">
          <div
            className="w-[34px] h-[34px] rounded-[10px] grid place-items-center text-cream font-bold text-[17px] display"
            style={{
              background:
                "radial-gradient(circle at 30% 30%, var(--ember) 0%, var(--ember-deep) 60%, #5c2a0e 100%)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.2), 0 0 0 1px var(--line-2), 0 4px 12px rgba(232,115,58,0.15)",
            }}
          >
            S
          </div>
          <div>
            <div className="display font-semibold text-[16px] leading-tight">
              Sévère<span className="text-ember">.</span>
            </div>
            <div className="text-[10px] text-ink-3 mt-[1px] hidden sm:block">
              Salle & Cuisine
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="hidden sm:inline-flex items-center gap-2 px-3 py-[7px] text-[13px] text-ink-2 hover:text-ink-1 transition-colors"
          >
            <LogIn size={13} />
            Se connecter
          </Link>
          <Link
            to="/register"
            className="btn-primary inline-flex items-center gap-2 !text-[12.5px]"
          >
            Essai gratuit 14 jours
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </header>
  );
}

// =============================================================
// Hero
// =============================================================
function Hero() {
  return (
    <section
      className="relative pt-[120px] pb-20 sm:pt-[160px] sm:pb-28"
      style={{
        background:
          "radial-gradient(circle at 80% 0%, rgba(232,115,58,0.18), transparent 55%), radial-gradient(circle at 0% 30%, rgba(154,170,94,0.05), transparent 50%), linear-gradient(180deg, #1e1610 0%, #181310 100%)",
      }}
    >
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6">
        <Reveal>
          <div className="inline-flex items-center gap-2 px-3 py-[5px] rounded-full bg-ember/10 border border-ember/30 text-[11px] text-ember-soft font-medium mb-6">
            <Sparkles size={11} />
            Nouveau · Module CRM & emailing intégré
          </div>
        </Reveal>

        <Reveal delay={80}>
          <h1 className="display text-[40px] sm:text-[60px] leading-[1.05] font-medium max-w-3xl tracking-tight">
            Le système d'exploitation
            <br />
            de votre <span className="text-ember">restaurant</span>.
          </h1>
        </Reveal>

        <Reveal delay={160}>
          <p className="mt-6 text-[16px] sm:text-[18px] text-ink-2 max-w-2xl leading-relaxed">
            Pilotage, réservations, fidélité, campagnes email : un seul outil,
            pensé pour les restaurateurs qui veulent passer plus de temps en
            cuisine et moins devant un tableur.
          </p>
        </Reveal>

        <Reveal delay={240}>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/register"
              className="btn-primary inline-flex items-center gap-2 !px-5 !py-3 !text-[14px]"
            >
              Démarrer l'essai gratuit
              <ArrowRight size={14} />
            </Link>
            <Link
              to="/login"
              className="btn-ghost inline-flex items-center gap-2 !px-5 !py-3 !text-[13px]"
            >
              J'ai déjà un compte
            </Link>
          </div>
        </Reveal>

        <Reveal delay={320}>
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-ink-3">
            <Check size={12} className="text-olive" />
            <span>14 jours gratuits, sans CB</span>
            <Check size={12} className="text-olive" />
            <span>Installation en 5 minutes</span>
            <Check size={12} className="text-olive" />
            <span>Sans engagement</span>
          </div>
        </Reveal>

        <Reveal delay={420}>
          <div className="mt-14 sm:mt-20">
            <DashboardPreview />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function DashboardPreview() {
  return (
    <div
      className="relative mx-auto max-w-[920px] rounded-[18px] border border-line-2 overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, var(--bg-1) 0%, var(--bg-0) 100%)",
        boxShadow:
          "0 30px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(232,115,58,0.06)",
      }}
    >
      {/* Window chrome */}
      <div className="flex items-center gap-2 px-4 h-9 border-b border-line bg-bg-1">
        <span className="w-[10px] h-[10px] rounded-full bg-[#c9523e]" />
        <span className="w-[10px] h-[10px] rounded-full bg-[#e8b04a]" />
        <span className="w-[10px] h-[10px] rounded-full bg-[#9aaa5e]" />
        <div className="ml-3 mono text-[10px] text-ink-4">
          severe.app/dashboard
        </div>
      </div>

      <div className="p-5 sm:p-7">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: "CA du jour", value: "2 684 €", delta: "+12%" },
            { label: "Couverts", value: "67", delta: "+8" },
            { label: "Réservations", value: "23", delta: "+4" },
            { label: "Note moyenne", value: "4,7", delta: "★" },
          ].map((k) => (
            <div
              key={k.label}
              className="p-3 rounded-[10px] border border-line bg-bg-1"
            >
              <div className="text-[10px] uppercase tracking-wider text-ink-4">
                {k.label}
              </div>
              <div className="display text-[22px] font-medium leading-tight mt-1">
                {k.value}
              </div>
              <div className="text-[11px] text-olive mt-[2px] mono">
                {k.delta}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 p-4 rounded-[10px] border border-line bg-bg-1 h-[160px] relative overflow-hidden">
            <div className="text-[10px] uppercase tracking-wider text-ink-4 mb-2">
              Chiffre d'affaires · 7 jours
            </div>
            <SparkSvg />
          </div>
          <div className="p-4 rounded-[10px] border border-line bg-bg-1 flex flex-col gap-2">
            <div className="text-[10px] uppercase tracking-wider text-ink-4">
              Événements actifs
            </div>
            <div className="text-[12.5px] text-ink-1 font-semibold">
              Happy hour · 17–19h
            </div>
            <div className="text-[11px] text-ink-3">−30% sur les apéritifs</div>
            <div className="mt-auto inline-flex items-center gap-1 text-[11px] text-olive">
              <span className="w-[6px] h-[6px] rounded-full bg-olive" />
              En cours
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SparkSvg() {
  // Faux graphique de CA
  const points = [12, 28, 22, 38, 32, 50, 64];
  const max = Math.max(...points);
  const w = 600;
  const h = 100;
  const step = w / (points.length - 1);
  const path = points
    .map((p, i) => {
      const x = i * step;
      const y = h - (p / max) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const area = `${path} L${w},${h} L0,${h} Z`;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full h-[100px]"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(232,115,58,0.35)" />
          <stop offset="100%" stopColor="rgba(232,115,58,0)" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#sparkFill)" />
      <path
        d={path}
        fill="none"
        stroke="var(--ember)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// =============================================================
// Problème / Solution
// =============================================================
const PROBLEMS: { problem: string; solution: string }[] = [
  {
    problem:
      "Vos données sont éparpillées entre plusieurs outils, tableurs et carnets.",
    solution:
      "Tout est centralisé : commandes, réservations, clients, équipe — au même endroit.",
  },
  {
    problem:
      "Vous perdez du temps à reprendre les commandes et à organiser le service.",
    solution:
      "Le QR code à table simplifie la prise de commande et libère votre salle.",
  },
  {
    problem:
      "Vos clients fidèles n'ont aucune raison de revenir plutôt que d'aller chez le voisin.",
    solution:
      "Programme de fidélité, événements, campagnes email : vous gardez le lien après le service.",
  },
];

function ProblemSolution() {
  return (
    <section className="py-20 sm:py-28 border-t border-line">
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6">
        <Reveal>
          <SectionLabel>Le constat</SectionLabel>
          <h2 className="display text-[32px] sm:text-[44px] leading-[1.1] font-medium max-w-3xl">
            Gérer un restaurant ne devrait pas demander dix outils différents.
          </h2>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          {PROBLEMS.map((p, i) => (
            <Reveal key={i} delay={i * 100}>
              <div className="p-5 rounded-[14px] border border-line bg-bg-1 h-full flex flex-col gap-3">
                <div className="text-[11px] uppercase tracking-wider text-terracotta font-semibold">
                  Le problème
                </div>
                <p className="text-[14px] text-ink-2 leading-relaxed">
                  {p.problem}
                </p>
                <div className="border-t border-line pt-3 mt-1">
                  <div className="text-[11px] uppercase tracking-wider text-olive font-semibold mb-2">
                    Avec Sévère
                  </div>
                  <p className="text-[14px] text-ink-1 leading-relaxed">
                    {p.solution}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// =============================================================
// Fonctionnalités (les modules)
// =============================================================
const FEATURE_META: Record<
  Feature,
  { icon: typeof BarChart3; tagline: string }
> = {
  dashboard: {
    icon: BarChart3,
    tagline: "Pilotez votre activité d'un seul coup d'œil.",
  },
  menu: {
    icon: UtensilsCrossed,
    tagline: "Carte, stocks, allergènes : toujours à jour.",
  },
  reservations: {
    icon: CalendarDays,
    tagline: "Plan de salle, créneaux, no-show maîtrisés.",
  },
  qrcode: {
    icon: QrCode,
    tagline: "Commande à table, sans application à télécharger.",
  },
  fidelite: {
    icon: Heart,
    tagline: "Programme de points, paliers et récompenses.",
  },
  suivi_client: {
    icon: ClipboardList,
    tagline: "Base clients enrichie, segmentation, RGPD.",
  },
  emailing: {
    icon: Mail,
    tagline: "Campagnes ciblées, modèles prêts à l'emploi.",
  },
  evenements: {
    icon: Sparkles,
    tagline: "Happy hours, soirées, promotions récurrentes.",
  },
  multi_etablissements: {
    icon: Building2,
    tagline: "Plusieurs établissements, une seule console.",
  },
  sms: {
    icon: MessageSquare,
    tagline: "Confirmations et rappels par SMS.",
  },
};

const FEATURE_ORDER: Feature[] = [
  "dashboard",
  "menu",
  "reservations",
  "qrcode",
  "fidelite",
  "suivi_client",
  "emailing",
  "evenements",
  "multi_etablissements",
  "sms",
];

function Features() {
  return (
    <section className="py-20 sm:py-28 border-t border-line">
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6">
        <Reveal>
          <SectionLabel>Les modules</SectionLabel>
          <h2 className="display text-[32px] sm:text-[44px] leading-[1.1] font-medium max-w-3xl">
            Tout ce qu'il faut, rien de superflu.
          </h2>
          <p className="mt-4 text-[14px] sm:text-[15px] text-ink-3 max-w-2xl leading-relaxed">
            Activez les modules au fur et à mesure de votre croissance. Chaque
            outil est pensé pour être pris en main par votre équipe en moins
            d'une journée.
          </p>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {FEATURE_ORDER.map((f, i) => {
            const meta = FEATURE_META[f];
            const Icon = meta.icon;
            return (
              <Reveal key={f} delay={(i % 3) * 80}>
                <div className="p-5 rounded-[14px] border border-line bg-bg-1 hover:border-line-2 hover:bg-bg-2 transition-colors h-full">
                  <div
                    className="w-10 h-10 rounded-[10px] grid place-items-center mb-4"
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(232,115,58,0.15), rgba(232,115,58,0.04))",
                      border: "1px solid rgba(232,115,58,0.25)",
                      color: "var(--ember-soft)",
                    }}
                  >
                    <Icon size={17} />
                  </div>
                  <div className="display text-[16px] font-semibold mb-1">
                    {FEATURE_LABELS[f]}
                  </div>
                  <p className="text-[13px] text-ink-3 leading-relaxed">
                    {meta.tagline}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// =============================================================
// Tarifs
// =============================================================
const PLAN_PITCH: Record<Plan, string> = {
  essentiel: "Pour démarrer en toute sérénité.",
  pro: "Pour fidéliser et faire croître votre clientèle.",
  multi: "Pour les groupes et les enseignes en plusieurs lieux.",
};

function Pricing() {
  const [yearly, setYearly] = useState(false);

  return (
    <section
      id="tarifs"
      className="py-20 sm:py-28 border-t border-line"
    >
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6">
        <Reveal>
          <SectionLabel>Tarifs</SectionLabel>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <h2 className="display text-[32px] sm:text-[44px] leading-[1.1] font-medium max-w-2xl">
              Un tarif clair, sans surprise.
            </h2>

            <div className="inline-flex items-center bg-bg-1 border border-line rounded-full p-1">
              <button
                type="button"
                onClick={() => setYearly(false)}
                className={cn(
                  "px-4 py-[6px] rounded-full text-[12.5px] font-medium transition-colors",
                  !yearly
                    ? "bg-ember text-[#1b0d04]"
                    : "text-ink-3 hover:text-ink-1"
                )}
              >
                Mensuel
              </button>
              <button
                type="button"
                onClick={() => setYearly(true)}
                className={cn(
                  "px-4 py-[6px] rounded-full text-[12.5px] font-medium transition-colors inline-flex items-center gap-2",
                  yearly
                    ? "bg-ember text-[#1b0d04]"
                    : "text-ink-3 hover:text-ink-1"
                )}
              >
                Annuel
                <span
                  className={cn(
                    "text-[10px] px-[6px] py-[1px] rounded-full",
                    yearly
                      ? "bg-[#1b0d04]/15 text-[#1b0d04]"
                      : "bg-olive/20 text-olive"
                  )}
                >
                  −2 mois
                </span>
              </button>
            </div>
          </div>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLAN_ORDER.map((plan, i) => (
            <Reveal key={plan} delay={i * 100}>
              <PlanCard plan={plan} yearly={yearly} highlight={plan === "pro"} />
            </Reveal>
          ))}
        </div>

        <Reveal>
          <p className="mt-8 text-center text-[12px] text-ink-4">
            Tous les plans incluent l'essai gratuit 14 jours, sans carte
            bancaire. Annulation à tout moment.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function PlanCard({
  plan,
  yearly,
  highlight,
}: {
  plan: Plan;
  yearly: boolean;
  highlight: boolean;
}) {
  const features = PLAN_FEATURES[plan];
  const price = yearly
    ? Math.round(PLAN_PRICES[plan].yearly / 12)
    : PLAN_PRICES[plan].monthly;
  const fullYearly = PLAN_PRICES[plan].yearly;

  return (
    <div
      className={cn(
        "relative p-6 rounded-[16px] border h-full flex flex-col gap-5 transition-all",
        highlight
          ? "border-ember/40 bg-gradient-to-b from-ember/5 to-transparent shadow-[0_0_0_1px_rgba(232,115,58,0.15),0_20px_60px_rgba(232,115,58,0.08)]"
          : "border-line bg-bg-1"
      )}
    >
      {highlight && (
        <div className="absolute top-0 right-5 -translate-y-1/2 px-3 py-[3px] rounded-full text-[10.5px] font-bold uppercase tracking-wider bg-ember text-[#1b0d04]">
          Recommandé
        </div>
      )}

      <div>
        <div className="display text-[20px] font-medium">
          {PLAN_LABELS[plan]}
        </div>
        <p className="text-[12.5px] text-ink-3 mt-1 leading-relaxed">
          {PLAN_PITCH[plan]}
        </p>
      </div>

      <div>
        <div className="flex items-baseline gap-2">
          <span className="display text-[44px] font-semibold leading-none mono">
            {price}
          </span>
          <span className="text-[14px] text-ink-3">€ / mois</span>
        </div>
        {yearly && (
          <div className="text-[11px] text-ink-4 mt-1 mono">
            {fullYearly} € facturés à l'année
          </div>
        )}
      </div>

      <Link
        to="/register"
        className={cn(
          "inline-flex items-center justify-center gap-2 px-4 py-[10px] rounded-[10px] text-[13px] font-semibold transition-all",
          highlight
            ? "bg-gradient-to-b from-ember to-ember-deep text-[#1b0d04] shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_4px_14px_rgba(232,115,58,0.2)] hover:-translate-y-[1px]"
            : "bg-bg-2 border border-line-2 text-ink-1 hover:bg-bg-3"
        )}
      >
        Démarrer l'essai gratuit
        <ArrowRight size={13} />
      </Link>

      <ul className="flex flex-col gap-2 pt-2 border-t border-line">
        {features.map((f) => (
          <li
            key={f}
            className="flex items-start gap-2 text-[12.5px] text-ink-2"
          >
            <Check
              size={13}
              className="text-olive flex-shrink-0 mt-[2px]"
            />
            <span>{FEATURE_LABELS[f]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// =============================================================
// Témoignages
// =============================================================
const TESTIMONIALS: {
  name: string;
  role: string;
  city: string;
  quote: string;
  initials: string;
}[] = [
  {
    name: "Camille Roux",
    role: "Bistrot du Marché",
    city: "Lyon",
    initials: "CR",
    quote:
      "On a abandonné notre vieux carnet de réservations en deux jours. Toute l'équipe s'y est mise sans formation. Le programme fidélité nous a ramené nos habitués du quartier.",
  },
  {
    name: "Julien Marchand",
    role: "Pizzeria Stella",
    city: "Bordeaux",
    initials: "JM",
    quote:
      "Le QR code à table a divisé par deux le temps d'attente le midi. Les clients commandent sans nous solliciter, on se concentre sur l'accueil. Le CA a grimpé de 18 % sur le service.",
  },
  {
    name: "Aïcha Diop",
    role: "Le Comptoir des Saveurs",
    city: "Nantes",
    initials: "AD",
    quote:
      "Avant, j'envoyais mes promotions à la main. Aujourd'hui je segmente mes clients fidèles, j'envoie une campagne et je vois directement combien ont ouvert. Imbattable.",
  },
];

function Testimonials() {
  return (
    <section className="py-20 sm:py-28 border-t border-line">
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6">
        <Reveal>
          <SectionLabel>Témoignages</SectionLabel>
          <h2 className="display text-[32px] sm:text-[44px] leading-[1.1] font-medium max-w-2xl">
            Des restaurateurs qui ont repris la main.
          </h2>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name} delay={i * 100}>
              <figure className="p-6 rounded-[16px] border border-line bg-bg-1 h-full flex flex-col gap-4">
                <div className="flex items-center gap-1 text-amber">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star key={idx} size={13} fill="currentColor" />
                  ))}
                </div>
                <blockquote className="text-[14px] text-ink-1 leading-relaxed font-[Fraunces] italic">
                  « {t.quote} »
                </blockquote>
                <figcaption className="flex items-center gap-3 mt-auto pt-4 border-t border-line">
                  <div className="avatar-circle w-9 h-9 text-[12px]">
                    {t.initials}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold truncate">
                      {t.name}
                    </div>
                    <div className="text-[11.5px] text-ink-3 truncate">
                      {t.role} · {t.city}
                    </div>
                  </div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// =============================================================
// FAQ
// =============================================================
const FAQ: { q: string; a: string }[] = [
  {
    q: "Combien de temps pour démarrer ?",
    a: "Comptez 5 minutes pour créer votre compte et 30 minutes pour configurer votre carte et vos premières tables. La plupart des restaurateurs sont opérationnels le jour même.",
  },
  {
    q: "Puis-je annuler à tout moment ?",
    a: "Oui. Aucun engagement de durée, vous pouvez résilier votre abonnement depuis votre espace en un clic. Vos données restent exportables au format CSV.",
  },
  {
    q: "Que se passe-t-il après les 14 jours d'essai ?",
    a: "Vous choisissez le plan qui vous convient et entrez vos informations de paiement. Sans action de votre part, votre compte passe simplement en lecture seule, vos données sont conservées 90 jours.",
  },
  {
    q: "Mes données sont-elles à l'abri ?",
    a: "Vos données sont hébergées en Europe (Francfort), chiffrées en transit et au repos. Nous sommes conformes RGPD et vous restez propriétaire de votre base clients à tout moment.",
  },
  {
    q: "Puis-je migrer depuis un autre logiciel ?",
    a: "Oui. Notre équipe vous accompagne gratuitement pour importer vos clients, votre carte et votre historique de réservations depuis un export CSV ou Excel.",
  },
  {
    q: "Y a-t-il un support en français ?",
    a: "Oui, le support est assuré par notre équipe basée à Paris, du lundi au samedi de 9h à 19h. Réponse en moins de 4 heures sur le plan Pro et Multi.",
  },
];

function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="py-20 sm:py-28 border-t border-line">
      <div className="max-w-[820px] mx-auto px-4 sm:px-6">
        <Reveal>
          <SectionLabel>FAQ</SectionLabel>
          <h2 className="display text-[32px] sm:text-[44px] leading-[1.1] font-medium">
            Questions fréquentes.
          </h2>
        </Reveal>

        <div className="mt-10 flex flex-col gap-2">
          {FAQ.map((item, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={i} delay={i * 50}>
                <div className="border border-line rounded-[12px] bg-bg-1 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-bg-2 transition-colors"
                    aria-expanded={isOpen}
                  >
                    <span className="text-[14px] font-semibold text-ink-1">
                      {item.q}
                    </span>
                    <ChevronDown
                      size={16}
                      className={cn(
                        "text-ink-3 flex-shrink-0 transition-transform",
                        isOpen && "rotate-180"
                      )}
                    />
                  </button>
                  <div
                    className={cn(
                      "grid transition-all duration-300 ease-out",
                      isOpen
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0"
                    )}
                  >
                    <div className="overflow-hidden">
                      <p className="px-5 pb-4 text-[13.5px] text-ink-3 leading-relaxed">
                        {item.a}
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// =============================================================
// CTA final
// =============================================================
function FinalCta() {
  return (
    <section className="py-20 sm:py-28 border-t border-line">
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6">
        <Reveal>
          <div
            className="relative rounded-[20px] overflow-hidden border border-ember/30 px-6 sm:px-12 py-14 sm:py-20 text-center"
            style={{
              background:
                "radial-gradient(circle at 50% 0%, rgba(232,115,58,0.25), transparent 70%), linear-gradient(180deg, #1f1611 0%, #18130f 100%)",
            }}
          >
            <h2 className="display text-[32px] sm:text-[48px] leading-[1.1] font-medium max-w-2xl mx-auto">
              Reprenez la main sur votre service.
            </h2>
            <p className="mt-5 text-[15px] text-ink-2 max-w-xl mx-auto leading-relaxed">
              14 jours pour tester l'ensemble des modules, sans carte bancaire.
              Sans engagement.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/register"
                className="btn-primary inline-flex items-center gap-2 !px-6 !py-3 !text-[14px]"
              >
                Démarrer l'essai gratuit
                <ArrowRight size={14} />
              </Link>
              <Link
                to="/login"
                className="btn-ghost inline-flex items-center gap-2 !px-5 !py-3 !text-[13px]"
              >
                Se connecter
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// =============================================================
// Footer
// =============================================================
function Footer() {
  return (
    <footer className="border-t border-line py-10">
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-[8px] grid place-items-center text-cream font-bold text-[13px] display"
            style={{
              background:
                "radial-gradient(circle at 30% 30%, var(--ember) 0%, var(--ember-deep) 60%, #5c2a0e 100%)",
            }}
          >
            S
          </div>
          <span className="display font-semibold text-[14px]">
            Sévère<span className="text-ember">.</span>
          </span>
          <span className="text-[11px] text-ink-4 ml-2">
            © {new Date().getFullYear()} · Made in France
          </span>
        </div>

        <nav className="flex items-center gap-5 text-[12px] text-ink-3">
          <Link to="/login" className="hover:text-ink-1 transition-colors">
            Connexion
          </Link>
          <Link to="/register" className="hover:text-ink-1 transition-colors">
            Inscription
          </Link>
          <a href="#tarifs" className="hover:text-ink-1 transition-colors">
            Tarifs
          </a>
          <a
            href="mailto:contact@severe.app"
            className="hover:text-ink-1 transition-colors"
          >
            Contact
          </a>
        </nav>
      </div>
    </footer>
  );
}

// =============================================================
// Helpers
// =============================================================
function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 mb-4 text-[11px] uppercase tracking-[0.18em] text-ember-soft font-semibold">
      <span className="w-5 h-[1px] bg-ember-soft/60" />
      {children}
    </div>
  );
}
