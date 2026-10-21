// Bygger A DAY CUTZ till dist/: statisk HTML (thai på /, engelska på /en/) + boknings-API:t i api/ (Vercel Functions).
//   node build.mjs          (SITE_URL=… för annan adress i canonical/OG)
// Samma principer som nextstepwebsites.se: inget ramverk, inga spårare, inga externa anrop utom kartan (först vid klick),
// egna typsnitt, AVIF/WebP, CSP utan 'unsafe-inline'. Bygget stoppar vid inline-skript, dubbla H1, döda länkar m.m.
import { copyFileSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { basename, dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { T } from './src/content.mjs';
import { extras, services, shop } from './api/_lib/shop.js';

const ROOT = dirname(fileURLToPath(import.meta.url));
const SRC = join(ROOT, 'src');
const DIST = process.env.OUT_DIR || join(ROOT, 'dist');
const SITE = (process.env.SITE_URL || 'https://adaycutz.vercel.app').replace(/\/$/, '');
// Förslag tills butiken sagt ja: ingen indexering i Google (samma som våra andra demosidor). INDEXERA=true när sajten är hans.
const INDEXERA = process.env.INDEXERA === 'true';
const IMG = JSON.parse(readFileSync(join(SRC, 'img', 'img.json'), 'utf8'));
const YEAR = new Date().getFullYear();

function stop(msg) { console.error(`BYGGET STOPPADES: ${msg}`); process.exit(1); }
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const md = (s) => esc(s).replace(/\{\{([^|]+)\|([^}]+)\}\}/g, (_, t, h) => `<a href="${h}">${t}</a>`);
const baht = (n) => `฿${n}`;
// Rubriker: på bredare skärmar bryts raden bara vid mellanslagen (thai saknar ordmellanrum, så annars kan ett ord delas).
const ph = (s) => esc(s).split(' ').map((w) => `<span class="nw">${w}</span>`).join(' ');

// Hashade filer: ny adress när innehållet ändras, så de kan cachas i ett år.
const files = [];
function hashed(file) {
  const buf = readFileSync(file);
  const name = `${basename(file, extname(file))}.${createHash('sha256').update(buf).digest('hex').slice(0, 10)}${extname(file)}`;
  files.push([file, join('assets', name)]);
  return `/assets/${name}`;
}
const FONT = {};
for (const f of readdirSync(join(SRC, 'fonts')).filter((f) => f.endsWith('.woff2'))) FONT[f] = hashed(join(SRC, 'fonts', f));
// Typsnitten länkas från CSS:en, som därför skrivs om med de hashade namnen innan den själv hashas.
const cssText = readFileSync(join(SRC, 'styles.css'), 'utf8').replace(/url\("\.\/fonts\/([^"]+)"\)/g, (_, f) => {
  if (!FONT[f]) stop(`typsnittet ${f} saknas`);
  return `url("${FONT[f]}")`;
});
const CSS = `/assets/styles.${createHash('sha256').update(cssText).digest('hex').slice(0, 10)}.css`;
const JS = hashed(join(SRC, 'app.js'));
const ADMIN_JS = hashed(join(SRC, 'admin.js'));
const ICON = hashed(join(SRC, 'icon.svg'));

// ---------- bilder ----------
function pic(name, { alt, sizes, cls = '', eager = false }) {
  const m = IMG[name];
  if (!m) stop(`bilden ${name} saknas i img.json`);
  const avif = m.widths.map((w) => `/img/${name}-${w}.avif ${Math.min(w, m.w)}w`).join(', ');
  const fw = m.widths.includes(960) ? 960 : m.widths[m.widths.length - 1];
  const h = Math.round((m.h / m.w) * Math.min(fw, m.w));
  return `<picture><source type="image/avif" srcset="${avif}" sizes="${sizes}"><img src="/img/${name}-${fw}.webp" width="${Math.min(fw, m.w)}" height="${h}" alt="${esc(alt)}"${cls ? ` class="${cls}"` : ''} ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"></picture>`;
}
const CUTS = Object.keys(IMG).filter((k) => k.startsWith('cut-')).sort();

