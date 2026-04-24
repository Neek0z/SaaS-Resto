import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Building2,
  Globe,
  CreditCard,
  Users as UsersIcon,
  Database,
  Bell,
  Save,
  Palette,
  Sun,
  Moon,
  Sparkles,
  Check,
  MessageSquare,
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/supabase";
import { RESTO } from "@/lib/mock-data";
import { useTheme, type Theme } from "@/lib/theme";
import { PlanGate } from "@/components/PlanGate";
import { usePlan } from "@/hooks/usePlan";
import {
  FEATURE_LABELS,
  PLAN_FEATURES,
  PLAN_LABELS,
  PLAN_ORDER,
  PLAN_PRICES,
  type Feature,
  type Plan,
} from "@/config/plans";

type Tab =
  | "resto"
  | "apparence"
  | "horaires"
  | "paiement"
  | "abonnement"
  | "utilisateurs"
  | "integrations"
  | "notifications"
  | "sms";

const TABS: { id: Tab; label: string; icon: typeof Building2 }[] = [
  { id: "resto", label: "Restaurant", icon: Building2 },
  { id: "apparence", label: "Apparence", icon: Palette },
  { id: "horaires", label: "Horaires", icon: Globe },
  { id: "paiement", label: "Paiement", icon: CreditCard },
  { id: "abonnement", label: "Abonnement", icon: Sparkles },
  { id: "utilisateurs", label: "Utilisateurs", icon: UsersIcon },
  { id: "integrations", label: "Intégrations", icon: Database },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "sms", label: "SMS", icon: MessageSquare },
];

const TAB_IDS = TABS.map((t) => t.id);

function isTab(value: string | null): value is Tab {
  return value !== null && (TAB_IDS as string[]).includes(value);
}

