# A DAY CUTZ

Hemsida med onlinebokning för A DAY CUTZ, herrfrisör i Thap Tai, Hua Hin. Thai på `/`, engelska på `/en/`.
Byggd som nextstepwebsites.se: statisk HTML utan ramverk, egna typsnitt, AVIF/WebP, strikt CSP, inga spårare.
Driftkostnad 0 kr: Vercel (statiska sidor + några små funktioner), Vercel Blob (en json-fil) och ntfy.sh för notiser.

## Sidor
| Adress | Vad |
|---|---|
| `/`, `/en/` | Start: öppet nu, nästa lediga tid, priser, klippningar (riktiga bilder), butiken, hitta hit |
| `/book/`, `/en/book/` | Bokning i tre steg: tjänst → dag och tid → namn och mobil. Bekräftelse med kalenderfil och avbokningslänk |
| `/cancel/#…` | Kunden avbokar själv med länken från bekräftelsen |
| `/privacy/`, `/en/privacy/` | Integritet (PDPA) |
| `/admin/` | Butikens vy: dagens och kommande kunder, stäng tider (lunch, ledig dag, telefonbokning), ta bort |

## Ändra innehåll
- **Priser, tider, adress, telefon:** `api/_lib/shop.js` (en källa för både sidorna och bokningen).
- **Texter:** `src/content.mjs` (thai och engelska).
- **Bilder:** lägg originalet i `photos/`, lägg till det i `tools/images.mjs`, kör `npm run images`.

## Kommandon
    npm install
    npm run build                                    # → dist/ (stoppar vid inline-skript, dubbla H1, döda länkar, falska bilder)
    ADMIN_PASSWORD=hemligt123 npm run dev            # http://localhost:3000, bokningar i data/bookings.json
    npm test                                         # bokningslogiken

## Miljövariabler (Vercel)
Se `.env.example`. Utan `ADMIN_PASSWORD` går det inte att logga in på `/admin`. Utan `NOTIFY_NTFY_TOPIC` kommer inga notiser.

## Så hålls driften gratis
- Sidorna är statiska filer i Vercels CDN. Bara bokningen anropar funktioner.
- Lediga tider cachas 15 s i CDN:en, så många besökare ger få anrop. Bokningen kontrolleras alltid mot färsk data.
- Allt sparas i en json-fil i Vercel Blob. Bokningar äldre än 120 dagar rensas automatiskt.
- Kartan laddas först när besökaren klickar.
