import { useEffect, useMemo, useState } from "react";
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
  ExternalLink,
  UserPlus,
  Trash2,
  Eye,
  EyeOff,
  Code,
  AlertTriangle,
  Loader2,
  X,
  Lock,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/supabase-env";
import { supabase } from "@/lib/supabase";
import { RESTO } from "@/lib/mock-data";
import { useTheme, type Theme } from "@/lib/theme";
import { PlanGate } from "@/components/PlanGate";
import { RoleGate } from "@/components/RoleGate";
import { usePlan } from "@/hooks/usePlan";
import { useRole } from "@/hooks/useRole";
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
import { ROLE_LABELS, ROLE_ORDER, type Role } from "@/config/roles";
import {
  ALL_RESOURCES,
  BASELINE_PERMISSIONS,
  CONFIGURABLE_ROLES,
  NAV_RESOURCES,
  ACTION_RESOURCES,
  isAllowed,
  type PermissionOverrides,
} from "@/config/permissions";
import {
  fetchAppUsers,
  inviteAppUser,
  revokeAppUser,
  updateAppUserRole,
  type AppUser,
} from "@/lib/api/team-users";
import { saveRolePermissions } from "@/lib/api/role-permissions";

type Tab =
  | "resto"
  | "apparence"
  | "horaires"
  | "paiement"
  | "abonnement"
  | "equipe"
  | "permissions"
  | "integrations"
  | "notifications"
  | "sms"
  | "developer";

type TabDef = { id: Tab; label: string; icon: typeof Building2; minRole?: Role };

const ALL_TABS: TabDef[] = [
  { id: "resto", label: "Restaurant", icon: Building2 },
  { id: "apparence", label: "Apparence", icon: Palette },
  { id: "horaires", label: "Horaires", icon: Globe },
  { id: "paiement", label: "Paiement", icon: CreditCard },
  { id: "abonnement", label: "Abonnement", icon: Sparkles, minRole: "owner" },
  { id: "equipe", label: "Équipe", icon: UsersIcon, minRole: "owner" },
  { id: "permissions", label: "Rôles & accès", icon: ShieldCheck, minRole: "owner" },
  { id: "integrations", label: "Intégrations", icon: Database },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "sms", label: "SMS", icon: MessageSquare },
  { id: "developer", label: "Développeur", icon: Code, minRole: "developer" },
];

