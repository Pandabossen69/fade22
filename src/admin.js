// Butikens vy: dagens och kommande kunder, stänga tider, ta bort bokningar. Byggd för en telefon i handen mellan två klippningar.
(function () {
  'use strict';
  var d = document;
  var $ = function (s, el) { return (el || d).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || d).querySelectorAll(s)); };
  var SHOP = JSON.parse(d.body.getAttribute('data-shop'));
  var login = $('[data-login]');
  var app = $('[data-app]');
  var list = $('[data-list]');
  var daysEl = $('[data-adm-days]');
  var data = { bookings: [], now: null, notify: null };
  var selected = null;

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function toMin(hm) { var p = hm.split(':'); return +p[0] * 60 + +p[1]; }
  function addDays(date, n) { var t = new Date(Date.parse(date + 'T00:00:00Z') + n * 86400000); return t.getUTCFullYear() + '-' + pad(t.getUTCMonth() + 1) + '-' + pad(t.getUTCDate()); }
  function fmt(date, o) { return new Intl.DateTimeFormat('th-TH', Object.assign({ timeZone: 'UTC' }, o)).format(new Date(Date.parse(date + 'T00:00:00Z'))); }
  function svc(id) { return SHOP.services.filter(function (s) { return s.id === id; })[0]; }
  function phoneFmt(p) { return p && p.length === 10 ? p.slice(0, 3) + '-' + p.slice(3, 6) + '-' + p.slice(6) : p || ''; }
  function el(tag, cls, text) { var e = d.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function req(method, url, body) {
    return fetch(url, { method: method, headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { j._status = r.status; return j; }); });
  }

  function load() {
    return req('GET', '/api/admin/bookings').then(function (j) {
      if (j._status === 401) { app.hidden = true; login.hidden = false; $('[data-logout]').hidden = true; return; }
      if (!j.bookings) throw new Error('load');
      data = j;
      login.hidden = true;
      app.hidden = false;
      $('[data-logout]').hidden = false;
      if (!selected || selected < data.now.date) selected = data.now.date;
      render();
    });
  }

  function render() {
    var today = data.now.date;
    var cust = function (b) { return b.kind !== 'block'; };
    // Huvud: antal idag + nästa kund
    var todays = data.bookings.filter(function (b) { return b.date === today && cust(b); });
    $('[data-count]').textContent = todays.length;
    $('[data-today-label]').textContent = 'วันนี้ · ' + fmt(today, { weekday: 'short', day: 'numeric', month: 'short' });
    var next = data.bookings.filter(function (b) { return cust(b) && (b.date > today || (b.date === today && toMin(b.time) + 30 > data.now.min)); })[0];
    var nx = $('[data-next]');
    nx.textContent = '';
    nx.appendChild(el('p', '', 'ลูกค้าคนถัดไป · Next'));
    if (next) {
      nx.appendChild(el('p', 'big', (next.date === today ? '' : fmt(next.date, { weekday: 'short', day: 'numeric' }) + ' ') + next.time + ' · ' + next.name));
      var s = svc(next.serviceId);
      nx.appendChild(el('p', '', s ? s.name : ''));
    } else nx.appendChild(el('p', 'big', 'ยังไม่มีคิว'));

    // Dagväljare
    daysEl.textContent = '';
    for (var i = 0; i < SHOP.days; i++) {
      (function (date) {
        var n = data.bookings.filter(function (b) { return b.date === date && cust(b); }).length;
        var b = el('button', 'day');
        b.type = 'button';
        b.setAttribute('aria-pressed', String(date === selected));
        b.appendChild(el('small', '', i === 0 ? 'วันนี้' : fmt(date, { weekday: 'short' })));
        b.appendChild(el('b', '', fmt(date, { day: 'numeric' })));
        b.appendChild(el('i', '', n ? n + ' คิว' : '–'));
        b.addEventListener('click', function () { selected = date; render(); });
        daysEl.appendChild(b);
      })(addDays(today, i));
    }

    // Listan för vald dag
    list.textContent = '';
    var items = data.bookings.filter(function (b) { return b.date === selected; });
    if (!items.length) { list.appendChild(el('p', 'adm-empty', 'ไม่มีคิววันนี้ · No bookings')); return; }
    items.forEach(function (b) {
      var start = toMin(b.time);
      var end = toMin(b.slotStarts[b.slotStarts.length - 1]) + SHOP.slot;
      var isToday = b.date === today;
      var row = el('div', 'adm-item' + (b.kind === 'block' ? ' is-block' : '') + (isToday && end <= data.now.min ? ' is-past' : '') + (isToday && start <= data.now.min && end > data.now.min ? ' is-now' : ''));
      var t = el('span', 'adm-time', b.time);
      var who = el('div', 'adm-who');
      if (b.kind === 'block') {
        var last = b.slotStarts[b.slotStarts.length - 1];
        who.appendChild(el('b', '', 'ปิดคิว ' + b.time + '–' + pad(Math.floor((toMin(last) + SHOP.slot) / 60)) + ':' + pad((toMin(last) + SHOP.slot) % 60)));
        if (b.note) who.appendChild(el('span', '', b.note));
      } else {
        var s = svc(b.serviceId);
        who.appendChild(el('b', '', b.name));
        var line = el('span');
        var a = el('a', '', phoneFmt(b.phone));
        a.href = 'tel:' + b.phone;
        line.appendChild(a);
        line.appendChild(d.createTextNode(' · ' + (s ? s.name + ' ฿' + s.price : b.serviceId) + (b.lang === 'en' ? ' · EN' : '')));
        who.appendChild(line);
        if (b.notes) who.appendChild(el('span', '', '“' + b.notes + '”'));
      }
      var del = el('button', 'adm-del', 'ลบ');
      del.type = 'button';
      del.addEventListener('click', function () {
        var what = b.kind === 'block' ? 'เปิดคิวช่วงนี้อีกครั้ง?' : 'ลบคิวของ ' + b.name + ' ' + b.time + '? (ลูกค้าจะไม่ได้รับแจ้ง กรุณาโทรบอกลูกค้า)';
        if (!window.confirm(what)) return;
        del.disabled = true;
        req('DELETE', '/api/admin/bookings?id=' + encodeURIComponent(b.id)).then(load, function () { del.disabled = false; });
      });
      row.appendChild(t);
      row.appendChild(who);
      row.appendChild(del);
      list.appendChild(row);
    });
  }

  // Inloggning
  login.addEventListener('submit', function (e) {
    e.preventDefault();
    var err = $('[data-login-err]');
    err.hidden = true;
    req('POST', '/api/admin/login', { password: login.elements.password.value }).then(function (j) {
      if (j.ok) { login.elements.password.value = ''; return load(); }
      err.textContent = j.error === 'not_configured' ? 'ยังไม่ได้ตั้งรหัสผ่าน (ADMIN_PASSWORD ใน Vercel)' : j.error === 'rate' ? 'ลองหลายครั้งเกินไป รอ 15 นาที' : 'รหัสผ่านไม่ถูกต้อง';
      err.hidden = false;
    });
  });
  $('[data-logout]').addEventListener('click', function () { req('DELETE', '/api/admin/login').then(function () { location.reload(); }); });

  // Stäng tider
  var block = $('[data-block]');
  var bDate = $('[data-block-date]');
  var bFrom = $('[data-block-from]');
  var bTo = $('[data-block-to]');
  var allDay = $('[data-allday]');
  function opt(sel, v, label) { var o = el('option', '', label || v); o.value = v; sel.appendChild(o); }
  (function fill() {
    var t = new Date(Date.now() + 7 * 3600000);
    var today = t.getUTCFullYear() + '-' + pad(t.getUTCMonth() + 1) + '-' + pad(t.getUTCDate());
    for (var i = 0; i < SHOP.days; i++) { var dt = addDays(today, i); opt(bDate, dt, (i === 0 ? 'วันนี้ · ' : '') + fmt(dt, { weekday: 'long', day: 'numeric', month: 'short' })); }
    for (var m = toMin(SHOP.open); m <= toMin(SHOP.close); m += SHOP.slot) {
      var hm = pad(Math.floor(m / 60)) + ':' + pad(m % 60);
      if (m < toMin(SHOP.close)) opt(bFrom, hm);
      if (m > toMin(SHOP.open)) opt(bTo, hm);
    }
    bFrom.value = '12:00';
    bTo.value = '13:00';
  })();
  allDay.addEventListener('change', function () {
    bFrom.disabled = bTo.disabled = allDay.checked;
    if (allDay.checked) { bFrom.value = SHOP.open; bTo.value = SHOP.close; }
  });
  block.addEventListener('submit', function (e) {
    e.preventDefault();
    var msg = $('[data-block-msg]');
    var body = { date: bDate.value, from: allDay.checked ? SHOP.open : bFrom.value, to: allDay.checked ? SHOP.close : bTo.value, note: block.elements.note.value };
    req('POST', '/api/admin/bookings', body).then(function (j) {
      msg.hidden = false;
      msg.classList.toggle('is-ok', !!j.ok);
      msg.textContent = j.ok ? 'ปิดคิวแล้ว ✓' : j._status === 409 ? 'ช่วงนี้มีคิวเต็มหมดแล้ว' : 'ไม่สำเร็จ ตรวจเวลาอีกครั้ง';
      if (j.ok) { block.elements.note.value = ''; selected = body.date; load(); }
    });
  });

  // Notiser
  function renderNotify() {
    var box = $('[data-notify]');
    box.textContent = '';
    box.appendChild(el('p', '', '')).appendChild(el('b', '', 'แจ้งเตือนเมื่อมีคิวใหม่ · Booking alerts'));
    if (data.notify) {
      box.appendChild(el('p', '', '1. ติดตั้งแอป “ntfy” (ฟรี) บนมือถือ  2. กดปุ่มด้านล่าง แล้วกด Subscribe'));
      var a = el('a', 'btn btn-dark btn-sm', 'เปิดแจ้งเตือน');
      a.href = data.notify;
      a.target = '_blank';
      a.rel = 'noopener';
      box.appendChild(a);
    } else box.appendChild(el('p', 'muted', 'ยังไม่ได้ตั้งค่า (NOTIFY_NTFY_TOPIC ใน Vercel)'));
  }

  function refresh() { if (!d.hidden && !app.hidden) load().then(renderNotify).catch(function () {}); }
  load().then(renderNotify).catch(function () { list.textContent = 'โหลดไม่สำเร็จ ลองรีเฟรช'; app.hidden = false; });
  setInterval(refresh, 120000); // varannan minut: håller Vercel Blob inom gratisnivån
  d.addEventListener('visibilitychange', refresh);
})();
