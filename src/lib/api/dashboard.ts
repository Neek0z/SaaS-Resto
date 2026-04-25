import { supabase } from "@/lib/supabase";

export type DashboardKpis = {
  revenue: {
    today: number;
    todayDelta: number;
    week: number;
    weekDelta: number;
    month: number;
    monthDelta: number;
  };
  covers: { value: number; delta: number; goal: number };
  avgTicket: { value: number; delta: number };
  occupancy: { value: number; delta: number; tables: { occupied: number; total: number } };
};

export type RevenueDay = { day: string; date: string; lunch: number; dinner: number };
export type CoverSlot = { t: string; v: number };

export type DashboardData = {
  kpis: DashboardKpis;
  revenue7d: RevenueDay[];
  coversBySlot: CoverSlot[];
};

const DAY_LABELS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const COVERS_GOAL = 160;
const TABLES_TOTAL = 28;
const LUNCH_END_HOUR = 17;

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function shiftDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function pctDelta(curr: number, prev: number): number {
  if (prev === 0) return curr === 0 ? 0 : 100;
  return Math.round(((curr - prev) / prev) * 1000) / 10;
}

type OrderRow = {
  total: number | string;
  status: string;
  channel: string;
  covers: number;
  table_label: string;
  created_at: string;
};

type ReservationRow = {
  reservation_date: string;
  reservation_time: string;
  covers: number;
  status: string;
  table_label: string;
};

export async function fetchDashboardData(): Promise<DashboardData> {
  if (!supabase) throw new Error("Supabase non configuré.");

  const now = new Date();
  const today = startOfDay(now);
  const todayISO = isoDate(today);
  const start7 = shiftDays(today, -6);
  const start30 = shiftDays(today, -29);
  const startPrev30 = shiftDays(today, -59);
  const startPrev7 = shiftDays(today, -13);
  const yesterday = shiftDays(today, -1);

  const [ordersRes, reservationsRes] = await Promise.all([
    supabase
      .from("orders")
      .select("total, status, channel, covers, table_label, created_at")
      .gte("created_at", startPrev30.toISOString()),
    supabase
      .from("reservations")
      .select("reservation_date, reservation_time, covers, status, table_label")
      .eq("reservation_date", todayISO),
  ]);

  if (ordersRes.error) throw ordersRes.error;
  if (reservationsRes.error) throw reservationsRes.error;

  const orders = (ordersRes.data ?? []) as OrderRow[];
  const reservations = (reservationsRes.data ?? []) as ReservationRow[];

  const ordersValid = orders.filter((o) => o.status !== "cancelled");
  const totalOf = (o: OrderRow) => (typeof o.total === "string" ? Number(o.total) : o.total);

  const inDay = (o: OrderRow, d: Date) => {
    const t = new Date(o.created_at).getTime();
    return t >= d.getTime() && t < shiftDays(d, 1).getTime();
  };
  const inRange = (o: OrderRow, start: Date, endExclusive: Date) => {
    const t = new Date(o.created_at).getTime();
    return t >= start.getTime() && t < endExclusive.getTime();
  };

  const sumIn = (start: Date, endExclusive: Date) =>
    ordersValid
      .filter((o) => inRange(o, start, endExclusive))
      .reduce((s, o) => s + totalOf(o), 0);

  const revToday = sumIn(today, shiftDays(today, 1));
  const revYesterday = sumIn(yesterday, today);
  const revWeek = sumIn(start7, shiftDays(today, 1));
  const revPrevWeek = sumIn(startPrev7, start7);
  const revMonth = sumIn(start30, shiftDays(today, 1));
  const revPrevMonth = sumIn(startPrev30, start30);

  const ordersToday = ordersValid.filter((o) => inDay(o, today));
  const ordersYesterday = ordersValid.filter((o) => inDay(o, yesterday));

  const avgTicketToday = ordersToday.length > 0 ? revToday / ordersToday.length : 0;
  const avgTicketYesterday =
    ordersYesterday.length > 0 ? revYesterday / ordersYesterday.length : 0;

  const coversToday = reservations
    .filter((r) => r.status !== "noshow")
    .reduce((s, r) => s + r.covers, 0);

  const tablesOccupied = new Set(
    reservations
      .filter((r) => r.status === "seated" || r.status === "confirmed")
      .map((r) => r.table_label)
  ).size;

  const occupancyValue = Math.round((tablesOccupied / TABLES_TOTAL) * 100);

  const kpis: DashboardKpis = {
    revenue: {
      today: revToday,
      todayDelta: pctDelta(revToday, revYesterday),
      week: revWeek,
      weekDelta: pctDelta(revWeek, revPrevWeek),
      month: revMonth,
      monthDelta: pctDelta(revMonth, revPrevMonth),
    },
    covers: { value: coversToday, delta: 0, goal: COVERS_GOAL },
    avgTicket: {
      value: Math.round(avgTicketToday * 10) / 10,
      delta: pctDelta(avgTicketToday, avgTicketYesterday),
    },
    occupancy: {
      value: occupancyValue,
      delta: 0,
      tables: { occupied: tablesOccupied, total: TABLES_TOTAL },
    },
  };

  const revenue7d: RevenueDay[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = shiftDays(today, -i);
    const dayOrders = ordersValid.filter((o) => inDay(o, d));
    let lunch = 0;
    let dinner = 0;
    for (const o of dayOrders) {
      const t = totalOf(o);
      const hour = new Date(o.created_at).getHours();
      if (hour < LUNCH_END_HOUR) lunch += t;
      else dinner += t;
    }
    revenue7d.push({
      day: DAY_LABELS[d.getDay()],
      date: isoDate(d),
      lunch: Math.round(lunch),
      dinner: Math.round(dinner),
    });
  }

  const slotMap = new Map<string, number>();
  for (const r of reservations) {
    if (r.status === "noshow") continue;
    const [h, m] = r.reservation_time.split(":").map(Number);
    const slotMin = m < 30 ? 0 : 30;
    const slot = `${String(h).padStart(2, "0")}:${slotMin === 0 ? "00" : "30"}`;
    slotMap.set(slot, (slotMap.get(slot) ?? 0) + r.covers);
  }
  const coversBySlot: CoverSlot[] = Array.from(slotMap.entries())
    .map(([t, v]) => ({ t, v }))
    .sort((a, b) => a.t.localeCompare(b.t));

  return { kpis, revenue7d, coversBySlot };
}
