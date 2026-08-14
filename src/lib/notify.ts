import type { Booking } from "./types";
import { getService } from "./services";
import { formatPhoneDisplay } from "./validation";

export async function notifyNewBooking(b: Booking): Promise<void> {
  const topic = process.env.NOTIFY_NTFY_TOPIC;
  if (!topic) return;

  try {
    const service = getService(b.serviceId);
    const svc = service?.nameTh ?? b.serviceId;
    const price = service ? `${service.priceThb} THB` : "";
    const phone = formatPhoneDisplay(b.phone);
    const [, mo, d] = b.date.split("-");
    const when = `${d}/${mo} ${b.time}`;
    await fetch("https://ntfy.sh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic,
        title: b.name,
        message: `${phone}\n${svc}\n${price}\n${when}`,
        priority: 4,
      }),
      signal: AbortSignal.timeout(4000),
    });
  } catch {
    /* never fail the booking */
  }
}