// ---------- delar ----------
const I = {
  phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z"/></svg>',
  pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg>',
  clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 10.4 3.3 3.3-1.4 1.4-3.9-3.9V6h2z"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.2 5.3 19.9 12l-6.7 6.7-1.4-1.4 4.3-4.3H4v-2h12.1l-4.3-4.3z"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9.5 16.2-4.2-4.2-1.4 1.4 5.6 5.6 11-11-1.4-1.4z"/></svg>',
  cal: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 2h2v2h6V2h2v2h3a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3zm12 8H5v9h14z"/></svg>',
  tiktok: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.6 2h-3.3v13.2a2.9 2.9 0 1 1-2.9-2.9c.3 0 .6 0 .9.1V9a6.3 6.3 0 1 0 5.3 6.2V8.6a7.7 7.7 0 0 0 4.4 1.4V6.7a4.4 4.4 0 0 1-4.4-4.4z"/></svg>',
};

const hrefs = (L) => ({ home: L.home, book: `${L.home}book/`, privacy: `${L.home}privacy/`, cancel: `${L.home}cancel/` });
const otherPath = (lang, path) => (lang === 'th' ? `/en${path}` : path.replace(/^\/en/, '') || '/');

// Strängar som app.js behöver (öppet nu, bokningen, avbokningen).
function jsStrings(lang) {
  const L = T[lang];
  const pick = ['today', 'tomorrow', 'loading', 'full', 'loadError', 'taken', 'minutes', 'errName', 'errPhone', 'errConflict', 'errGeneric',
    'errRate', 'sending', 'submit', 'copied', 'copyCancel', 'cancelMissing', 'cancelPast', 'cancelDone', 'dayparts', 'promo', 'regular'];
  const o = Object.fromEntries(pick.map((k) => [k, L[k]]));
  Object.assign(o, lang === 'th'
    ? { openNow: 'เปิดอยู่', closes: 'ปิด', closedNow: 'ปิดอยู่', opens: 'เปิด', todayLow: 'วันนี้', tomorrowLow: 'พรุ่งนี้' }
    : { openNow: 'Open now', closes: 'closes', closedNow: 'Closed', opens: 'opens', todayLow: 'today', tomorrowLow: 'tomorrow' });
  o.services = services.map((s) => ({ id: s.id, name: s[lang], price: s.price, min: s.min }));
  o.shop = { name: shop.name, open: shop.open, close: shop.close, slot: shop.slotMinutes, days: shop.bookDaysAhead, offset: shop.utcOffsetMin,
    address: shop.address[lang], site: SITE, cancelPath: hrefs(L).cancel };
  return esc(JSON.stringify(o));
}

function jsonLd() {
  const data = {
    '@context': 'https://schema.org', '@type': 'BarberShop', '@id': `${SITE}/#shop`, name: shop.name, slogan: shop.slogan,
    url: `${SITE}/`, telephone: shop.phoneTel, image: [`${SITE}/img/og.jpg`, `${SITE}/img/hero-1179.webp`], logo: `${SITE}/img/icon-512.png`,
    priceRange: `฿${Math.min(...services.map((s) => s.price))}–${Math.max(...services.map((s) => s.price))}`, currenciesAccepted: 'THB',
    address: { '@type': 'PostalAddress', streetAddress: '695/3', addressLocality: 'Thap Tai, Hua Hin', addressRegion: 'Prachuap Khiri Khan', postalCode: '77110', addressCountry: 'TH' },
    geo: { '@type': 'GeoCoordinates', latitude: shop.geo.lat, longitude: shop.geo.lng },
    hasMap: shop.mapsPlace, sameAs: [shop.tiktok],
    openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], opens: shop.open, closes: shop.close }],
    makesOffer: services.map((s) => ({ '@type': 'Offer', price: s.price, priceCurrency: 'THB', itemOffered: { '@type': 'Service', name: s.en } })),
    potentialAction: { '@type': 'ReserveAction', target: `${SITE}/book/` },
  };
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
}

