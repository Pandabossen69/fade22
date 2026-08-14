import { upcomingBookings, listStoredReviews } from "@/lib/db";
import { BookingsList } from "@/components/admin/bookings-list";
import { ReviewsAdmin } from "@/components/admin/reviews-admin";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [bookings, reviews] = await Promise.all([upcomingBookings(), listStoredReviews()]);
  return (
    <>
      <BookingsList bookings={bookings} />
      <ReviewsAdmin reviews={reviews} />
    </>
  );
}
