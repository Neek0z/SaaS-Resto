import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { CalendarCheck, AlertTriangle } from "lucide-react";
import {
  fetchPublicReservationInfo,
  createPublicReservation,
  type PublicResaInfo,
  type PublicResaTable,
} from "@/lib/api/public-reservation";
import type { TableZone } from "@/lib/api/restaurant-tables";
import { extractErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";

type State =
  | { status: "loading" }
  | { status: "not_found" }
  | { status: "error"; message: string }
  | { status: "ready"; data: PublicResaInfo };

const ZONE_LABEL: Record<TableZone, string> = {
  inside: "Salle",
  terrace: "Terrasse",
  bar: "Bar",
  private: "Privée",
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function maxIso(daysAhead = 60): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().slice(0, 10);
}

const SLOTS = [
  "12:00", "12:30", "13:00", "13:30", "14:00",
  "19:00", "19:30", "20:00", "20:30", "21:00", "21:30",
];

export default function PublicReservation() {
  const { slug } = useParams<{ slug: string }>();
  const [state, setState] = useState<State>({ status: "loading" });

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
          <div className="display text-[28px] font-medium mb-2">
            Page introuvable
          </div>
          <div className="text-[13px] text-ink-3">
            L&apos;adresse <span className="mono text-ink-2">/reserver/{slug}</span>{" "}
            ne correspond à aucun restaurant publié.
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

  return <ReservationForm slug={slug!} data={state.data} />;
}

function ReservationForm({ slug, data }: { slug: string; data: PublicResaInfo }) {
  const { restaurant, tables } = data;
  const [date, setDate] = useState(todayIso());
  const [time, setTime] = useState("20:00");
  const [covers, setCovers] = useState(2);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ tableLabel: string } | null>(null);

  const fitting = useMemo(
    () =>
      tables
        .filter((t) => t.capacity >= covers)
        .sort((a, b) => a.capacity - b.capacity || a.label.localeCompare(b.label)),
    [tables, covers]
  );

  const submit = async () => {
    if (submitting) return;
    setError(null);
    if (name.trim().length < 2) {
      setError("Merci d'indiquer votre nom.");
      return;
    }
    if (phone.trim().length < 6) {
      setError("Merci d'indiquer un numéro de téléphone valide.");
      return;
    }
    if (covers < 1 || covers > 20) {
      setError("Nombre de couverts invalide.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await createPublicReservation(slug, {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        date,
        time,
        covers,
        note: note.trim() || undefined,
      });
      setSuccess({ tableLabel: res.table_label });
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-screen bg-bg-0 grid place-items-center px-6">
        <div className="max-w-md w-full bg-bg-1 border border-line rounded-[18px] p-8 text-center">
          <div
            className="w-[60px] h-[60px] rounded-full grid place-items-center mx-auto mb-4"
            style={{
              background:
                "radial-gradient(circle at 30% 30%, var(--ok) 0%, #1a6f4f 100%)",
              boxShadow: "0 0 0 1px var(--line-2), 0 8px 24px rgba(34,197,94,0.18)",
            }}
          >
            <CalendarCheck size={28} className="text-cream" />
          </div>
          <div className="display font-medium text-[24px] leading-tight mb-2">
            Demande envoyée
          </div>
          <div className="text-[13px] text-ink-3 mb-4">
            <strong className="text-ink-1">{restaurant.name}</strong> a bien reçu votre
            demande pour le <strong className="text-ink-1">{date}</strong> à{" "}
            <strong className="text-ink-1">{time}</strong>, table{" "}
            <strong className="text-ink-1">{success.tableLabel}</strong>.
          </div>
          <div className="text-[12px] text-ink-4 italic">
            Vous serez recontacté par le restaurant pour confirmer la réservation.
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg-0 text-ink-1">
      <section className="relative pt-10 pb-6 px-6 max-w-[520px] mx-auto">
        <div
          className="absolute inset-x-0 top-0 h-[260px] -z-10 opacity-90"
          style={{
            background:
              "radial-gradient(ellipse 60% 80% at 50% 0%, rgba(232,115,58,0.18), transparent 70%)",
          }}
        />
        <div className="flex flex-col items-center text-center gap-3">
          {restaurant.logo_url ? (
            <img
              src={restaurant.logo_url}
              alt={restaurant.name}
              className="w-[64px] h-[64px] rounded-[16px] object-cover border border-line-2"
            />
          ) : (
            <div
              className="w-[64px] h-[64px] rounded-[16px] grid place-items-center text-cream font-bold text-[28px] display"
              style={{
                background:
                  "radial-gradient(circle at 30% 30%, var(--ember) 0%, var(--ember-deep) 60%, #5c2a0e 100%)",
              }}
            >
              {restaurant.name.trim().charAt(0).toUpperCase() || "•"}
            </div>
          )}
          <h1 className="display font-medium text-[24px] leading-tight m-0">
            {restaurant.name}
          </h1>
          <div className="text-[11px] text-ink-3 mono uppercase tracking-[0.18em]">
            Réservation en ligne
          </div>
        </div>
      </section>

      <section className="max-w-[520px] mx-auto px-4 pb-10">
        <div className="bg-bg-1 border border-line rounded-[14px] p-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="chip-uppercase block mb-[6px]">Date</label>
              <input
                type="date"
                value={date}
                min={todayIso()}
                max={maxIso()}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-bg-2 border border-line rounded-[10px] px-3 py-[10px] text-[14px] text-ink-1 outline-none focus:border-line-2 mono"
              />
            </div>
            <div>
              <label className="chip-uppercase block mb-[6px]">Couverts</label>
              <input
                type="number"
                min={1}
                max={20}
                value={covers}
                onChange={(e) => setCovers(Number(e.target.value) || 1)}
                className="w-full bg-bg-2 border border-line rounded-[10px] px-3 py-[10px] text-[14px] text-ink-1 outline-none focus:border-line-2 mono"
              />
            </div>
          </div>

          <div>
            <label className="chip-uppercase block mb-[6px]">Heure</label>
            <div className="grid grid-cols-4 gap-1">
              {SLOTS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setTime(s)}
                  className={cn(
                    "mono text-[12px] py-[8px] rounded-[8px] border transition-all",
                    time === s
                      ? "bg-ember/20 border-ember text-ember-soft"
                      : "bg-bg-2 border-line text-ink-3 hover:bg-bg-3"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="chip-uppercase block mb-[6px]">Votre nom</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Mme Dupont"
                className="w-full bg-bg-2 border border-line rounded-[10px] px-3 py-[10px] text-[14px] text-ink-1 outline-none focus:border-line-2"
              />
            </div>
            <div>
              <label className="chip-uppercase block mb-[6px]">Téléphone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="06 12 34 56 78"
                className="w-full bg-bg-2 border border-line rounded-[10px] px-3 py-[10px] text-[14px] text-ink-1 outline-none focus:border-line-2 mono"
              />
            </div>
            <div>
              <label className="chip-uppercase block mb-[6px]">Email · optionnel</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@email.com"
                className="w-full bg-bg-2 border border-line rounded-[10px] px-3 py-[10px] text-[14px] text-ink-1 outline-none focus:border-line-2"
              />
            </div>
            <div>
              <label className="chip-uppercase block mb-[6px]">
                Note · demandes spéciales
              </label>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Allergies, anniversaire, terrasse si possible…"
                className="w-full bg-bg-2 border border-line rounded-[10px] px-3 py-[10px] text-[14px] text-ink-1 outline-none focus:border-line-2 resize-none"
              />
            </div>
          </div>

          {fitting.length === 0 && (
            <div className="text-[12px] text-ember-soft inline-flex items-center gap-1">
              <AlertTriangle size={12} />
              Aucune table disponible pour {covers} couverts. Modifiez votre demande.
            </div>
          )}

          {error && (
            <div className="text-[12.5px] text-danger inline-flex items-center gap-1">
              <AlertTriangle size={12} />
              {error}
            </div>
          )}

          <button
            className="btn-primary inline-flex items-center justify-center gap-2 w-full py-[12px] text-[14px]"
            onClick={() => void submit()}
            disabled={submitting || fitting.length === 0}
          >
            <CalendarCheck size={14} />
            {submitting ? "Envoi…" : "Demander cette réservation"}
          </button>

          <div className="text-[10.5px] text-ink-4 leading-snug">
            Votre demande sera transmise au restaurant. Une confirmation vous sera
            envoyée après validation. Tables disponibles :{" "}
            {Array.from(new Set(fitting.map((t: PublicResaTable) => ZONE_LABEL[t.zone])))
              .join(" · ") || "—"}.
          </div>
        </div>
      </section>
    </main>
  );
}
