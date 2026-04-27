export type OrderStatus = "pending" | "preparing" | "served" | "cancelled";
export type OrderChannel = "salle" | "cc" | "delivery";
export type OrderPriority = "high" | "normal";

export type Order = {
  id: string;
  restaurantId: string;
  displayId: string;
  table: string;
  covers: number;
  items: string[];
  total: number;
  status: OrderStatus;
  channel: OrderChannel;
  waiter: string;
  priority: OrderPriority;
  pickup: string;
  note: string;
  loyaltyCustomerId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NewOrder = {
  displayId?: string;
  table: string;
  covers: number;
  items: string[];
  total: number;
  status?: OrderStatus;
  channel?: OrderChannel;
  waiter?: string;
  priority?: OrderPriority;
  pickup?: string;
  note?: string;
  loyaltyCustomerId?: string | null;
};

export type OrderPatch = Partial<
  Omit<Order, "id" | "restaurantId" | "createdAt" | "updatedAt">
>;