function layout(lang, P, body) {
  const L = T[lang];
  const H = hrefs(L);
  const onHome = P.path === L.home;
  const a = (id) => (onHome ? `#${id}` : `${L.home}#${id}`);
  const canonical = `${SITE}${P.path}`;
  const langHref = P.langHref || otherPath(lang, P.path);
  const alt = `${SITE}${langHref}`;
  const thUrl = lang === 'th' ? canonical : alt;
  const enUrl = lang === 'en' ? canonical : alt;
  return `<!doctype html>
<html lang="${L.htmlLang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(P.title)}</title>
<meta name="description" content="${esc(P.description)}">
${P.noindex || !INDEXERA ? '<meta name="robots" content="noindex">\n' : ''}${P.noindex ? '' : `<link rel="canonical" href="${canonical}">
<link rel="alternate" hreflang="th" href="${thUrl}">
<link rel="alternate" hreflang="en" href="${enUrl}">
<link rel="alternate" hreflang="x-default" href="${thUrl}">`}
<meta name="theme-color" content="#0b0b0c">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${shop.name}">
<meta property="og:title" content="${esc(P.title)}">
<meta property="og:description" content="${esc(P.description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${SITE}/img/og.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="${L.locale}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${ICON}" type="image/svg+xml">
<link rel="apple-touch-icon" href="/img/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="preload" href="${FONT['kanit-600-latin.woff2']}" as="font" type="font/woff2" crossorigin>
${P.preload || ''}<link rel="stylesheet" href="${CSS}">
<script src="${JS}" defer></script>
${P.home ? jsonLd() : ''}
</head>
<body class="${P.bodyClass || ''}" data-i18n="${jsStrings(lang)}">
<a class="skip" href="#main">${L.skip}</a>
<header class="top" data-top>
  <div class="wrap top-in">
    <a class="brand" href="${L.home}"><span class="pole" aria-hidden="true"></span><span>A DAY <b>CUTZ</b></span></a>
    <nav class="nav" aria-label="${L.menu}">
      <a href="${a('prices')}">${L.nav.prices}</a><a href="${a('work')}">${L.nav.work}</a><a href="${a('shop')}">${L.nav.shop}</a><a href="${a('visit')}">${L.nav.visit}</a>
    </nav>
    <a class="lang" href="${langHref}" hreflang="${lang === 'th' ? 'en' : 'th'}" lang="${lang === 'th' ? 'en' : 'th'}" title="${L.langOtherName}">${L.langOther}</a>
    ${P.path === H.book ? '' : `<a class="btn btn-y btn-sm" href="${H.book}">${L.nav.book}</a>`}
  </div>
</header>
<main id="main">
${body}
</main>
<footer class="foot">
  <div class="wrap foot-in">
    <div>
      <p class="brand brand-foot"><span class="pole" aria-hidden="true"></span><span>A DAY <b>CUTZ</b></span></p>
      <p class="foot-slogan">“${shop.slogan}”</p>
    </div>
    <ul class="foot-list">
      <li>${I.pin}<span>${esc(shop.address[lang])}</span></li>
      <li>${I.clock}<span>${L.hours} ${shop.open}–${shop.close}</span></li>
      <li>${I.phone}<a href="tel:${shop.phoneTel}">${shop.phoneDisplay}</a></li>
      <li>${I.tiktok}<a href="${shop.tiktok}" rel="noopener" target="_blank">@a.day.cutz</a></li>
    </ul>
    <p class="foot-small">© ${YEAR} ${shop.name} · <a href="${H.privacy}">${L.privacy}</a> · <a href="${langHref}" hreflang="${lang === 'th' ? 'en' : 'th'}">${L.langOtherName}</a></p>
  </div>
</footer>
${P.path === H.book || P.noBar ? '' : `<div class="bar" data-bar>
  <a class="btn btn-ghost" href="tel:${shop.phoneTel}">${I.phone}${L.call}</a>
  <a class="btn btn-y" href="${H.book}">${L.bookOnline}</a>
</div>`}
</body>
</html>
`;
}

