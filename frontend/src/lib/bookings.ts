import { useDemo } from "./demo";
import { upcoming, useRemote } from "./api";
import type { Booking } from "./types";

export function useBookings() {
  const { user, version } = useDemo();
  return useRemote<Booking[]>("/bookings", user.id, version);
}

export const activeBooking = (b: Booking) =>
  b.status === "confirmed" &&
  b.session.status === "upcoming" &&
  upcoming(b.session.starts_at);
