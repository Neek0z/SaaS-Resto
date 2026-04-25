export type ResaStatus = "pending" | "seated" | "confirmed" | "noshow";

export type Reservation = {
  id: string;
  restaurantId: string;
  date: string;            // ISO yyyy-mm-dd
  time: string;            // "HH:mm"
  name: string;
  covers: number;
  table: string;
  status: ResaStatus;
  note: string;
  phone: string;
  email: string;
  durationMinutes: number;
  source: string;
  createdAt: string;
  updatedAt: string;
};

export type NewReservation = {
  date?: string;
  time: string;
  name: string;
  covers: number;
  table: string;
  status?: ResaStatus;
  note?: string;
  phone?: string;
  email?: string;
  durationMinutes?: number;
  source?: string;
};

export type ReservationPatch = Partial<
  Omit<Reservation, "id" | "restaurantId" | "createdAt" | "updatedAt">
>;
