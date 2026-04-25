import { supabase } from "@/lib/supabase";
import type {
  Customer,
  CustomerPayload,
  CustomerSource,
} from "@/lib/crm-types";

type CustomerRow = {
  id: string;
  restaurant_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  source: CustomerSource;
  tags: string[];
  visit_count: number;
  total_spent: number | string;
  last_visit: string | null;
  opted_in_email: boolean;
  opted_in_sms: boolean;
  notes: string | null;
  loyalty_customer_id: string | null;
  created_at: string;
  updated_at: string;
};

function mapCustomer(r: CustomerRow): Customer {
  return {
    id: r.id,
    restaurantId: r.restaurant_id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    source: r.source,
    tags: r.tags ?? [],
    visitCount: r.visit_count,
    totalSpent:
      typeof r.total_spent === "string" ? Number(r.total_spent) : r.total_spent,
    lastVisit: r.last_visit,
    optedInEmail: r.opted_in_email,
    optedInSms: r.opted_in_sms,
    notes: r.notes,
    loyaltyCustomerId: r.loyalty_customer_id,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function payloadToRow(p: CustomerPayload) {
  return {
    name: p.name,
    email: p.email,
    phone: p.phone,
    source: p.source,
    tags: p.tags,
    notes: p.notes,
    opted_in_email: p.optedInEmail,
    opted_in_sms: p.optedInSms,
  };
}

function requireClient() {
  if (!supabase) throw new Error("Supabase non configuré.");
  return supabase;
}

// =============================================================
// CRUD
// =============================================================

export type CustomerListPage = {
  rows: Customer[];
  total: number;
};

export type CustomerListParams = {
  search?: string;
  source?: CustomerSource | "all";
  optedInOnly?: boolean;
  page?: number;
  pageSize?: number;
};

export async function fetchCustomersPage(
  restaurantId: string,
  params: CustomerListParams = {}
): Promise<CustomerListPage> {
  const sb = requireClient();
  const page = Math.max(0, params.page ?? 0);
  const pageSize = params.pageSize ?? 50;
  const from = page * pageSize;
  const to = from + pageSize - 1;

  let q = sb
    .from("customers")
    .select("*", { count: "exact" })
    .eq("restaurant_id", restaurantId);

  if (params.source && params.source !== "all") {
    q = q.eq("source", params.source);
  }
  if (params.optedInOnly) {
    q = q.eq("opted_in_email", true);
  }
  if (params.search && params.search.trim()) {
    const s = params.search.trim().replace(/[%,]/g, " ");
    q = q.or(`name.ilike.%${s}%,email.ilike.%${s}%,phone.ilike.%${s}%`);
  }

  q = q.order("created_at", { ascending: false }).range(from, to);

  const { data, error, count } = await q;
  if (error) throw error;
  return {
    rows: (data as CustomerRow[]).map(mapCustomer),
    total: count ?? 0,
  };
}

export async function fetchAllCustomers(
  restaurantId: string
): Promise<Customer[]> {
  const sb = requireClient();
  const { data, error } = await sb
    .from("customers")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as CustomerRow[]).map(mapCustomer);
}

export async function fetchOptedInCustomers(
  restaurantId: string
): Promise<Customer[]> {
  const sb = requireClient();
  const { data, error } = await sb
    .from("customers")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .eq("opted_in_email", true)
    .not("email", "is", null);
  if (error) throw error;
  return (data as CustomerRow[]).map(mapCustomer);
}

export async function createCustomer(
  restaurantId: string,
  payload: CustomerPayload
): Promise<Customer> {
  const sb = requireClient();
  const { data, error } = await sb
    .from("customers")
    .insert({ restaurant_id: restaurantId, ...payloadToRow(payload) })
    .select("*")
    .single();
  if (error) throw error;
  return mapCustomer(data as CustomerRow);
}

export async function updateCustomer(
  id: string,
  payload: CustomerPayload
): Promise<void> {
  const sb = requireClient();
  const { error } = await sb
    .from("customers")
    .update(payloadToRow(payload))
    .eq("id", id);
  if (error) throw error;
}

export async function toggleCustomerOptIn(
  id: string,
  channel: "email" | "sms",
  value: boolean
): Promise<void> {
  const sb = requireClient();
  const patch =
    channel === "email" ? { opted_in_email: value } : { opted_in_sms: value };
  const { error } = await sb.from("customers").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteCustomer(id: string): Promise<void> {
  const sb = requireClient();
  const { error } = await sb.from("customers").delete().eq("id", id);
  if (error) throw error;
}

// =============================================================
// Import CSV (dédup par email)
// =============================================================
export type ImportRow = {
  name: string;
  email: string | null;
  phone: string | null;
  tags: string[];
};

export type ImportReport = {
  inserted: number;
  updated: number;
  skipped: number;
};

export async function importCustomers(
  restaurantId: string,
  rows: ImportRow[],
  source: CustomerSource = "manual"
): Promise<ImportReport> {
  const sb = requireClient();
  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  // Récupère les emails existants pour ce restaurant
  const emails = rows
    .map((r) => r.email?.trim().toLowerCase())
    .filter((e): e is string => Boolean(e));
  const existingMap = new Map<string, string>();
  if (emails.length > 0) {
    const { data: existing } = await sb
      .from("customers")
      .select("id, email")
      .eq("restaurant_id", restaurantId)
      .in("email", emails);
    for (const row of (existing ?? []) as { id: string; email: string }[]) {
      existingMap.set(row.email.toLowerCase(), row.id);
    }
  }

  for (const r of rows) {
    if (!r.name || !r.name.trim()) {
      skipped++;
      continue;
    }
    const emailKey = r.email?.trim().toLowerCase() ?? null;
    const existingId = emailKey ? existingMap.get(emailKey) : null;
    try {
      if (existingId) {
        const { error } = await sb
          .from("customers")
          .update({
            name: r.name.trim(),
            phone: r.phone,
            tags: r.tags,
          })
          .eq("id", existingId);
        if (error) throw error;
        updated++;
      } else {
        const { error } = await sb.from("customers").insert({
          restaurant_id: restaurantId,
          name: r.name.trim(),
          email: r.email?.trim() ?? null,
          phone: r.phone,
          source,
          tags: r.tags,
          opted_in_email: true,
          opted_in_sms: false,
        });
        if (error) throw error;
        inserted++;
      }
    } catch {
      skipped++;
    }
  }

  return { inserted, updated, skipped };
}

// =============================================================
// Export CSV
// =============================================================
export function customersToCSV(rows: Customer[]): string {
  const headers = [
    "name",
    "email",
    "phone",
    "source",
    "tags",
    "visit_count",
    "total_spent",
    "last_visit",
    "opted_in_email",
    "opted_in_sms",
    "created_at",
  ];
  const escape = (v: unknown): string => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(",")];
  for (const c of rows) {
    lines.push(
      [
        escape(c.name),
        escape(c.email ?? ""),
        escape(c.phone ?? ""),
        escape(c.source),
        escape((c.tags ?? []).join("|")),
        escape(c.visitCount),
        escape(c.totalSpent),
        escape(c.lastVisit ?? ""),
        escape(c.optedInEmail),
        escape(c.optedInSms),
        escape(c.createdAt),
      ].join(",")
    );
  }
  return lines.join("\n");
}

// =============================================================
// Tags : récupère la liste agrégée des tags utilisés
// =============================================================
export async function fetchAllTags(restaurantId: string): Promise<string[]> {
  const sb = requireClient();
  const { data, error } = await sb
    .from("customers")
    .select("tags")
    .eq("restaurant_id", restaurantId);
  if (error) throw error;
  const set = new Set<string>();
  for (const row of (data ?? []) as { tags: string[] | null }[]) {
    for (const t of row.tags ?? []) set.add(t);
  }
  return Array.from(set).sort();
}