export default function Settings() {
  const [params, setParams] = useSearchParams();
  const initial = isTab(params.get("tab")) ? (params.get("tab") as Tab) : "resto";
  const [tab, setTab] = useState<Tab>(initial);

  useEffect(() => {
    const p = params.get("tab");
    if (isTab(p) && p !== tab) setTab(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const selectTab = (t: Tab) => {
    setTab(t);
    const next = new URLSearchParams(params);
    next.set("tab", t);
    setParams(next, { replace: true });
  };

  return (
    <>
      <div className="flex items-end justify-between mb-5 pt-2">
        <div>
          <div className="chip-uppercase mb-1">Configuration · Maison Sévère</div>
          <h2 className="display font-medium text-[26px] leading-tight m-0">
            Paramètres <em className="not-italic italic text-ember-soft font-normal">de l'établissement</em>
          </h2>
        </div>
        <button className="btn-primary inline-flex items-center gap-2">
          <Save size={13} />
          Enregistrer
        </button>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-3">
          <Card className="p-2">
            <div className="flex flex-col gap-1">
              {TABS.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => selectTab(t.id)}
                    className={cn(
                      "flex items-center gap-[10px] px-[10px] py-[9px] rounded-[8px] text-[13px] text-left transition-colors",
                      tab === t.id
                        ? "bg-bg-3 text-ink-1 font-semibold"
                        : "text-ink-3 hover:bg-bg-2 hover:text-ink-1"
                    )}
                  >
                    <Icon size={14} className={cn(tab === t.id && "text-ember-soft")} />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="col-span-9">
          {tab === "resto" && <RestoForm />}
          {tab === "apparence" && <AppearanceForm />}
          {tab === "horaires" && <HoursForm />}
          {tab === "paiement" && <PaymentForm />}
          {tab === "abonnement" && <SubscriptionForm />}
          {tab === "utilisateurs" && <UsersForm />}
          {tab === "integrations" && <IntegrationsForm />}
          {tab === "notifications" && <NotificationsForm />}
          {tab === "sms" && (
            <PlanGate feature="sms" requiredPlan="multi">
              <SmsForm />
            </PlanGate>
          )}
        </div>
      </div>
    </>
  );
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col gap-[6px]">
      <label className="chip-uppercase">{label}</label>
      {children}
      {hint && <div className="text-[10.5px] text-ink-4">{hint}</div>}
    </div>
  );
}

function Input({ defaultValue, placeholder, type = "text" }: { defaultValue?: string; placeholder?: string; type?: string }) {
  return (
    <input
      type={type}
      defaultValue={defaultValue}
      placeholder={placeholder}
      className="bg-bg-2 border border-line rounded-[10px] px-3 py-[9px] text-[13px] text-ink-1 outline-none focus:border-line-2 transition-colors"
    />
  );
}

function Toggle({ defaultChecked = false, label }: { defaultChecked?: boolean; label: string }) {
  const [on, setOn] = useState(defaultChecked);
  return (
    <button
      onClick={() => setOn(!on)}
      className="flex items-center gap-[10px] text-[13px] text-ink-2"
    >
      <span
        className={cn(
          "relative w-[32px] h-[18px] rounded-full transition-colors flex-shrink-0",
          on ? "bg-ember" : "bg-bg-3 border border-line"
        )}
      >
        <span
          className={cn(
            "absolute top-[2px] w-[12px] h-[12px] rounded-full bg-cream transition-all",
            on ? "left-[17px]" : "left-[2px]"
          )}
        />
      </span>
      {label}
    </button>
  );
}

function RestoForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Informations · {RESTO.name}</CardTitle>
      </CardHeader>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Nom de l'établissement">
          <Input defaultValue={RESTO.name} />
        </Field>
        <Field label="Type">
          <Input defaultValue="Brasserie" />
        </Field>
        <Field label="Adresse">
          <Input defaultValue="23 rue de la Fontaine au Roi" />
        </Field>
        <Field label="Code postal · Ville">
          <Input defaultValue="75011 Paris" />
        </Field>
        <Field label="Téléphone">
          <Input defaultValue="+33 1 43 57 12 45" type="tel" />
        </Field>
        <Field label="Email de contact">
          <Input defaultValue="contact@maison-severe.fr" type="email" />
        </Field>
        <Field label="SIRET" hint="Identifiant de l'entreprise">
          <Input defaultValue="892 451 237 00015" />
        </Field>
        <Field label="TVA intracommunautaire">
          <Input defaultValue="FR 45 892451237" />
        </Field>
        <div className="col-span-2">
          <Field label="Description publique">
            <textarea
              defaultValue="Brasserie contemporaine à Paris 11ᵉ, cuisine de saison et produits du marché."
              rows={3}
              className="bg-bg-2 border border-line rounded-[10px] px-3 py-[9px] text-[13px] text-ink-1 outline-none focus:border-line-2 transition-colors resize-none"
            />
          </Field>
        </div>
      </div>
    </Card>
  );
}

