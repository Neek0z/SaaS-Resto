import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Mail, RefreshCw, Send, XCircle } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  fetchRecentLoyaltyEmails,
  processLoyaltyEmails,
  type LoyaltyEmailRow,
} from "@/lib/api/loyalty-emails";
import { useAuth } from "@/contexts/AuthContext";
import { extractErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";

const TYPE_LABEL: Record<LoyaltyEmailRow["type"], string> = {
  welcome: "Bienvenue",
  tier_up: "Palier",
  reward_redeemed: "Récompense",
};

const STATUS_LABEL: Record<LoyaltyEmailRow["status"], string> = {
  pending: "En attente",
  sending: "Envoi…",
  sent: "Envoyé",
  failed: "Échec",
};

const STATUS_COLOR: Record<LoyaltyEmailRow["status"], string> = {
  pending: "var(--ink-3)",
  sending: "var(--amber)",
  sent: "var(--ok)",
  failed: "var(--danger)",
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function LoyaltyEmailsPanel() {
  const { restaurant } = useAuth();
  const restaurantId = restaurant?.id ?? null;
  const [rows, setRows] = useState<LoyaltyEmailRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [draining, setDraining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRecentLoyaltyEmails(restaurantId);
      setRows(data);
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const counts = useMemo(() => {
    const c = { pending: 0, sent: 0, failed: 0 };
    for (const r of rows) {
      if (r.status === "pending" || r.status === "sending") c.pending++;
      else if (r.status === "sent") c.sent++;
      else if (r.status === "failed") c.failed++;
    }
    return c;
  }, [rows]);

  const drain = async () => {
    if (!restaurantId) return;
    setDraining(true);
    setError(null);
    setLastResult(null);
    try {
      const res = await processLoyaltyEmails(restaurantId);
      if (!res.ok) {
        setError(res.error ?? "Erreur lors de l'envoi.");
      } else {
        setLastResult(
          res.total === 0
            ? "Queue vide — rien à envoyer."
            : `${res.sent} envoyé(s)${res.failed ? ` · ${res.failed} échec(s)` : ""} sur ${res.total}.`
        );
      }
      await reload();
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setDraining(false);
    }
  };

  return (
    <Card className="col-span-12">
      <CardHeader>
        <CardTitle>Notifications email</CardTitle>
        <div className="flex items-center gap-2">
          <button
            className="btn-ghost inline-flex items-center gap-2 text-[12px]"
            onClick={() => void reload()}
            disabled={loading}
            type="button"
          >
            <RefreshCw size={12} className={cn(loading && "animate-spin")} />
            Actualiser
          </button>
          <button
            className="btn-primary inline-flex items-center gap-2 text-[12px]"
            onClick={() => void drain()}
            disabled={draining || counts.pending === 0}
            type="button"
            title={
              counts.pending === 0
                ? "Aucun email en attente"
                : `Envoyer les ${counts.pending} email(s) en attente`
            }
          >
            <Send size={12} />
            {draining ? "Envoi…" : `Envoyer (${counts.pending})`}
          </button>
        </div>
      </CardHeader>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <MiniStat label="En attente" value={counts.pending} tone="amber" />
        <MiniStat label="Envoyés (récents)" value={counts.sent} tone="ok" />
        <MiniStat label="Échecs (récents)" value={counts.failed} tone="danger" />
      </div>

      {error && (
        <div className="mb-3 p-3 rounded-[10px] border border-danger/40 bg-danger/10 text-danger text-[12px]">
          {error}
        </div>
      )}

      {lastResult && (
        <div className="mb-3 p-3 rounded-[10px] border border-ok/40 bg-ok/10 text-ok text-[12px]">
          {lastResult}
        </div>
      )}

      <div className="text-[11px] text-ink-4 mb-2 leading-snug">
        Emails transactionnels envoyés via Resend. Les triggers serveur remplissent
        cette queue automatiquement (bienvenue à l&apos;inscription, montée de palier,
        récompense réservée). Ce panneau permet d&apos;envoyer manuellement les emails
        en attente.
      </div>

      {rows.length === 0 ? (
        <div className="py-8 text-center text-[12.5px] text-ink-3 border border-line rounded-[10px] flex flex-col items-center gap-2">
          <Mail size={18} className="text-ink-4" />
          <span>Aucun email pour le moment.</span>
        </div>
      ) : (
        <div className="flex flex-col">
          {rows.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between gap-3 py-[10px] border-b border-line last:border-b-0"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span
                  className="w-[26px] h-[26px] rounded-full grid place-items-center shrink-0"
                  style={{
                    color: STATUS_COLOR[r.status],
                    background: `${STATUS_COLOR[r.status]}15`,
                  }}
                >
                  {r.status === "sent" ? (
                    <CheckCircle2 size={13} />
                  ) : r.status === "failed" ? (
                    <XCircle size={13} />
                  ) : (
                    <Mail size={13} />
                  )}
                </span>
                <div className="min-w-0">
                  <div className="text-[13px] truncate">
                    <span className="font-semibold">{TYPE_LABEL[r.type]}</span>
                    <span className="text-ink-3"> · {r.toEmail}</span>
                  </div>
                  <div className="text-[10.5px] text-ink-4 mono">
                    {formatTime(r.createdAt)}
                    {r.lastError ? ` · ${r.lastError.slice(0, 60)}` : ""}
                  </div>
                </div>
              </div>
              <span
                className="shrink-0 text-[10.5px] mono uppercase tracking-[0.06em] px-2 py-[3px] rounded-full"
                style={{
                  color: STATUS_COLOR[r.status],
                  background: `${STATUS_COLOR[r.status]}10`,
                  border: `1px solid ${STATUS_COLOR[r.status]}33`,
                }}
              >
                {STATUS_LABEL[r.status]}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "ok" | "amber" | "danger";
}) {
  const color =
    tone === "ok"
      ? "var(--ok)"
      : tone === "amber"
      ? "var(--amber)"
      : "var(--danger)";
  return (
    <div className="p-3 bg-bg-2 border border-line rounded-[10px]">
      <div className="text-[10px] text-ink-4 mono uppercase tracking-[0.06em]">
        {label}
      </div>
      <div
        className="display text-[22px] font-medium leading-tight mt-[4px]"
        style={{ color: value > 0 ? color : "var(--ink-3)" }}
      >
        {value}
      </div>
    </div>
  );
}
