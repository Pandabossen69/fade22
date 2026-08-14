import { upcomingBookings } from "@/lib/db";
import { BookingsList } from "@/components/admin/bookings-list";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const bookings = await upcomingBookings();
  return <BookingsList bookings={bookings} />;
}
