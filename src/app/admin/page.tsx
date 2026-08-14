import { upcomingBookings, listStoredReviews } from "@/lib/db";
import { BookingsList } from "@/components/admin/bookings-list";
import { ReviewsAdmin } from "@/components/admin/reviews-admin";
import { NotifySetup } from "@/components/admin/notify-setup";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const topic = process.env.NOTIFY_NTFY_TOPIC;
  const [bookings, reviews] = await Promise.all([upcomingBookings(), listStoredReviews()]);
  return (
    <>
      {topic ? <NotifySetup topic={topic} /> : null}
      <BookingsList bookings={bookings} />
      <ReviewsAdmin reviews={reviews} />
    </>
  );
}
