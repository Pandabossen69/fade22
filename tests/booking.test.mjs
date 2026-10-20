// npm test: bokningslogiken mot en tillfällig lokal fil (ingen Vercel Blob behövs).
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let api, cancel, admin, login, slots;
before(async () => {
  delete process.env.VERCEL;
  delete process.env.BLOB_READ_WRITE_TOKEN;
  delete process.env.NOTIFY_NTFY_TOPIC;
  process.env.ADMIN_PASSWORD = 'test-losen-123';
  process.chdir(mkdtempSync(join(tmpdir(), 'adc-')));
  api = await import('../api/bookings.js');
  cancel = await import('../api/cancel.js');
  admin = await import('../api/admin/bookings.js');
  login = await import('../api/admin/login.js');
  slots = await import('../api/_lib/slots.js');
});

const BASE = 'http://localhost';
let ip = 0;
const post = (path, body, headers = {}) => new Request(BASE + path, {
  method: 'POST', body: JSON.stringify(body),
  headers: { 'content-type': 'application/json', 'x-forwarded-for': `10.0.0.${++ip}`, ...headers },
});
const tomorrow = () => slots.addDays(slots.bangkokNow().date, 1);

test('öppettiderna ger 24 starttider 09:00–20:30', () => {
  const s = slots.daySlots();
  assert.equal(s.length, 24);
  assert.equal(s[0], '09:00');
  assert.equal(s.at(-1), '20:30');
});

test('passerade tider idag visas inte, datum utanför 14 dagar avvisas', () => {
  const noon = Date.parse('2026-10-20T05:00:00Z'); // 12:00 i Bangkok
  const list = slots.listStarts('thai', '2026-10-20', new Set(), noon);
  assert.equal(list[0].time, '12:30');
  assert.equal(slots.listStarts('thai', '2026-11-30', new Set(), noon).length, 0);
  assert.equal(slots.listStarts('thai', '2026-10-19', new Set(), noon).length, 0);
});

test('bokning, dubbelbokning och avbokning', async () => {
  const date = tomorrow();
  const body = { serviceId: 'thai', date, time: '10:00', name: 'Somchai', phone: '081-234-5678', notes: 'รองทรงต่ำ' };

  const bad = await api.POST(post('/api/bookings', { ...body, phone: '12345' }));
  assert.equal(bad.status, 400);

  const ok = await api.POST(post('/api/bookings', body));
  assert.equal(ok.status, 200);
  const { ref } = await ok.json();
  assert.match(ref, /^[0-9a-f-]{36}\.[\w-]+$/);

  const dup = await api.POST(post('/api/bookings', { ...body, name: 'Tom', phone: '0898765432' }));
  assert.equal(dup.status, 409);

  const day = await (await api.GET(new Request(`${BASE}/api/bookings?service=thai&date=${date}`))).json();
  assert.equal(day.slots.find((s) => s.time === '10:00').free, false);
  assert.equal(day.slots.find((s) => s.time === '10:30').free, true);

  const wrong = await cancel.POST(post('/api/cancel', { ref: ref.split('.')[0] + '.fel-nyckel-som-inte-stammer', action: 'cancel' }));
  assert.equal(wrong.status, 404);

  const view = await (await cancel.POST(post('/api/cancel', { ref, action: 'view' }))).json();
  assert.equal(view.booking.time, '10:00');
  assert.equal(view.cancellable, true);

  const del = await cancel.POST(post('/api/cancel', { ref, action: 'cancel' }));
  assert.equal(del.status, 200);
  const again = await api.POST(post('/api/bookings', { ...body, name: 'Tom', phone: '0898765432' }));
  assert.equal(again.status, 200);
});

test('honungsfällan sparar ingenting', async () => {
  const date = tomorrow();
  const r = await api.POST(post('/api/bookings', { serviceId: 'kids', date, time: '15:00', name: 'Bot', phone: '0811111111', website: 'spam.example' }));
  assert.equal(r.status, 200);
  const day = await (await api.GET(new Request(`${BASE}/api/bookings?service=kids&date=${date}`))).json();
  assert.equal(day.slots.find((s) => s.time === '15:00').free, true);
});

test('annan sajt kan inte posta (Origin-kontroll)', async () => {
  const r = await api.POST(post('/api/bookings', { serviceId: 'thai', date: tomorrow(), time: '11:00', name: 'X Y', phone: '0811111111' }, { origin: 'https://evil.example' }));
  assert.equal(r.status, 400);
});

test('butikens vy kräver inloggning; stängda tider blir upptagna', async () => {
  assert.equal((await admin.GET(new Request(`${BASE}/api/admin/bookings`))).status, 401);
  assert.equal((await login.POST(post('/api/admin/login', { password: 'fel' }))).status, 401);
  const res = await login.POST(post('/api/admin/login', { password: 'test-losen-123' }));
  assert.equal(res.status, 200);
  const cookie = res.headers.get('set-cookie').split(';')[0];
  assert.match(res.headers.get('set-cookie'), /HttpOnly; SameSite=Strict/);

  const date = tomorrow();
  const block = await admin.POST(post('/api/admin/bookings', { date, from: '12:00', to: '13:00', note: 'พักกลางวัน' }, { cookie }));
  assert.equal(block.status, 200);
  const day = await (await api.GET(new Request(`${BASE}/api/bookings?service=thai&date=${date}`))).json();
  assert.deepEqual(day.slots.filter((s) => !s.free).map((s) => s.time), ['10:00', '12:00', '12:30']);

  const list = await (await admin.GET(new Request(`${BASE}/api/admin/bookings`, { headers: { cookie } }))).json();
  assert.equal(list.bookings.length, 2);
  assert.ok(list.bookings.every((b) => !('cancelHash' in b)), 'avbokningsnyckeln skickas aldrig ut');

  const forged = cookie.replace(/\.[^.]+$/, '.forfalskad');
  assert.equal((await admin.GET(new Request(`${BASE}/api/admin/bookings`, { headers: { cookie: forged } }))).status, 401);
});