// ---------- sidor ----------
function home(lang) {
  const L = T[lang];
  const H = hrefs(L);
  const svc = services.map((s) => `
        <li class="price">
          <div class="price-main">
            <h3>${esc(s[lang])}</h3>
            <p class="price-meta">${s.min} ${L.minutes}${s.regular ? ` · <span class="tag">${L.promo}</span>` : ''}</p>
          </div>
          <p class="price-num">${s.regular ? `<s aria-label="${L.regular} ${s.regular}">${baht(s.regular)}</s>` : ''}<strong>${baht(s.price)}</strong></p>
          <a class="price-book" href="${H.book}?s=${s.id}">${L.book}<span class="vh"> ${esc(s[lang])}</span>${I.arrow}</a>
        </li>`).join('');
  const cuts = CUTS.map((c, i) => `
        <li${i >= 8 ? ' class="more" hidden' : ''}><a href="/img/${c}-960.webp" data-lightbox aria-label="${esc(L.workAlt)} ${i + 1}">${pic(c, { alt: L.workAlt, sizes: '(min-width: 1100px) 260px, (min-width: 700px) 25vw, 50vw' })}</a></li>`).join('');
  return `
<section class="hero">
  <div class="hero-media">${pic('hero', { alt: L.heroAlt, sizes: '(min-width: 900px) 50vw, 100vw', eager: true })}</div>
  <div class="hero-copy">
    <p class="kicker">${L.heroKicker}</p>
    <h1 class="hero-title">A DAY <span>CUTZ</span></h1>
    <p class="hero-slogan">“${shop.slogan}”</p>
    <p class="hero-lead">${L.heroLead}</p>
    <div class="hero-cta">
      <a class="btn btn-y btn-lg" href="${H.book}">${L.bookOnline}${I.arrow}</a>
      <a class="btn btn-line btn-lg" href="tel:${shop.phoneTel}">${I.phone}${shop.phoneDisplay}</a>
    </div>
    <ul class="hero-facts">
      <li class="status" data-open-now>${I.clock}<span>${L.hours} ${shop.open}–${shop.close}</span></li>
      <li hidden data-next-free><a href="${H.book}">${L.nextFree} <b data-next-text></b>${I.arrow}</a></li>
    </ul>
  </div>
</section>

<section class="sec" id="prices">
  <div class="wrap">
    <p class="kicker">${L.pricesKicker}</p>
    <h2>${ph(L.pricesTitle)}</h2>
    <ul class="prices">${svc}
    </ul>
    <div class="extras">
      <h3>${L.extrasTitle}</h3>
      <ul>${extras.map((e) => `<li>${esc(e[lang])}</li>`).join('')}</ul>
      <p>${L.extrasNote} <a href="tel:${shop.phoneTel}">${shop.phoneDisplay}</a></p>
    </div>
  </div>
</section>

<section class="sec sec-dark" id="work">
  <div class="wrap">
    <p class="kicker">${L.workKicker}</p>
    <h2>${ph(L.workTitle)}</h2>
    <p class="lead">${L.workLead}</p>
    <ul class="cuts" data-cuts>${cuts}
    </ul>
    <p class="center"><button class="btn btn-line" type="button" data-more>${L.workMore} (${CUTS.length})</button></p>
  </div>
  <dialog class="lb" data-lb aria-label="${L.workTitle}">
    <img alt="${esc(L.workAlt)}" src="data:," data-lb-img>
    <button class="lb-btn lb-close" type="button" data-lb-close aria-label="${L.close}">×</button>
    <button class="lb-btn lb-prev" type="button" data-lb-prev aria-label="${L.prev}">‹</button>
    <button class="lb-btn lb-next" type="button" data-lb-next aria-label="${L.next}">›</button>
  </dialog>
</section>

<section class="sec" id="shop">
  <div class="wrap shop">
    <div class="shop-copy">
      <p class="kicker">${L.shopKicker}</p>
      <h2>${ph(L.shopTitle)}</h2>
      <p class="lead">${L.shopText}</p>
      <ul class="ticks">${L.shopPoints.map((p) => `<li>${I.check}${p}</li>`).join('')}</ul>
      <a class="link" href="${shop.tiktok}" rel="noopener" target="_blank">${I.tiktok}${L.tiktok}</a>
    </div>
    <div class="shop-pics">
      ${pic('chair', { alt: L.chairAlt, sizes: '(min-width: 900px) 30vw, 60vw', cls: 'shop-a' })}
      ${pic('front', { alt: L.frontAlt, sizes: '(min-width: 900px) 24vw, 45vw', cls: 'shop-b' })}
    </div>
  </div>
</section>

<section class="sec sec-soft" id="how">
  <div class="wrap">
    <p class="kicker">${L.howKicker}</p>
    <h2>${ph(L.howTitle)}</h2>
    <ol class="how">${L.how.map(([t, d], i) => `<li><span class="how-n">${i + 1}</span><h3>${t}</h3><p>${d}</p></li>`).join('')}</ol>
    <p class="note">${L.late}</p>
  </div>
</section>

<section class="sec" id="visit">
  <div class="wrap visit">
    <div>
      <p class="kicker">${L.visitKicker}</p>
      <h2>${ph(L.visitTitle)}</h2>
      <dl class="facts">
        <div><dt>${I.pin}${L.address}</dt><dd>${esc(shop.address[lang])}<br><span class="muted">${shop.landmark[lang]}</span></dd></div>
        <div><dt>${I.clock}${L.openingHours}</dt><dd>${L.everyDay} ${shop.open}–${shop.close}</dd></div>
        <div><dt>${I.phone}${L.phone}</dt><dd><a href="tel:${shop.phoneTel}">${shop.phoneDisplay}</a></dd></div>
      </dl>
      <p class="row"><a class="btn btn-dark" href="${shop.mapsDirections}" rel="noopener" target="_blank">${I.pin}${L.directions}</a></p>
    </div>
    <div class="map" data-map="${esc(shop.mapsEmbed)}" data-map-title="${esc(L.mapTitle)}">
      ${pic('front', { alt: L.frontAlt, sizes: '(min-width: 900px) 50vw, 100vw', cls: 'map-bg' })}
      <button class="btn btn-y map-btn" type="button" data-map-btn>${I.pin}${L.showMap}</button>
    </div>
  </div>
</section>

<section class="cta">
  <div class="wrap cta-in">
    <h2>${ph(L.ctaTitle)}</h2>
    <p>${L.ctaText}</p>
    <a class="btn btn-y btn-lg" href="${H.book}">${L.bookOnline}${I.arrow}</a>
  </div>
</section>`;
}

