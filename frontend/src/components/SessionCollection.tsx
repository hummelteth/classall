import { useState } from "react";
import { useDemo } from "../lib/demo";
import { SessionCard } from "./SessionCard";
import type { Booking, Session } from "../lib/types";
import BookingDialog from "./BookingDialog";

export function SessionCollection({
  sessions,
  bookings,
  limit,
}: {
  sessions: Session[];
  bookings: Booking[];
  limit?: number;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const { user } = useDemo();
  const isBooked = (id: number) =>
    bookings.some((b) => b.session.id === id && b.status === "confirmed");
  return (
    <>
      <div className="session-grid">
        {sessions.slice(0, limit).map((s) => (
          <SessionCard
            key={s.id}
            session={s}
            booked={isBooked(s.id)}
            onSelect={(s) => setSelected(s.id)}
          />
        ))}
      </div>
      {selected !== null && (
        <BookingDialog
          key={`${selected}-${user.id}`}
          sessionId={selected}
          booked={isBooked(selected)}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
