import type { Booking } from "./types";
import { getService } from "./services";
import { formatPhoneDisplay } from "./validation";

export async function notifyNewBooking(b: Booking): Promise<void> {
  const topic = process.env.NOTIFY_NTFY_TOPIC;
  if (!topic) return;

  try {
    const service = getService(b.serviceId);
    const svc = service?.nameTh ?? b.serviceId;
    const phone = formatPhoneDisplay(b.phone);
    await fetch(`https://ntfy.sh/${encodeURIComponent(topic)}`, {
      method: "POST",
      headers: {
        Title: "A DAY CUTZ · จองคิวใหม่",
        Priority: "high",
      },
      body: `${b.name}  ${phone}\n${svc}  ${b.date}  ${b.time}`,
    });
  } catch {
    /* never fail the booking */
  }
}