function bookPage(lang) {
  const L = T[lang];
  return `
<section class="sec page">
  <div class="wrap narrow">
    <h1>${L.bookH1}</h1>
    <noscript><p class="alert">${L.noscript}</p></noscript>
    <form class="wiz" data-wizard novalidate>
      <ol class="wiz-steps" aria-hidden="true">${L.steps.map((s, i) => `<li data-progress="${i + 1}"><span>${i + 1}</span>${s}</li>`).join('')}</ol>

      <fieldset data-step="1">
        <legend>${L.chooseService}</legend>
        <div class="svc-list">${services.map((s) => `
          <label class="svc"><input type="radio" name="serviceId" value="${s.id}">
            <span class="svc-name">${esc(s[lang])}<small>${s.min} ${L.minutes}${s.regular ? ` · ${L.promo}` : ''}</small></span>
            <span class="svc-price">${s.regular ? `<s>${baht(s.regular)}</s>` : ''}${baht(s.price)}</span>
          </label>`).join('')}
        </div>
      </fieldset>

      <fieldset data-step="2" hidden>
        <legend class="vh">${L.steps[1]}</legend>
        <p class="pick"><span data-pick-service></span> <button type="button" class="link" data-goto="1">${L.change}</button></p>
        <h2 class="wiz-h">${L.chooseDay}</h2>
        <div class="days" data-days></div>
        <h2 class="wiz-h">${L.chooseTime}</h2>
        <div class="slots" data-slots aria-live="polite"></div>
        <p class="note">${L.late}</p>
      </fieldset>

      <fieldset data-step="3" hidden>
        <legend class="vh">${L.yourDetails}</legend>
        <div class="sum">
          <p class="sum-h">${L.summary}</p>
          <p class="sum-main" data-sum></p>
          <button type="button" class="link" data-goto="2">${L.change}</button>
        </div>
        <label class="field"><span>${L.name}</span><input name="name" autocomplete="name" placeholder="${esc(L.namePh)}" required minlength="2" maxlength="60"></label>
        <p class="err" data-err="name" hidden>${L.errName}</p>
        <label class="field"><span>${L.phoneLabel}</span><input name="phone" type="tel" inputmode="tel" autocomplete="tel-national" placeholder="${L.phonePh}" required maxlength="16"></label>
        <p class="err" data-err="phone" hidden>${L.errPhone}</p>
        <label class="field"><span>${L.notes}</span><textarea name="notes" rows="2" maxlength="300" placeholder="${esc(L.notesPh)}"></textarea></label>
        <label class="hp" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label>
        <p class="alert" data-form-error role="alert" hidden></p>
        <button class="btn btn-y btn-lg btn-block" type="submit" data-submit>${L.submit}</button>
        <p class="small">${md(L.consent)}</p>
      </fieldset>

      <div class="done" data-done hidden tabindex="-1">
        <p class="done-icon">${I.check}</p>
        <h2>${L.doneTitle}</h2>
        <p class="sum-main" data-done-sum></p>
        <p>${L.doneText}</p>
        <div class="done-actions">
          <a class="btn btn-dark" data-ics download="a-day-cutz.ics" href="${hrefs(L).book}">${I.cal}${L.addCalendar}</a>
          <a class="btn btn-line" href="${shop.mapsDirections}" rel="noopener" target="_blank">${I.pin}${L.directions}</a>
        </div>
        <div class="cancel-box">
          <p>${L.cancelNote}</p>
          <p class="cancel-link"><a data-cancel-link href="${hrefs(L).cancel}">${hrefs(L).cancel}</a></p>
          <button class="btn btn-line btn-sm" type="button" data-copy>${L.copyCancel}</button>
        </div>
        <p class="note">${L.late}</p>
        <p><a class="link" href="${hrefs(L).book}">${L.bookAnother}</a></p>
      </div>

      <p class="wiz-back"><button class="link" type="button" data-back hidden>← ${L.back}</button></p>
    </form>
  </div>
</section>`;
}

