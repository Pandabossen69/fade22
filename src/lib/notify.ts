import type { Booking } from "./types";
import { getService } from "./services";
import { formatPhoneDisplay } from "./validation";

export async function notifyNewBooking(b: Booking): Promise<void> {
  const topic = process.env.NOTIFY_NTFY_TOPIC;
  if (!topic) return;

  try {
    const service = getService(b.serviceId);
    const svc = service ? `${service.nameTh} / ${service.nameEn}` : b.serviceId;
    const phone = formatPhoneDisplay(b.phone);
    const note = b.notes?.trim() ? `\n${b.notes.trim()}` : "";
    await fetch("https://ntfy.sh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic,
        title: "A DAY CUTZ  จองคิวใหม่",
        message: `${b.name}\n${phone}\n${svc}\n${b.date}  ${b.time}${note}`,
        priority: 4,
        tags: ["scissors"],
      }),
    });
  } catch {
    /* never fail the booking */
  }
}
