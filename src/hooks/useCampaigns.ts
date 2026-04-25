import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  createCampaign,
  createRecipients,
  deleteCampaign,
  fetchCampaigns,
  fetchRecipients,
  sendCampaign,
  updateCampaign,
} from "@/lib/api/campaigns-db";
import type {
  Campaign,
  CampaignPayload,
  CampaignRecipient,
} from "@/lib/crm-types";

export function useCampaigns() {
  const { restaurant } = useAuth();
  const restaurantId = restaurant?.id ?? null;

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const reload = useCallback(async () => {
    if (!restaurantId) {
      setCampaigns([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await fetchCampaigns(restaurantId);
      setCampaigns(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec du chargement.");
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const addCampaign = useCallback(
    async (payload: CampaignPayload): Promise<Campaign | null> => {
      if (!restaurantId) return null;
      try {
        const created = await createCampaign(restaurantId, payload);
        setCampaigns((prev) => [created, ...prev]);
        return created;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Échec de la création.");
        return null;
      }
    },
    [restaurantId]
  );

  const editCampaign = useCallback(
    async (id: string, payload: CampaignPayload): Promise<void> => {
      const before = campaigns;
      setCampaigns((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...payload } : c))
      );
      try {
        await updateCampaign(id, payload);
      } catch (e) {
        setCampaigns(before);
        setError(e instanceof Error ? e.message : "Échec de la mise à jour.");
      }
    },
    [campaigns]
  );

  const removeCampaign = useCallback(
    async (id: string): Promise<void> => {
      const before = campaigns;
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
      try {
        await deleteCampaign(id);
      } catch (e) {
        setCampaigns(before);
        setError(e instanceof Error ? e.message : "Échec de la suppression.");
      }
    },
    [campaigns]
  );

  const send = useCallback(
    async (
      campaignId: string,
      recipients: { customerId: string | null; email: string }[]
    ): Promise<{ ok: boolean; sent: number; failed: number; total: number } | null> => {
      if (!restaurantId) return null;
      setSending(true);
      setError(null);
      try {
        await createRecipients(campaignId, recipients);
        const result = await sendCampaign(campaignId, restaurantId);
        await reload();
        return result;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Échec de l'envoi.");
        return null;
      } finally {
        setSending(false);
      }
    },
    [restaurantId, reload]
  );

  return {
    campaigns,
    loading,
    error,
    sending,
    reload,
    addCampaign,
    editCampaign,
    removeCampaign,
    send,
    clearError: () => setError(null),
  };
}

export function useCampaignRecipients(campaignId: string | null) {
  const [recipients, setRecipients] = useState<CampaignRecipient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!campaignId) {
      setRecipients([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await fetchRecipients(campaignId);
      setRecipients(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec du chargement.");
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { recipients, loading, error, reload };
}