function cancelPage(lang) {
  const L = T[lang];
  return `
<section class="sec page">
  <div class="wrap narrow" data-cancel>
    <h1>${L.cancelH1}</h1>
    <noscript><p class="alert">${L.noscript}</p></noscript>
    <p data-c="loading">${L.loading}</p>
    <div data-c="view" hidden>
      <div class="sum"><p class="sum-h">${L.yourBooking}</p><p class="sum-main" data-c-sum></p></div>
      <button class="btn btn-dark btn-lg btn-block" type="button" data-c-btn>${L.cancelConfirm}</button>
    </div>
    <p class="alert" data-c="msg" role="status" hidden></p>
    <p><a class="btn btn-y" href="${hrefs(L).book}">${L.newBooking}</a></p>
  </div>
</section>`;
}

function privacyPage(lang) {
  const L = T[lang];
  return `
<section class="sec page">
  <div class="wrap narrow prose">
    <h1>${L.privacyH1}</h1>
    <p class="muted">${shop.name} · ${esc(shop.address[lang])} · <a href="tel:${shop.phoneTel}">${shop.phoneDisplay}</a></p>
    ${L.privacyBody.map(([h, p]) => `<h2>${h}</h2><p>${esc(p)}</p>`).join('\n    ')}
  </div>
</section>`;
}

function notFound() {
  const L = T.th;
  const E = T.en;
  return `
<section class="sec page">
  <div class="wrap narrow">
    <h1>${L.notFoundH1} <span class="muted" lang="en">· ${E.notFoundH1}</span></h1>
    <p>${L.notFoundText}</p>
    <p class="row"><a class="btn btn-y" href="/book/">${L.bookOnline}</a> <a class="btn btn-line" href="/">${L.backHome}</a> <a class="btn btn-line" href="/en/" lang="en">${E.backHome}</a></p>
  </div>
</section>`;
}