function HoursForm() {
  const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Horaires d'ouverture</CardTitle>
      </CardHeader>
      <div className="flex flex-col gap-2">
        {days.map((d, i) => (
          <div
            key={d}
            className="grid items-center gap-3 py-[10px] border-b border-line last:border-b-0"
            style={{ gridTemplateColumns: "140px 100px 1fr 1fr" }}
          >
            <div className="text-[13px] font-semibold">{d}</div>
            <Toggle defaultChecked={i !== 0} label={i === 0 ? "Fermé" : "Ouvert"} />
            <div className="flex items-center gap-2 text-[12px] text-ink-3">
              <span className="chip-uppercase">Déjeuner</span>
              <Input defaultValue="12:00" />
              <span>→</span>
              <Input defaultValue="14:30" />
            </div>
            <div className="flex items-center gap-2 text-[12px] text-ink-3">
              <span className="chip-uppercase">Dîner</span>
              <Input defaultValue="19:00" />
              <span>→</span>
              <Input defaultValue={i >= 4 ? "01:00" : "23:00"} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function PaymentForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Moyens de paiement & facturation</CardTitle>
      </CardHeader>
      <div className="flex flex-col gap-3">
        <Toggle defaultChecked label="Cartes bancaires (Stripe Terminal)" />
        <Toggle defaultChecked label="Espèces" />
        <Toggle defaultChecked label="Titres restaurant (papier + dématérialisés)" />
        <Toggle label="Apple Pay · Google Pay" />
        <Toggle defaultChecked label="American Express" />
      </div>
      <div className="grid grid-cols-2 gap-4 mt-6">
        <Field label="Taux de service par défaut">
          <Input defaultValue="12 %" />
        </Field>
        <Field label="TVA restauration sur place">
          <Input defaultValue="10 %" />
        </Field>
      </div>
    </Card>
  );
}

function UsersForm() {
  const users = [
    { name: "Marc Sévère", role: "Propriétaire", email: "marc@maison-severe.fr" },
    { name: "Léa Moreau", role: "Manager salle", email: "lea.m@maison-severe.fr" },
    { name: "Théo Laurent", role: "Chef de cuisine", email: "theo.l@maison-severe.fr" },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Utilisateurs & accès</CardTitle>
        <button className="btn-ghost">Inviter</button>
      </CardHeader>
      <div className="flex flex-col gap-0">
        {users.map((u) => (
          <div
            key={u.email}
            className="grid items-center gap-3 py-3 border-b border-line last:border-b-0"
            style={{ gridTemplateColumns: "1.5fr 1fr 1fr auto" }}
          >
            <div>
              <div className="text-[13px] font-semibold">{u.name}</div>
              <div className="text-[11px] text-ink-4">{u.email}</div>
            </div>
            <div className="text-[12px] text-ink-2">{u.role}</div>
            <div className="text-[11px] text-ok mono">● Actif</div>
            <button className="btn-ghost">Modifier</button>
          </div>
        ))}
      </div>
    </Card>
  );
}

function IntegrationsForm() {
  const items = [
    { name: "Supabase", connected: isSupabaseConfigured, desc: "Base de données · backend principal" },
    { name: "Stripe", connected: false, desc: "Paiements & abonnements" },
    { name: "TheFork", connected: true, desc: "Réservations & avis clients" },
    { name: "Deliveroo", connected: true, desc: "Livraisons" },
    { name: "Uber Eats", connected: false, desc: "Livraisons" },
    { name: "Google My Business", connected: true, desc: "Fiche & avis Google" },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Intégrations tierces</CardTitle>
      </CardHeader>
      <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
        {items.map((i) => (
          <div
            key={i.name}
            className="p-3 bg-bg-2 rounded-[10px] border border-line"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="text-[13px] font-semibold">{i.name}</div>
              <span
                className="ml-auto text-[10px] mono uppercase tracking-[0.08em]"
                style={{ color: i.connected ? "var(--ok)" : "var(--ink-4)" }}
              >
                {i.connected ? "● Connecté" : "○ Non connecté"}
              </span>
            </div>
            <div className="text-[11.5px] text-ink-3 mb-2">{i.desc}</div>
            <button className="btn-ghost w-full">
              {i.connected ? "Configurer" : "Connecter"}
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}

function NotificationsForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
      </CardHeader>
      <div className="flex flex-col gap-3">
        <Toggle defaultChecked label="Nouvel avis client (seuil ≤ 3★)" />
        <Toggle defaultChecked label="Rupture de stock prévue" />
        <Toggle defaultChecked label="Nouvelle réservation > 6 couverts" />
        <Toggle label="Rapport journalier à 23h00" />
        <Toggle defaultChecked label="Retard d'un membre de l'équipe" />
        <Toggle label="Récapitulatif hebdomadaire" />
      </div>
      <div className="grid grid-cols-2 gap-4 mt-6">
        <Field label="Email destinataire">
          <Input defaultValue="marc@maison-severe.fr" type="email" />
        </Field>
        <Field label="Numéro SMS (urgences)">
          <Input defaultValue="+33 6 12 34 56 78" type="tel" />
        </Field>
      </div>
    </Card>
  );
}

function AppearanceForm() {
  const { theme, setTheme } = useTheme();

  const options: { id: Theme; label: string; hint: string; icon: typeof Sun }[] = [
    { id: "dark", label: "Sombre", hint: "Ambiance brasserie · contrast élevé", icon: Moon },
    { id: "light", label: "Clair", hint: "Cream & ember · lecture en journée", icon: Sun },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Apparence · <span className="text-ember-soft">thème de l'interface</span></CardTitle>
      </CardHeader>

      <div className="grid grid-cols-2 gap-3">
        {options.map((opt) => {
          const Icon = opt.icon;
          const active = theme === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => setTheme(opt.id)}
              className={cn(
                "text-left p-4 rounded-[12px] border transition-all",
                active
                  ? "border-ember bg-bg-2 shadow-[0_0_0_1px_var(--ember)_inset]"
                  : "border-line bg-bg-2 hover:border-line-2 hover:bg-bg-3"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon size={16} className={active ? "text-ember-soft" : "text-ink-3"} />
                <span className="text-[13px] font-semibold">{opt.label}</span>
                {active && (
                  <span className="ml-auto text-[10px] mono uppercase tracking-[0.08em] text-ember-soft">
                    ● actif
                  </span>
                )}
              </div>
              <div className="text-[11.5px] text-ink-3 mb-3">{opt.hint}</div>
              <ThemeSwatch theme={opt.id} />
            </button>
          );
        })}
      </div>

      <div className="mt-5 text-[11.5px] text-ink-4">
        Le choix est sauvegardé sur cet appareil.
      </div>
    </Card>
  );
}

function ThemeSwatch({ theme }: { theme: Theme }) {
  const palette =
    theme === "dark"
      ? { bg: "#161310", surface: "#1d1915", ink: "#f4ece0", accent: "#e8733a", amber: "#e8b04a" }
      : { bg: "#f7f1e4", surface: "#fdfaf1", ink: "#1d1711", accent: "#c85c1e", amber: "#b6821d" };

  return (
    <div
      className="h-[56px] rounded-[8px] border border-line/60 flex overflow-hidden"
      style={{ background: palette.bg }}
    >
      <div className="w-[30%]" style={{ background: palette.surface }} />
      <div className="flex-1 flex items-center gap-2 px-3">
        <span
          className="w-[10px] h-[10px] rounded-full"
          style={{ background: palette.accent }}
        />
        <span
          className="w-[10px] h-[10px] rounded-full"
          style={{ background: palette.amber }}
        />
        <span className="ml-auto mono text-[10px]" style={{ color: palette.ink }}>
          Aa
        </span>
      </div>
    </div>
  );
}

const PLAN_TINT: Record<Plan, string> = {
  essentiel: "#b8b3a8",
  pro: "var(--ember-soft)",
  multi: "var(--amber)",
};

const ALL_FEATURES: Feature[] = [
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

function SubscriptionForm() {
  const { plan } = usePlan();

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>
            Abonnement · <span className="text-ember-soft">plan actuel</span>
          </CardTitle>
          <span
            className="channel-pill"
            style={{
              color: PLAN_TINT[plan],
              borderColor: PLAN_TINT[plan],
            }}
          >
            ● {PLAN_LABELS[plan]}
          </span>
        </CardHeader>

        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="chip-uppercase mb-1">Vous êtes sur</div>
            <div className="display font-medium text-[28px] leading-tight">
              {PLAN_LABELS[plan]}
            </div>
            <div className="text-[12px] text-ink-3 mt-1">
              {PLAN_FEATURES[plan].length} fonctionnalités incluses
            </div>
          </div>
          <div className="text-right">
            <div className="display font-medium text-[24px] leading-none">
              {PLAN_PRICES[plan].monthly}€
              <span className="text-[12px] text-ink-3 font-normal"> / mois</span>
            </div>
            <div className="text-[10.5px] text-ink-4 mono mt-1">
              Annuel : {PLAN_PRICES[plan].yearly}€ · 2 mois offerts
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Changer de plan</CardTitle>
        </CardHeader>

        <div className="grid grid-cols-3 gap-3">
          {PLAN_ORDER.map((p) => {
            const isCurrent = p === plan;
            return (
              <div
                key={p}
                className={cn(
                  "p-4 rounded-[12px] border transition-all",
                  isCurrent
                    ? "border-ember bg-bg-2 shadow-[0_0_0_1px_var(--ember)_inset]"
                    : "border-line bg-bg-2"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="w-[10px] h-[10px] rounded-full"
                    style={{ background: PLAN_TINT[p] }}
                  />
                  <span className="text-[13px] font-semibold">{PLAN_LABELS[p]}</span>
                  {isCurrent && (
                    <span className="ml-auto text-[10px] mono uppercase tracking-[0.08em] text-ember-soft">
                      actuel
                    </span>
                  )}
                </div>
                <div className="display font-medium text-[22px] leading-none mt-2 mb-1">
                  {PLAN_PRICES[p].monthly}€
                  <span className="text-[11px] text-ink-3 font-normal"> / mois</span>
                </div>
                <div className="text-[10.5px] text-ink-4 mono mb-3">
                  Annuel : {PLAN_PRICES[p].yearly}€ · 2 mois offerts
                </div>
                <ul className="flex flex-col gap-[6px] mb-4 min-h-[140px]">
                  {PLAN_FEATURES[p].map((f) => (
                    <li key={f} className="text-[11.5px] text-ink-2 flex items-center gap-[6px]">
                      <Check size={11} className="text-ok flex-shrink-0" />
                      {FEATURE_LABELS[f]}
                    </li>
                  ))}
                </ul>
                <button
                  disabled
                  title="Bientôt via Stripe"
                  className="btn-ghost w-full cursor-not-allowed opacity-60"
                >
                  {isCurrent ? "Plan actuel" : "Changer de plan"}
                </button>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Matrice · fonctionnalités par plan</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="text-left text-ink-3 border-b border-line">
                <th className="py-[9px] font-normal chip-uppercase">Fonctionnalité</th>
                {PLAN_ORDER.map((p) => (
                  <th key={p} className="py-[9px] font-normal text-center chip-uppercase">
                    {PLAN_LABELS[p]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALL_FEATURES.map((f) => (
                <tr key={f} className="border-b border-line last:border-b-0">
                  <td className="py-[9px] text-ink-2">{FEATURE_LABELS[f]}</td>
                  {PLAN_ORDER.map((p) => (
                    <td key={p} className="py-[9px] text-center">
                      {PLAN_FEATURES[p].includes(f) ? (
                        <Check size={13} className="inline text-ok" />
                      ) : (
                        <span className="text-ink-4">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function SmsForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          SMS · <span className="text-ember-soft">notifications & rappels</span>
        </CardTitle>
      </CardHeader>
      <div className="flex flex-col gap-3">
        <Toggle defaultChecked label="Rappel de réservation à J-1 à 10h00" />
        <Toggle defaultChecked label="Confirmation immédiate à la création" />
        <Toggle label="Relance no-show dans les 2 heures" />
        <Toggle label="Campagne anniversaire client" />
      </div>
      <div className="grid grid-cols-2 gap-4 mt-6">
        <Field label="Expéditeur (11 car. max)">
          <Input defaultValue="MaisonSev" />
        </Field>
        <Field label="Solde SMS restant" hint="Recharge automatique à 50 SMS">
          <Input defaultValue="1 240" />
        </Field>
      </div>
    </Card>
  );
}
