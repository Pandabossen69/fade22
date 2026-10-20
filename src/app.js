// A DAY CUTZ: öppet nu, nästa lediga tid, galleri, karta vid klick, bokning i tre steg och avbokning.
// Egen fil (inte inline) så att CSP:n bara behöver 'self'. Sidan fungerar utan JS utom bokningen (då visas telefonnumret).
(function () {
  'use strict';
  var d = document;
  var $ = function (s, el) { return (el || d).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || d).querySelectorAll(s)); };
  var S = {};
  try { S = JSON.parse(d.body.getAttribute('data-i18n') || '{}'); } catch (e) { /* sidan klarar sig utan */ }
  var SHOP = S.shop || {};
  var lang = d.documentElement.lang === 'en' ? 'en' : 'th';
  var locale = lang === 'en' ? 'en-GB' : 'th-TH';

  // ---------- tid i Bangkok (UTC+7, ingen sommartid) ----------
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function toMin(hm) { var p = hm.split(':'); return +p[0] * 60 + +p[1]; }
  function bkk() {
    var t = new Date(Date.now() + (SHOP.offset || 420) * 60000);
    return { date: t.getUTCFullYear() + '-' + pad(t.getUTCMonth() + 1) + '-' + pad(t.getUTCDate()), min: t.getUTCHours() * 60 + t.getUTCMinutes() };
  }
  function addDays(date, n) {
    var t = new Date(Date.parse(date + 'T00:00:00Z') + n * 86400000);
    return t.getUTCFullYear() + '-' + pad(t.getUTCMonth() + 1) + '-' + pad(t.getUTCDate());
  }
  function utc(date) { return new Date(Date.parse(date + 'T00:00:00Z')); }
  function fmt(date, opts) { return new Intl.DateTimeFormat(locale, Object.assign({ timeZone: 'UTC' }, opts)).format(utc(date)); }
  function dayLabel(date) {
    var today = bkk().date;
    if (date === today) return S.today;
    if (date === addDays(today, 1)) return S.tomorrow;
    return fmt(date, { weekday: 'short', day: 'numeric', month: 'short' });
  }
  function service(id) { return (S.services || []).filter(function (s) { return s.id === id; })[0] || null; }
  function bookingLine(b) {
    var s = service(b.serviceId);
    return (s ? s.name + ' · ' : '') + dayLabel(b.date) + (lang === 'en' ? ' at ' : ' เวลา ') + b.time + (lang === 'en' ? '' : ' น.');
  }
  function api(url, body) {
    return fetch(url, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : { headers: { Accept: 'application/json' } })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { j._status = r.status; return j; }); });
  }

  // ---------- öppet nu ----------
  $$('[data-open-now]').forEach(function (el) {
    function upd() {
      var now = bkk().min;
      var open = toMin(SHOP.open);
      var close = toMin(SHOP.close);
      var isOpen = now >= open && now < close;
      var txt = isOpen ? S.openNow + ' · ' + S.closes + ' ' + SHOP.close
        : S.closedNow + ' · ' + S.opens + ' ' + SHOP.open + ' ' + (now < open ? S.todayLow : S.tomorrowLow);
      el.classList.toggle('is-open', isOpen);
      el.classList.toggle('is-closed', !isOpen);
      $('span', el).textContent = txt;
    }
    upd();
    setInterval(upd, 60000);
  });

  // ---------- nästa lediga tid ----------
  $$('[data-next-free]').forEach(function (li) {
    var first = (S.services || [])[0];
    if (!first) return;
    api('/api/bookings?service=' + first.id + '&next=1').then(function (j) {
      if (!j.date) return;
      $('[data-next-text]', li).textContent = dayLabel(j.date) + ' ' + j.time;
      var a = $('a', li);
      a.href = a.getAttribute('href') + '?d=' + j.date + '&t=' + j.time;
      li.hidden = false;
    }).catch(function () { /* rutan visas bara när svaret kommit */ });
  });

  // ---------- galleri ----------
  var more = $('[data-more]');
  if (more) more.addEventListener('click', function () {
    $$('[data-cuts] li[hidden]').forEach(function (li) { li.hidden = false; });
    more.parentNode.hidden = true;
  });
  var lb = $('[data-lb]');
  if (lb && lb.showModal) {
    var links = $$('[data-lightbox]');
    var img = $('[data-lb-img]', lb);
    var cur = 0;
    var open = function (i) { cur = (i + links.length) % links.length; img.src = links[cur].getAttribute('href'); if (!lb.open) lb.showModal(); };
    links.forEach(function (a, i) { a.addEventListener('click', function (e) { e.preventDefault(); open(i); }); });
    $('[data-lb-close]', lb).addEventListener('click', function () { lb.close(); });
    $('[data-lb-prev]', lb).addEventListener('click', function () { open(cur - 1); });
    $('[data-lb-next]', lb).addEventListener('click', function () { open(cur + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
    lb.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') open(cur - 1); if (e.key === 'ArrowRight') open(cur + 1); });
    var x0 = null;
    lb.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) open(cur + (dx < 0 ? 1 : -1));
      x0 = null;
    });
  }

  // ---------- karta först vid klick (ingen Google-laddning innan besökaren vill) ----------
  $$('[data-map-btn]').forEach(function (b) {
    b.addEventListener('click', function () {
      var box = b.closest('[data-map]');
      var f = d.createElement('iframe');
      f.src = box.getAttribute('data-map');
      f.title = box.getAttribute('data-map-title');
      f.loading = 'lazy';
      f.referrerPolicy = 'no-referrer-when-downgrade';
      box.appendChild(f);
      b.remove();
    });
  });

  // ---------- knappraden på mobilen göms när hero-knapparna syns ----------
  var bar = $('[data-bar]');
  var heroCta = $('.hero-cta');
  if (bar && heroCta && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { bar.classList.toggle('is-hidden', es[0].isIntersecting); }).observe(heroCta);
  }

  // ---------- mjuk inglidning ----------
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    $$('.price, .cuts li, .how li, .shop-pics, .extras, .facts').forEach(function (el, i) {
      el.classList.add('reveal');
      el.style.transitionDelay = (i % 4) * 60 + 'ms';
      io.observe(el);
    });
  }

  // ---------- bokningen ----------
  var form = $('[data-wizard]');
  if (form) wizard(form);

  function wizard(form) {
    var steps = $$('[data-step]', form);
    var prog = $$('[data-progress]', form);
    var back = $('[data-back]', form);
    var daysEl = $('[data-days]', form);
    var slotsEl = $('[data-slots]', form);
    var done = $('[data-done]', form);
    var st = { step: 1, service: null, date: null, time: null, wanted: null };
    var params = new URLSearchParams(location.search);
    var now = bkk();
    var lastStart = toMin(SHOP.close) - SHOP.slot;
    var firstDay = now.min >= lastStart ? addDays(now.date, 1) : now.date;
    var days = [];
    for (var i = 0; i < SHOP.days; i++) { var dd = addDays(now.date, i); if (dd >= firstDay) days.push(dd); }

    var slotMsg = d.createElement('p');
    slotMsg.className = 'alert';
    slotMsg.setAttribute('role', 'alert');
    slotMsg.hidden = true;
    slotsEl.parentNode.insertBefore(slotMsg, slotsEl);

    function show(n, push) {
      st.step = n;
      steps.forEach(function (s) { s.hidden = +s.getAttribute('data-step') !== n; });
      prog.forEach(function (p) {
        var k = +p.getAttribute('data-progress');
        p.classList.toggle('is-on', k === n);
        p.classList.toggle('is-done', k < n);
      });
      back.hidden = n === 1;
      if (n === 3) $('[data-sum]', form).textContent = bookingLine({ serviceId: st.service, date: st.date, time: st.time });
      if (push !== false) history.pushState({ step: n }, '');
      var top = form.getBoundingClientRect().top + window.scrollY - 90;
      if (window.scrollY > top) window.scrollTo(0, top);
    }
    history.replaceState({ step: 1 }, '');
    window.addEventListener('popstate', function (e) {
      if (!done.hidden) return;
      var n = (e.state && e.state.step) || 1;
      if (n > 1 && !st.service) n = 1;
      if (n > 2 && !st.time) n = 2;
      show(n, false);
    });
    back.addEventListener('click', function () { history.back(); });
    $$('[data-goto]', form).forEach(function (b) { b.addEventListener('click', function () { show(+b.getAttribute('data-goto')); }); });

    // Steg 1
    $$('input[name=serviceId]', form).forEach(function (r) {
      r.addEventListener('change', function () { pickService(r.value); show(2); });
    });
    function pickService(id) {
      var s = service(id);
      if (!s) return;
      st.service = id;
      var r = $('input[name=serviceId][value="' + id + '"]', form);
      if (r) r.checked = true;
      $('[data-pick-service]', form).textContent = s.name + ' · ฿' + s.price;
      loadSlots();
    }

    // Steg 2: dagar
    days.forEach(function (date) {
      var b = d.createElement('button');
      b.type = 'button';
      b.className = 'day';
      b.setAttribute('data-date', date);
      b.setAttribute('aria-pressed', 'false');
      var rel = date === now.date ? S.today : date === addDays(now.date, 1) ? S.tomorrow : fmt(date, { weekday: 'short' });
      b.innerHTML = '<small></small><b></b><small></small>';
      b.children[0].textContent = rel;
      b.children[1].textContent = fmt(date, { day: 'numeric' });
      b.children[2].textContent = fmt(date, { month: 'short' });
      b.setAttribute('aria-label', fmt(date, { weekday: 'long', day: 'numeric', month: 'long' }));
      b.addEventListener('click', function () { pickDate(date); });
      daysEl.appendChild(b);
    });
    function pickDate(date) {
      st.date = date;
      st.time = null;
      $$('.day', daysEl).forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-date') === date)); });
      loadSlots();
    }

    // Steg 2: tider
    var reqId = 0;
    function loadSlots() {
      if (!st.service || !st.date) return;
      var my = ++reqId;
      slotsEl.innerHTML = '';
      var p = d.createElement('p');
      p.className = 'muted';
      p.textContent = S.loading;
      slotsEl.appendChild(p);
      api('/api/bookings?service=' + st.service + '&date=' + st.date).then(function (j) {
        if (my !== reqId) return;
        if (!j.slots) throw new Error('slots');
        renderSlots(j.slots);
      }).catch(function () {
        if (my !== reqId) return;
        p.textContent = S.loadError;
      });
    }
    function renderSlots(slots) {
      slotsEl.innerHTML = '';
      if (!slots.some(function (s) { return s.free; })) {
        var e = d.createElement('p');
        e.className = 'muted';
        e.textContent = S.full;
        slotsEl.appendChild(e);
        return;
      }
      var groups = [[], [], []];
      slots.forEach(function (s) { var m = toMin(s.time); groups[m < 720 ? 0 : m < 1020 ? 1 : 2].push(s); });
      groups.forEach(function (g, gi) {
        if (!g.length) return;
        var wrap = d.createElement('div');
        wrap.className = 'slot-group';
        var h = d.createElement('p');
        h.textContent = S.dayparts[gi];
        var grid = d.createElement('div');
        grid.className = 'slot-grid';
        g.forEach(function (s) {
          var b = d.createElement('button');
          b.type = 'button';
          b.className = 'slot';
          b.textContent = s.time;
          b.setAttribute('aria-pressed', 'false');
          if (!s.free) { b.disabled = true; b.setAttribute('aria-label', s.time + ' · ' + S.taken); }
          else b.addEventListener('click', function () { pickTime(s.time, b); });
          if (s.free && st.wanted === s.time) { st.wanted = null; pickTime(s.time, b, true); }
          grid.appendChild(b);
        });
        wrap.appendChild(h);
        wrap.appendChild(grid);
        slotsEl.appendChild(wrap);
      });
    }
    function pickTime(time, btn, quiet) {
      st.time = time;
      slotMsg.hidden = true;
      $$('.slot', slotsEl).forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
      if (!quiet) show(3);
    }

    // Steg 3
    var nameIn = form.elements.name;
    var phoneIn = form.elements.phone;
    var errBox = $('[data-form-error]', form);
    var submit = $('[data-submit]', form);
    function digits(v) { var x = String(v || '').replace(/\D/g, ''); if (x.indexOf('66') === 0 && x.length === 11) x = '0' + x.slice(2); return x; }
    function check(field) {
      var ok = field === 'name' ? nameIn.value.trim().length >= 2 : /^0[689]\d{8}$/.test(digits(phoneIn.value));
      var el = field === 'name' ? nameIn : phoneIn;
      el.setAttribute('aria-invalid', String(!ok));
      $('[data-err="' + field + '"]', form).hidden = ok;
      return ok;
    }
    nameIn.addEventListener('blur', function () { if (nameIn.value) check('name'); });
    phoneIn.addEventListener('blur', function () {
      var x = digits(phoneIn.value);
      if (x.length === 10) phoneIn.value = x.slice(0, 3) + '-' + x.slice(3, 6) + '-' + x.slice(6);
      if (phoneIn.value) check('phone');
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (st.step !== 3) return;
      var okName = check('name');
      var okPhone = check('phone');
      if (!okName || !okPhone) { (okName ? phoneIn : nameIn).focus(); return; }
      errBox.hidden = true;
      submit.disabled = true;
      submit.textContent = S.sending;
      api('/api/bookings', {
        serviceId: st.service, date: st.date, time: st.time, name: nameIn.value, phone: digits(phoneIn.value),
        notes: form.elements.notes.value, website: form.elements.website.value, lang: lang,
      }).then(function (j) {
        if (j.ok && j.ref) return finish(j);
        if (j._status === 409 || (j.fields && j.fields.time)) {
          st.time = null;
          slotMsg.textContent = S.errConflict;
          slotMsg.hidden = false;
          show(2);
          loadSlots();
          return;
        }
        if (j.fields && j.fields.phone) { check('phone'); phoneIn.focus(); return; }
        if (j.fields && j.fields.name) { check('name'); nameIn.focus(); return; }
        throw new Error(j._status === 429 ? 'rate' : 'fail');
      }).catch(function (err) {
        errBox.textContent = err && err.message === 'rate' ? S.errRate : S.errGeneric;
        errBox.hidden = false;
      }).then(function () {
        submit.disabled = false;
        submit.textContent = S.submit;
      });
    });

    function finish(j) {
      var b = { serviceId: st.service, date: st.date, time: st.time };
      var cancelUrl = location.origin + SHOP.cancelPath + '#' + j.ref;
      steps.forEach(function (s) { s.hidden = true; });
      $('.wiz-steps', form).hidden = true;
      back.hidden = true;
      $('[data-done-sum]', done).textContent = bookingLine(b);
      var link = $('[data-cancel-link]', done);
      link.href = cancelUrl;
      link.textContent = cancelUrl;
      var ics = $('[data-ics]', done);
      ics.href = URL.createObjectURL(new Blob([icsFile(b, j.ref, cancelUrl)], { type: 'text/calendar' }));
      $('[data-copy]', done).addEventListener('click', function (e) {
        var btn = e.currentTarget;
        var ok = function () { btn.textContent = S.copied; setTimeout(function () { btn.textContent = S.copyCancel; }, 2500); };
        if (navigator.clipboard) navigator.clipboard.writeText(cancelUrl).then(ok, function () { window.prompt('', cancelUrl); });
        else window.prompt('', cancelUrl);
      });
      done.hidden = false;
      history.replaceState({ step: 4 }, '');
      window.scrollTo(0, 0);
      done.focus();
    }

    function icsFile(b, ref, cancelUrl) {
      var s = service(b.serviceId);
      var start = Date.parse(b.date + 'T' + b.time + ':00Z') - (SHOP.offset || 420) * 60000;
      var end = start + (s ? s.min : 30) * 60000;
      var stamp = function (ms) { return new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); };
      var esc = function (t) { return String(t).replace(/[\\;,]/g, function (c) { return '\\' + c; }).replace(/\n/g, '\\n'); };
      return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//A DAY CUTZ//Booking//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VEVENT',
        'UID:' + ref.split('.')[0] + '@adaycutz', 'DTSTAMP:' + stamp(Date.now()), 'DTSTART:' + stamp(start), 'DTEND:' + stamp(end),
        'SUMMARY:' + esc(SHOP.name + (s ? ' · ' + s.name : '')), 'LOCATION:' + esc(SHOP.address),
        'DESCRIPTION:' + esc(cancelUrl), 'BEGIN:VALARM', 'TRIGGER:-PT1H', 'ACTION:DISPLAY', 'DESCRIPTION:' + esc(SHOP.name), 'END:VALARM',
        'END:VEVENT', 'END:VCALENDAR', ''].join('\r\n');
    }

    // Start: förval från länken (?s=thai&d=2026-10-21&t=15:30)
    var pd = params.get('d');
    pickDate(days.indexOf(pd) >= 0 ? pd : days[0]);
    var pt = params.get('t');
    if (pt && /^\d{2}:\d{2}$/.test(pt)) st.wanted = pt;
    var ps = params.get('s');
    if (service(ps)) { pickService(ps); show(2, false); history.replaceState({ step: 2 }, ''); }
    else show(1, false);
  }

  // ---------- avbokning ----------
  var cbox = $('[data-cancel]');
  if (cbox) {
    var ref = decodeURIComponent(location.hash.slice(1));
    var part = function (k) { return $('[data-c="' + k + '"]', cbox); };
    var msg = function (t, ok) { part('loading').hidden = true; part('view').hidden = true; var m = part('msg'); m.textContent = t; m.classList.toggle('is-ok', !!ok); m.hidden = false; };
    if (!ref) msg(S.cancelMissing);
    else api('/api/cancel', { ref: ref, action: 'view' }).then(function (j) {
      if (!j.booking) return msg(S.cancelMissing);
      if (!j.cancellable) return msg(S.cancelPast);
      part('loading').hidden = true;
      $('[data-c-sum]', cbox).textContent = bookingLine(j.booking);
      part('view').hidden = false;
    }).catch(function () { msg(S.errGeneric); });
    var cbtn = $('[data-c-btn]', cbox);
    cbtn.addEventListener('click', function () {
      cbtn.disabled = true;
      api('/api/cancel', { ref: ref, action: 'cancel' }).then(function (j) {
        if (j.ok) { msg(S.cancelDone, true); history.replaceState(null, '', location.pathname); }
        else msg(S.cancelMissing);
      }).catch(function () { cbtn.disabled = false; msg(S.errGeneric); });
    });
  }
})();