function adminPage() {
  return `<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#0b0b0c">
<title>คิวของร้าน · A DAY CUTZ</title>
<link rel="icon" href="${ICON}" type="image/svg+xml">
<link rel="apple-touch-icon" href="/img/apple-touch-icon.png">
<link rel="stylesheet" href="${CSS}">
<script src="${ADMIN_JS}" defer></script>
</head>
<body class="admin-body" data-shop="${esc(JSON.stringify({ open: shop.open, close: shop.close, slot: shop.slotMinutes, days: shop.bookDaysAhead, services: services.map((s) => ({ id: s.id, name: s.th, price: s.price })) }))}">
<header class="top"><div class="wrap top-in"><a class="brand" href="/"><span class="pole" aria-hidden="true"></span><span>A DAY <b>CUTZ</b></span></a><span class="admin-tag">คิวของร้าน</span><button class="link" type="button" data-logout hidden>ออกจากระบบ</button></div></header>
<main id="main" class="wrap admin">
  <h1 class="vh">คิวของร้าน · A DAY CUTZ</h1>
  <form class="login" data-login hidden>
    <h2>เข้าสู่ระบบร้าน</h2>
    <label class="field"><span>รหัสผ่าน <small>Password</small></span><input name="password" type="password" autocomplete="current-password" required></label>
    <p class="alert" data-login-err role="alert" hidden></p>
    <button class="btn btn-y btn-lg btn-block" type="submit">เข้าสู่ระบบ</button>
  </form>
  <div data-app hidden>
    <div class="adm-head">
      <div class="adm-today"><p class="kicker" data-today-label>วันนี้</p><p class="adm-count"><b data-count>0</b> คิว</p></div>
      <div class="adm-next" data-next></div>
    </div>
    <div class="adm-days" data-adm-days></div>
    <div data-list aria-live="polite"></div>
    <details class="adm-card">
      <summary>ปิดคิว / ลงคิวจากโทรศัพท์ <small>Block time · phone booking</small></summary>
      <form class="adm-block" data-block>
        <label class="field"><span>วัน</span><select name="date" data-block-date></select></label>
        <div class="adm-two">
          <label class="field"><span>ตั้งแต่</span><select name="from" data-block-from></select></label>
          <label class="field"><span>ถึง</span><select name="to" data-block-to></select></label>
        </div>
        <label class="check"><input type="checkbox" data-allday> ปิดทั้งวัน <small>Closed all day</small></label>
        <label class="field"><span>หมายเหตุ <small>เช่น พักกลางวัน / ชื่อลูกค้าที่โทรมา</small></span><input name="note" maxlength="80"></label>
        <p class="alert" data-block-msg role="status" hidden></p>
        <button class="btn btn-dark btn-block" type="submit">ปิดคิวช่วงนี้</button>
      </form>
    </details>
    <div class="adm-card" data-notify></div>
    <details class="adm-card">
      <summary>ใช้งานยังไง <small>How it works</small></summary>
      <ol class="adm-help">
        <li>ลูกค้าจองบนเว็บ → มือถือของช่างเด้งแจ้งเตือน (แอป ntfy)</li>
        <li>ดูคิวทั้งหมดที่หน้านี้ กดเบอร์เพื่อโทรหาลูกค้า</li>
        <li>ลูกค้ายกเลิกเองได้ด้วยลิงก์ของเขา หรือกด “ลบ” ที่นี่</li>
        <li>จะพัก ลา หรือมีลูกค้าโทรจอง → ใช้ “ปิดคิว” ด้านบน เวลานั้นจะไม่ว่างบนเว็บ</li>
      </ol>
    </details>
  </div>
</main>
</body>
</html>
`;
}

// ---------- bygg ----------
const pages = [];
for (const lang of ['th', 'en']) {
  const L = T[lang];
  const H = hrefs(L);
  const heroAvif = IMG.hero.widths.map((w) => `/img/hero-${w}.avif ${w}w`).join(', ');
  pages.push({ lang, path: H.home, title: L.title, description: L.description, home: true, bodyClass: 'is-home', body: home(lang),
    preload: `<link rel="preload" as="image" type="image/avif" imagesrcset="${heroAvif}" imagesizes="(min-width: 900px) 50vw, 100vw" fetchpriority="high">\n` });
  pages.push({ lang, path: H.book, title: L.bookTitle, description: L.bookDescription, body: bookPage(lang) });
  pages.push({ lang, path: H.cancel, title: L.cancelTitle, description: L.cancelTitle, noindex: true, noBar: true, body: cancelPage(lang) });
  pages.push({ lang, path: H.privacy, title: L.privacyTitle, description: L.privacyTitle, body: privacyPage(lang) });
}

const outputs = [];
const known = new Set(pages.map((p) => p.path).concat(['/admin/', '/site.webmanifest']));
for (const P of pages) {
  const html = layout(P.lang, P, P.body);
  outputs.push([join(P.path.slice(1), 'index.html'), html]);
}
outputs.push(['404.html', layout('th', { path: '/404/', langHref: '/en/', title: T.th.notFoundTitle, description: T.th.notFoundTitle, noindex: true }, notFound())]);
outputs.push([join('admin', 'index.html'), adminPage()]);

