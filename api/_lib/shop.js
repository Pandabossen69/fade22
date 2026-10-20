// Butikens fakta: EN källa för både sidorna (build.mjs) och boknings-API:t.
// Ändra här när priser, tider eller kontaktuppgifter ändras, och bygg om.
//
// Källor (okt 2026): skylten och priståvlan på butikens Facebook-bilder, TikTok @a.day.cutz och Google Maps-platsen.
// Öppettider: skylten säger 08:00–21:00, TikTok-profilen 09:00–21:00. Vi bokar från 09:00 tills butiken bekräftat.

export const shop = {
  name: 'A DAY CUTZ',
  slogan: 'A good day starts with good hair.',
  phoneDisplay: '080-026-9720',
  phoneTel: '+66800269720',
  address: {
    th: '695/3 ต.ทับใต้ อ.หัวหิน จ.ประจวบคีรีขันธ์ 77110',
    en: '695/3 Thap Tai, Hua Hin, Prachuap Khiri Khan 77110',
  },
  landmark: { th: 'ใกล้ ตม.หัวหิน', en: 'Near Hua Hin Immigration' },
  geo: { lat: 12.5508063, lng: 99.8990904 },
  mapsPlace: 'https://maps.app.goo.gl/3oPTjouvU7eDK2p76',
  mapsDirections: 'https://www.google.com/maps/dir/?api=1&destination=12.5508063,99.8990904&travelmode=driving',
  mapsEmbed: 'https://maps.google.com/maps?q=12.5508063,99.8990904&z=16&output=embed',
  tiktok: 'https://www.tiktok.com/@a.day.cutz',
  // Öppet alla dagar. Sista bokningsbara start = close − slotMinutes.
  open: '09:00',
  close: '21:00',
  slotMinutes: 30,
  bookDaysAhead: 14,
  latePolicyMin: 10,
  timeZone: 'Asia/Bangkok',
  utcOffsetMin: 7 * 60,
};

// Priser från priståvlan ("โปรโมชั่นเปิดร้าน"). regular = ordinarie pris på tavlan. Sätt regular: null när kampanjen är slut.
export const services = [
  { id: 'thai', th: 'ตัดผมชาย (คนไทย)', en: 'Haircut (Thai nationals)', price: 120, regular: 150, min: 30 },
  { id: 'foreigner', th: 'ตัดผมชาย (ต่างชาติ)', en: 'Haircut', price: 150, regular: 200, min: 30 },
  { id: 'kids', th: 'ตัดผมเด็ก', en: 'Kids cut', price: 100, regular: 120, min: 30 },
  { id: 'wash', th: 'ตัดผม + สระ', en: 'Haircut & wash', price: 200, regular: 250, min: 45 },
];

// Står på butikens skylt utan pris: visas som "fråga i butiken", kan inte bokas online.
export const extras = [
  { th: 'ตัดวอลลุ่ม · ดัดพิน · ดาวน์เพิร์ม', en: 'Volume cut · pin perm · down perm' },
  { th: 'ย้อมปิดผมขาว', en: 'Grey coverage colour' },
  { th: 'กันหน้า · โกนหนวด', en: 'Line-up · shave' },
];

export function getService(id) {
  return services.find((s) => s.id === id) || null;
}

export function slotsFor(service) {
  return Math.max(1, Math.ceil(service.min / shop.slotMinutes));
}
