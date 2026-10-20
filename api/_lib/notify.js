// Notis till barberarens telefon när någon bokar eller avbokar. Gratis via ntfy.sh (appen "ntfy", prenumerera på ämnet).
// Ämnet sätts i miljövariabeln NOTIFY_NTFY_TOPIC. Saknas det skickas inget, och bokningen fungerar ändå.
import { getService } from './shop.js';
import { formatPhone } from './http.js';

export function notifyTopic() {
  const t = process.env.NOTIFY_NTFY_TOPIC || '';
  return /^[\w-]{1,64}$/.test(t) ? t : '';
}

export async function notify(kind, b) {
  const topic = notifyTopic();
  if (!topic) return;
  const svc = getService(b.serviceId);
  const [, mo, d] = b.date.split('-');
  const title = kind === 'cancel' ? `ยกเลิกคิว · ${b.name}` : `คิวใหม่ · ${b.name}`;
  const message = [`${d}/${mo} ${b.time}`, svc ? `${svc.th} ฿${svc.price}` : '', formatPhone(b.phone), b.notes || ''].filter(Boolean).join('\n');
  try {
    await fetch('https://ntfy.sh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, title, message, priority: kind === 'cancel' ? 3 : 4, tags: [kind === 'cancel' ? 'x' : 'barber'] }),
      signal: AbortSignal.timeout(4000),
    });
  } catch { /* en notis får aldrig stoppa bokningen */ }
}