export default function Settings() {
  const [params, setParams] = useSearchParams();
  const { isAtLeast } = useRole();

  // Garde-fou : un employé n'a aucun accès aux paramètres.
  if (!isAtLeast("manager")) {
    return (
      <div className="pt-6 max-w-[640px]">
        <div className="chip-uppercase mb-1">Configuration</div>
        <h2 className="display font-medium text-[26px] leading-tight m-0 mb-4">
          Paramètres
        </h2>
        <RoleLockedCard />
      </div>
    );
  }

  const visibleTabs = useMemo(
    () => ALL_TABS.filter((t) => !t.minRole || isAtLeast(t.minRole)),
    [isAtLeast]
  );
  const visibleIds = useMemo(() => visibleTabs.map((t) => t.id), [visibleTabs]);

  const isVisibleTab = (value: string | null): value is Tab =>
    value !== null && (visibleIds as string[]).includes(value);

  const initial = isVisibleTab(params.get("tab")) ? (params.get("tab") as Tab) : "resto";
  const [tab, setTab] = useState<Tab>(initial);

  useEffect(() => {
    const p = params.get("tab");
    if (isVisibleTab(p) && p !== tab) setTab(p);
    else if (!isVisibleTab(p) && !visibleIds.includes(tab)) setTab("resto");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, visibleIds]);

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
        <div className="flex items-center gap-2">
          <a
            href="/?preview=1"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost inline-flex items-center gap-2"
          >
            <ExternalLink size={13} />
            Voir la landing
          </a>
          <button className="btn-primary inline-flex items-center gap-2">
            <Save size={13} />
            Enregistrer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-3">
          <Card className="p-2">
            <div className="flex flex-col gap-1">
              {visibleTabs.map((t) => {
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
          {tab === "abonnement" && (
            <RoleGate requiredRole="owner" fallback={<RoleLockedCard />}>
              <SubscriptionForm />
            </RoleGate>
          )}
          {tab === "equipe" && (
            <RoleGate requiredRole="owner" fallback={<RoleLockedCard />}>
              <UsersForm />
            </RoleGate>
          )}
          {tab === "permissions" && (
            <RoleGate requiredRole="owner" fallback={<RoleLockedCard />}>
              <PermissionsForm />
            </RoleGate>
          )}
          {tab === "integrations" && <IntegrationsForm />}
          {tab === "notifications" && <NotificationsForm />}
          {tab === "sms" && (
            <PlanGate feature="sms" requiredPlan="multi">
              <SmsForm />
            </PlanGate>
          )}
          {tab === "developer" && (
            <RoleGate requiredRole="developer" fallback={<RoleLockedCard />}>
              <DeveloperForm />
            </RoleGate>
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
    <div className="flex flex-col gap-4">
      <RestoIdentitySection />
      <RestoExtraSection />
    </div>
  );
}

function RestoIdentitySection() {
  const { restaurant, refreshRestaurant } = useAuth();
  const [name, setName] = useState(restaurant?.name ?? "");
  const [slug, setSlug] = useState(restaurant?.slug ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(restaurant?.logoUrl ?? null);

  useEffect(() => {
    setName(restaurant?.name ?? "");
    setSlug(restaurant?.slug ?? "");
    setLogoPreview(restaurant?.logoUrl ?? null);
  }, [restaurant?.id, restaurant?.name, restaurant?.slug, restaurant?.logoUrl]);

  const dirty =
    (restaurant && (name.trim() !== restaurant.name || slug.trim() !== (restaurant.slug ?? ""))) ||
    false;

  const publicUrl = slug ? `${window.location.origin}/carte/${slug}` : null;

  const onSlugChange = (raw: string) => {
    setSlug(raw.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-"));
    setSuccess(false);
    setError(null);
  };

  const save = async () => {
    if (!restaurant) return;
    if (!name.trim()) {
      setError("Le nom est obligatoire.");
      return;
    }
    if (!slug.trim()) {
      setError("Le slug est obligatoire.");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const { updateRestaurant } = await import("@/lib/api/restaurant");
      await updateRestaurant(restaurant.id, {
        name: name.trim(),
        slug: slug.trim(),
      });
      await refreshRestaurant();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.toLowerCase().includes("duplicate") || msg.toLowerCase().includes("unique")) {
        setError("Ce slug est déjà pris. Choisissez-en un autre.");
      } else {
        setError(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  const onLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !restaurant) return;
    if (file.size > 3 * 1024 * 1024) {
      setError("Logo trop volumineux (3 Mo max).");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const { uploadLogo, updateRestaurant, deleteLogo } = await import("@/lib/api/restaurant");
      const ext = (file.name.split(".").pop() || "png").toLowerCase();
      const url = await uploadLogo(restaurant.id, file, ext);
      const previousUrl = restaurant.logoUrl;
      await updateRestaurant(restaurant.id, { logoUrl: url });
      setLogoPreview(url);
      await refreshRestaurant();
      if (previousUrl && previousUrl !== url) {
        void deleteLogo(previousUrl);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Échec du téléversement : ${msg}`);
    } finally {
      setUploading(false);
    }
  };

  const removeLogo = async () => {
    if (!restaurant?.logoUrl) return;
    setUploading(true);
    setError(null);
    try {
      const { updateRestaurant, deleteLogo } = await import("@/lib/api/restaurant");
      await updateRestaurant(restaurant.id, { logoUrl: null });
      void deleteLogo(restaurant.logoUrl);
      setLogoPreview(null);
      await refreshRestaurant();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  if (!restaurant) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Identité</CardTitle>
        </CardHeader>
        <div className="text-[12px] text-ink-3 italic">Chargement…</div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Identité · <span className="text-ember-soft">{restaurant.name}</span>
        </CardTitle>
        {success && (
          <span className="text-[11px] text-ok mono inline-flex items-center gap-1">
            <Check size={12} /> Enregistré
          </span>
        )}
      </CardHeader>

      <div className="grid grid-cols-12 gap-4">
        {/* Logo */}
        <div className="col-span-4 flex flex-col items-center gap-3 p-4 bg-bg-2 border border-line rounded-[12px]">
          {logoPreview ? (
            <img
              src={logoPreview}
              alt={restaurant.name}
              className="w-24 h-24 rounded-[16px] object-cover border border-line-2"
            />
          ) : (
            <div
              className="w-24 h-24 rounded-[16px] grid place-items-center text-cream font-bold text-[42px] display"
              style={{
                background:
                  "radial-gradient(circle at 30% 30%, var(--ember) 0%, var(--ember-deep) 60%, #5c2a0e 100%)",
              }}
            >
              {restaurant.name.trim().charAt(0).toUpperCase() || "•"}
            </div>
          )}
          <div className="flex flex-col gap-2 w-full">
            <label
              className={cn(
                "btn-ghost inline-flex items-center justify-center gap-2 cursor-pointer text-[12px]",
                uploading && "opacity-60 pointer-events-none"
              )}
            >
              {uploading ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              {logoPreview ? "Remplacer" : "Téléverser"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={onLogoSelect}
                disabled={uploading}
              />
            </label>
            {logoPreview && (
              <button
                onClick={removeLogo}
                disabled={uploading}
                className="text-[11px] text-ink-3 hover:text-danger transition-colors inline-flex items-center justify-center gap-1"
              >
                <Trash2 size={11} />
                Supprimer
              </button>
            )}
          </div>
          <div className="text-[10.5px] text-ink-4 text-center leading-snug">
            PNG, JPG, WebP ou SVG · 3 Mo max
          </div>
        </div>

        {/* Name + slug */}
        <div className="col-span-8 grid grid-cols-1 gap-4">
          <Field label="Nom de l'établissement">
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSuccess(false);
              }}
              className="bg-bg-2 border border-line rounded-[10px] px-3 py-[9px] text-[13px] text-ink-1 outline-none focus:border-line-2 transition-colors"
            />
          </Field>
          <Field
            label="Slug · URL publique"
            hint={
              publicUrl
                ? `Lien menu : ${publicUrl}`
                : "Permet d'accéder au menu en ligne via /carte/<slug>"
            }
          >
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-ink-4 mono">/carte/</span>
              <input
                value={slug}
                onChange={(e) => onSlugChange(e.target.value)}
                placeholder="mon-restaurant"
                className="flex-1 bg-bg-2 border border-line rounded-[10px] px-3 py-[9px] text-[13px] text-ink-1 mono outline-none focus:border-line-2 transition-colors"
              />
            </div>
          </Field>

          {error && (
            <div className="text-[11.5px] text-danger inline-flex items-center gap-2">
              <AlertTriangle size={12} />
              {error}
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={save}
              disabled={saving || !dirty}
              className={cn(
                "btn-primary inline-flex items-center gap-2",
                (!dirty || saving) && "opacity-60 cursor-not-allowed"
              )}
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function RestoExtraSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Coordonnées · {RESTO.name}</CardTitle>
      </CardHeader>
      <div className="grid grid-cols-2 gap-4">
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

const ASSIGNABLE_ROLES: Role[] = ["employee", "manager", "owner"];

function emailPrefix(email: string): string {
  const at = email.indexOf("@");
  if (at <= 0) return email;
  return email.slice(0, at).replace(/[._-]+/g, " ");
}

function formatJoinDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function UsersForm() {
  const { user } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAppUsers();
      setUsers(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const handleRoleChange = async (id: string, role: Role) => {
    setUpdatingId(id);
    setError(null);
    try {
      await updateAppUserRole(id, role);
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Mise à jour impossible.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm("Révoquer l'accès de ce membre ?")) return;
    setUpdatingId(id);
    setError(null);
    try {
      await revokeAppUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Révocation impossible.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Équipe · accès & rôles</CardTitle>
        <button
          className="btn-primary inline-flex items-center gap-2"
          onClick={() => setInviteOpen(true)}
        >
          <UserPlus size={13} />
          Inviter
        </button>
      </CardHeader>

      {error && (
        <div className="mb-3 p-2 rounded-[8px] border border-line bg-bg-2 text-[12px] text-warn flex items-center gap-2">
          <AlertTriangle size={13} />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-[12px] text-ink-3 py-6">
          <Loader2 size={14} className="animate-spin" />
          Chargement de l'équipe…
        </div>
      ) : users.length === 0 ? (
        <div className="text-[12px] text-ink-3 py-6">Aucun membre pour l'instant.</div>
      ) : (
        <div className="flex flex-col gap-0">
          {users.map((u) => {
            const isSelf = u.id === user?.id;
            const busy = updatingId === u.id;
            return (
              <div
                key={u.id}
                className="grid items-center gap-3 py-3 border-b border-line last:border-b-0"
                style={{ gridTemplateColumns: "1.6fr 1.2fr 0.9fr auto" }}
              >
                <div>
                  <div className="text-[13px] font-semibold capitalize">
                    {emailPrefix(u.email)}
                    {isSelf && (
                      <span className="ml-2 text-[10px] mono uppercase tracking-[0.08em] text-ember-soft">
                        · vous
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-ink-4">{u.email}</div>
                </div>
                <div>
                  <select
                    value={u.role}
                    disabled={isSelf || busy}
                    onChange={(e) => handleRoleChange(u.id, e.target.value as Role)}
                    className="bg-bg-2 border border-line rounded-[8px] px-2 py-[6px] text-[12px] text-ink-1 outline-none focus:border-line-2 disabled:opacity-50"
                  >
                    {ASSIGNABLE_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                    {u.role === "developer" && (
                      <option value="developer">{ROLE_LABELS.developer}</option>
                    )}
                  </select>
                </div>
                <div className="text-[11px] text-ink-3 mono">
                  {formatJoinDate(u.createdAt)}
                </div>
                <button
                  className="btn-ghost inline-flex items-center gap-[6px] text-warn disabled:opacity-40"
                  disabled={isSelf || busy}
                  onClick={() => handleRevoke(u.id)}
                  title={isSelf ? "Vous ne pouvez pas vous révoquer." : "Révoquer l'accès"}
                >
                  {busy ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                  Révoquer
                </button>
              </div>
            );
          })}
        </div>
      )}

      {inviteOpen && (
        <InviteUserModal
          onClose={() => setInviteOpen(false)}
          onInvited={() => {
            setInviteOpen(false);
            void reload();
          }}
        />
      )}
    </Card>
  );
}

function InviteUserModal({
  onClose,
  onInvited,
}: {
  onClose: () => void;
  onInvited: () => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("employee");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    setFeedback(null);
    const result = await inviteAppUser(email.trim().toLowerCase(), role);
    setFeedback(result);
    setSubmitting(false);
    if (result.ok) {
      setTimeout(onInvited, 800);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-bg-1 border border-line rounded-[12px] w-[440px] max-w-[92vw] p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="chip-uppercase mb-1">Équipe</div>
            <div className="display font-medium text-[18px] leading-tight">
              Inviter un membre
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-ink-3 hover:text-ink-1 p-1 rounded-[6px] hover:bg-bg-2"
            aria-label="Fermer"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3">
          <Field label="Email">
            <input
              type="email"
              required
              autoFocus
              placeholder="prenom@exemple.fr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-bg-2 border border-line rounded-[10px] px-3 py-[9px] text-[13px] text-ink-1 outline-none focus:border-line-2 transition-colors"
            />
          </Field>

          <Field label="Rôle">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="bg-bg-2 border border-line rounded-[10px] px-3 py-[9px] text-[13px] text-ink-1 outline-none focus:border-line-2 transition-colors"
            >
              {ASSIGNABLE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </Field>

          {feedback && (
            <div
              className={cn(
                "text-[12px] p-2 rounded-[8px] border",
                feedback.ok
                  ? "border-line bg-bg-2 text-ok"
                  : "border-line bg-bg-2 text-warn"
              )}
            >
              {feedback.message}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 mt-2">
            <button type="button" className="btn-ghost" onClick={onClose} disabled={submitting}>
              Annuler
            </button>
            <button
              type="submit"
              className="btn-primary inline-flex items-center gap-2"
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <UserPlus size={13} />
              )}
              Envoyer l'invitation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RoleLockedCard() {
  return (
    <Card>
      <div className="flex items-start gap-3 py-2">
        <AlertTriangle size={16} className="text-ember-soft mt-[2px]" />
        <div>
          <div className="text-[13px] font-semibold mb-1">Accès restreint</div>
          <div className="text-[12px] text-ink-3">
            Cette section est réservée à un rôle supérieur.
          </div>
        </div>
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

function PermissionsForm() {
  const { restaurant, refreshRestaurant } = useAuth();
  const [draft, setDraft] = useState<PermissionOverrides>(
    () => structuredClone(restaurant?.rolePermissions ?? {})
  );
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    setDraft(structuredClone(restaurant?.rolePermissions ?? {}));
  }, [restaurant?.id, restaurant?.rolePermissions]);

  const dirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(restaurant?.rolePermissions ?? {}),
    [draft, restaurant?.rolePermissions]
  );

  const cellValue = (role: Role, resourceId: string): boolean => {
    if (role === "owner" || role === "developer") return true;
    return isAllowed(role, resourceId, draft);
  };

  const toggle = (role: Role, resourceId: string) => {
    if (role === "owner" || role === "developer") return;
    const current = cellValue(role, resourceId);
    const baseline = BASELINE_PERMISSIONS[role][resourceId] ?? false;
    const next = !current;
    setDraft((prev) => {
      const copy: PermissionOverrides = structuredClone(prev);
      const slot = copy[role] ?? {};
      if (next === baseline) {
        delete slot[resourceId];
      } else {
        slot[resourceId] = next;
      }
      if (Object.keys(slot).length === 0) {
        delete copy[role];
      } else {
        copy[role] = slot;
      }
      return copy;
    });
  };

  const resetRole = (role: Role) => {
    setDraft((prev) => {
      const copy: PermissionOverrides = structuredClone(prev);
      delete copy[role];
      return copy;
    });
  };

  const save = async () => {
    if (!restaurant) return;
    setSaving(true);
    setFeedback(null);
    try {
      await saveRolePermissions(restaurant.id, draft);
      await refreshRestaurant();
      setFeedback({ ok: true, message: "Permissions enregistrées." });
    } catch (e) {
      setFeedback({
        ok: false,
        message: e instanceof Error ? e.message : "Échec de l'enregistrement.",
      });
    } finally {
      setSaving(false);
    }
  };

  const discard = () => {
    setDraft(structuredClone(restaurant?.rolePermissions ?? {}));
    setFeedback(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>
            Rôles & accès · <span className="text-ember-soft">matrice de permissions</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            {dirty && (
              <button className="btn-ghost" onClick={discard} disabled={saving}>
                Annuler
              </button>
            )}
            <button
              className="btn-primary inline-flex items-center gap-2"
              onClick={save}
              disabled={!dirty || saving}
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              Enregistrer
            </button>
          </div>
        </CardHeader>

        <div className="text-[12px] text-ink-3 mb-3 leading-snug">
          Personnalise ce que voient <span className="text-ink-1">Employé</span> et{" "}
          <span className="text-ink-1">Manager</span>. Les colonnes <span className="text-ink-1">Propriétaire</span>{" "}
          et <span className="text-ink-1">Développeur</span> ont toujours tout par défaut. Les fonctionnalités liées au plan d'abonnement restent gouvernées par le plan, indépendamment de cette matrice.
        </div>

        <PermissionsTable
          title="Navigation"
          resources={NAV_RESOURCES}
          cellValue={cellValue}
          toggle={toggle}
          draft={draft}
        />

        <div className="mt-5">
          <PermissionsTable
            title="Actions sensibles"
            resources={ACTION_RESOURCES}
            cellValue={cellValue}
            toggle={toggle}
            draft={draft}
          />
        </div>

        <div className="mt-5 flex items-center gap-2 flex-wrap">
          {CONFIGURABLE_ROLES.map((r) => {
            const hasOverrides = Boolean(draft[r] && Object.keys(draft[r] ?? {}).length);
            return (
              <button
                key={r}
                className="btn-ghost inline-flex items-center gap-2 disabled:opacity-40"
                onClick={() => resetRole(r)}
                disabled={!hasOverrides}
              >
                <RefreshCw size={12} />
                Réinitialiser {ROLE_LABELS[r]}
              </button>
            );
          })}
        </div>

        {feedback && (
          <div
            className={cn(
              "mt-4 text-[12px] p-2 rounded-[8px] border",
              feedback.ok ? "border-line bg-bg-2 text-ok" : "border-line bg-bg-2 text-warn"
            )}
          >
            {feedback.message}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comment lire la matrice</CardTitle>
        </CardHeader>
        <ul className="flex flex-col gap-2 text-[12px] text-ink-2">
          <li className="flex items-start gap-2">
            <Check size={13} className="text-ok mt-[2px]" />
            <span>Une case cochée = ce rôle voit l'élément dans la sidebar / a accès à l'action.</span>
          </li>
          <li className="flex items-start gap-2">
            <Lock size={13} className="text-ink-3 mt-[2px]" />
            <span>Propriétaire et Développeur ont tout débloqué et ne peuvent pas être restreints ici (sécurité).</span>
          </li>
          <li className="flex items-start gap-2">
            <RefreshCw size={13} className="text-ink-3 mt-[2px]" />
            <span>Les valeurs personnalisées sont marquées d'un point ember ; le reste suit le défaut système.</span>
          </li>
        </ul>
      </Card>
    </div>
  );
}

function PermissionsTable({
  title,
  resources,
  cellValue,
  toggle,
  draft,
}: {
  title: string;
  resources: typeof ALL_RESOURCES;
  cellValue: (role: Role, resourceId: string) => boolean;
  toggle: (role: Role, resourceId: string) => void;
  draft: PermissionOverrides;
}) {
  return (
    <div>
      <div className="chip-uppercase mb-2">{title}</div>
      <div className="overflow-x-auto">
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="text-left text-ink-3 border-b border-line">
              <th className="py-[9px] font-normal chip-uppercase">Ressource</th>
              {ROLE_ORDER.map((r) => (
                <th key={r} className="py-[9px] font-normal text-center chip-uppercase">
                  {ROLE_LABELS[r]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {resources.map((res) => (
              <tr key={res.id} className="border-b border-line last:border-b-0">
                <td className="py-[9px] pr-3 text-ink-1 align-top">
                  <div className="font-medium">{res.label}</div>
                  {res.description && (
                    <div className="text-[10.5px] text-ink-4 mt-[2px]">{res.description}</div>
                  )}
                </td>
                {ROLE_ORDER.map((role) => {
                  const value = cellValue(role, res.id);
                  const locked = role === "owner" || role === "developer";
                  const isOverride = Boolean(draft[role]?.[res.id] !== undefined);
                  return (
                    <td key={role} className="py-[9px] text-center align-top">
                      <button
                        type="button"
                        onClick={() => toggle(role, res.id)}
                        disabled={locked}
                        className={cn(
                          "relative w-[26px] h-[26px] rounded-[7px] border transition-all inline-flex items-center justify-center",
                          locked
                            ? "border-line bg-bg-2 text-ink-4 cursor-not-allowed"
                            : value
                            ? "border-ember bg-bg-2 text-ember-soft"
                            : "border-line bg-bg-1 text-ink-4 hover:border-line-2"
                        )}
                        aria-pressed={value}
                        aria-label={`${ROLE_LABELS[role]} · ${res.label}`}
                      >
                        {locked ? (
                          <Lock size={12} />
                        ) : value ? (
                          <Check size={13} />
                        ) : (
                          <span className="block w-[8px] h-[1.5px] bg-ink-4 rounded-full" />
                        )}
                        {isOverride && !locked && (
                          <span
                            className="absolute -top-1 -right-1 w-[6px] h-[6px] rounded-full"
                            style={{ background: "var(--ember)" }}
                            aria-label="Personnalisé"
                          />
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DeveloperForm() {
  const { roleOverride, setRoleOverride, actualRole } = useAuth();
  const [revealUrl, setRevealUrl] = useState(false);
  const [pingState, setPingState] = useState<"idle" | "pending" | "ok" | "error">("idle");
  const [pingMs, setPingMs] = useState<number | null>(null);
  const [pingError, setPingError] = useState<string | null>(null);

  const appVersion =
    (import.meta.env.VITE_APP_VERSION as string | undefined) ?? "dev";
  const env = import.meta.env.DEV ? "development" : "production";
  const supabaseUrl =
    (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "non configuré";
  const maskedUrl = supabaseUrl.replace(/^https:\/\/([^.]+)\./, "https://••••.");

  const sessionPlan =
    typeof sessionStorage !== "undefined" ? sessionStorage.getItem("dev:plan") : null;

  const ping = async () => {
    setPingState("pending");
    setPingError(null);
    setPingMs(null);
    const t0 = performance.now();
    try {
      if (!supabase) throw new Error("Supabase non configuré.");
      const { error } = await supabase.from("restaurants").select("id").limit(1);
      const ms = Math.round(performance.now() - t0);
      if (error) throw new Error(error.message);
      setPingMs(ms);
      setPingState("ok");
    } catch (e) {
      setPingError(e instanceof Error ? e.message : "Erreur inconnue.");
      setPingState("error");
    }
  };

  const clearLocal = () => {
    if (!confirm("Vider tout le localStorage de cette app ?")) return;
    localStorage.clear();
    alert("localStorage vidé.");
  };

  const setPlanOverride = (plan: Plan | null) => {
    if (plan) sessionStorage.setItem("dev:plan", plan);
    else sessionStorage.removeItem("dev:plan");
    window.location.reload();
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>
            Développeur · <span className="text-ember-soft">environnement</span>
          </CardTitle>
        </CardHeader>

        <div className="grid grid-cols-2 gap-3">
          <DevRow label="Version">
            <span className="mono text-[12px] text-ink-1">{appVersion}</span>
          </DevRow>
          <DevRow label="Environnement">
            <span
              className={cn(
                "mono text-[11px] uppercase tracking-[0.08em]",
                env === "development" ? "text-amber" : "text-ok"
              )}
            >
              ● {env}
            </span>
          </DevRow>
          <DevRow label="Supabase URL">
            <div className="flex items-center gap-2">
              <span className="mono text-[12px] text-ink-1 truncate">
                {revealUrl ? supabaseUrl : maskedUrl}
              </span>
              <button
                type="button"
                className="btn-ghost p-1"
                onClick={() => setRevealUrl((v) => !v)}
                aria-label={revealUrl ? "Masquer" : "Révéler"}
              >
                {revealUrl ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
          </DevRow>
          <DevRow label="Connexion Supabase">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn-ghost inline-flex items-center gap-2"
                onClick={ping}
                disabled={pingState === "pending"}
              >
                {pingState === "pending" ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  "Tester"
                )}
              </button>
              {pingState === "ok" && pingMs !== null && (
                <span className="text-[11px] text-ok mono">● {pingMs} ms</span>
              )}
              {pingState === "error" && (
                <span className="text-[11px] text-warn mono truncate">
                  ● {pingError}
                </span>
              )}
            </div>
          </DevRow>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Simuler un rôle · session uniquement</CardTitle>
        </CardHeader>
        <div className="flex items-center gap-2 flex-wrap">
          {(["employee", "manager", "owner", "developer"] as const).map((r) => (
            <button
              key={r}
              className={cn(
                "btn-ghost",
                roleOverride === r && "border-ember text-ember-soft"
              )}
              onClick={() => setRoleOverride(r)}
            >
              {ROLE_LABELS[r]}
            </button>
          ))}
          <button className="btn-ghost ml-2" onClick={() => setRoleOverride(null)}>
            Réinitialiser
          </button>
        </div>
        <div className="text-[11px] text-ink-3 mt-3">
          {roleOverride
            ? <>Override actif : <span className="mono text-ember-soft">{roleOverride}</span> · ton rôle réel reste <span className="mono">{actualRole}</span>.</>
            : <>Aucun override · vue rendue avec ton rôle réel <span className="mono">{actualRole}</span>.</>}
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Forcer un plan · session uniquement</CardTitle>
        </CardHeader>
        <div className="flex items-center gap-2 flex-wrap">
          {PLAN_ORDER.map((p) => (
            <button
              key={p}
              className={cn(
                "btn-ghost",
                sessionPlan === p && "border-ember text-ember-soft"
              )}
              onClick={() => setPlanOverride(p)}
            >
              {PLAN_LABELS[p]}
            </button>
          ))}
          <button className="btn-ghost ml-2" onClick={() => setPlanOverride(null)}>
            Réinitialiser
          </button>
        </div>
        {sessionPlan && (
          <div className="text-[11px] text-ink-3 mt-3">
            Override actif : <span className="mono text-ember-soft">{sessionPlan}</span>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Maintenance locale</CardTitle>
        </CardHeader>
        <div className="flex flex-col gap-2">
          <button
            className="btn-ghost inline-flex items-center gap-2 self-start text-warn"
            onClick={clearLocal}
          >
            <Trash2 size={13} />
            Vider localStorage
          </button>
          <div className="text-[11px] text-ink-4">
            Supprime préférences thème, drafts et caches locaux. Ne déconnecte pas.
          </div>
        </div>
      </Card>
    </div>
  );
}

function DevRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-[6px] p-3 bg-bg-2 rounded-[10px] border border-line">
      <div className="chip-uppercase">{label}</div>
      <div>{children}</div>
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
