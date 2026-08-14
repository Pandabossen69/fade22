import { allBookings, listStoredReviews } from "@/lib/db";
import { BookingsList } from "@/components/admin/bookings-list";
import { ReviewsAdmin } from "@/components/admin/reviews-admin";
import { NotifySetup } from "@/components/admin/notify-setup";
import { AdminGuide } from "@/components/admin/admin-guide";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const topic = process.env.NOTIFY_NTFY_TOPIC;
  const [bookings, reviews] = await Promise.all([allBookings(), listStoredReviews()]);
  return (
    <>
      {topic ? <NotifySetup topic={topic} /> : null}
      <AdminGuide />
      <BookingsList bookings={bookings} />
      <ReviewsAdmin reviews={reviews} />
    </>
  );
}