// Kontroller (samma anda som nextstepwebsites.se): bygget stoppar hellre än publicerar något trasigt.
const imgFiles = new Set(readdirSync(join(SRC, 'img')));
for (const [file, html] of outputs) {
  const where = `/${file}`;
  if (/<script(?![^>]*\bsrc=)(?![^>]*application\/ld\+json)[^>]*>/.test(html)) stop(`${where}: inline-skript är inte tillåtet (CSP).`);
  if (/<style/.test(html) || /<[a-z][^>]*\s(style|on[a-z]+)=/i.test(html)) stop(`${where}: inline-stil eller on…="" är inte tillåtet (CSP).`);
  if (/undefined|NaN|\[object |\[[A-Z]{3,}\]/.test(html)) stop(`${where}: platshållare eller undefined i HTML.`);
  if ((html.match(/<h1[\s>]/g) || []).length !== 1) stop(`${where}: en H1 per sida.`);
  if (/gallery-\d|unsplash/i.test(html)) stop(`${where}: bara riktiga bilder från butiken.`);
  for (const [, href] of html.matchAll(/(?:href|src)="(\/[^"#?]*)/g)) {
    if (href.startsWith('/assets/') || href.startsWith('/api/')) continue;
    if (href.startsWith('/img/')) { if (!imgFiles.has(href.slice(5))) stop(`${where}: bild saknas ${href}`); continue; }
    if (!known.has(href)) stop(`${where}: död länk ${href}`);
  }
  for (const [, set] of html.matchAll(/srcset="([^"]+)"/g)) for (const part of set.split(',')) {
    const u = part.trim().split(' ')[0];
    if (!imgFiles.has(u.replace('/img/', ''))) stop(`${where}: bild saknas ${u}`);
  }
  for (const [, base, id] of html.matchAll(/href="(\/(?:en\/)?)?#([^"]+)"/g)) {
    const target = base ? outputs.find(([f]) => f === `${base.slice(1)}index.html`)[1] : html;
    if (!target.includes(`id="${id}"`)) stop(`${where}: ankaret #${id} finns inte`);
  }
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${pages.filter((p) => !p.noindex).map((p) => `<url><loc>${SITE}${p.path}</loc><xhtml:link rel="alternate" hreflang="${p.lang === 'th' ? 'en' : 'th'}" href="${SITE}${otherPath(p.lang, p.path)}"/></url>`).join('\n')}
</urlset>
`;
outputs.push(['sitemap.xml', sitemap]);
outputs.push(['robots.txt', INDEXERA ? `User-agent: *\nDisallow: /admin/\nDisallow: /api/\nSitemap: ${SITE}/sitemap.xml\n` : 'User-agent: *\nDisallow: /\n']);
outputs.push(['speculation.json', JSON.stringify({ prerender: [{ where: { and: [{ href_matches: '/*' }, { not: { href_matches: '/admin/*' } }, { not: { selector_matches: '[target=_blank], [download]' } }] }, eagerness: 'moderate' }] }) + '\n']);
outputs.push(['site.webmanifest', JSON.stringify({ name: shop.name, short_name: shop.name, start_url: '/', display: 'standalone', background_color: '#0b0b0c', theme_color: '#0b0b0c', icons: [{ src: '/img/icon-512.png', sizes: '512x512', type: 'image/png' }] }) + '\n']);

rmSync(DIST, { recursive: true, force: true });
for (const [rel, body] of outputs) { mkdirSync(dirname(join(DIST, rel)), { recursive: true }); writeFileSync(join(DIST, rel), body); }
for (const [src, rel] of files) {
  mkdirSync(dirname(join(DIST, rel)), { recursive: true });
  copyFileSync(src, join(DIST, rel));
}
writeFileSync(join(DIST, CSS), cssText);
mkdirSync(join(DIST, 'img'), { recursive: true });
for (const f of imgFiles) if (f !== 'img.json') copyFileSync(join(SRC, 'img', f), join(DIST, 'img', f));
copyFileSync(join(SRC, 'img', 'apple-touch-icon.png'), join(DIST, 'apple-touch-icon.png'));
console.log(`Klart: ${outputs.length} filer + ${files.length} tillgångar → ${DIST} (${SITE}, ${INDEXERA ? 'indexeras' : 'noindex: förslag'})`);
