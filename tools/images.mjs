// Gör om originalfotona i photos/ till AVIF + WebP i src/img/ och skriver måtten till src/img/img.json.
// Körs bara när ett foto byts:  npm run images   (kräver sharp, finns i devDependencies)
import sharp from 'sharp';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'src', 'img');
// namn: [källfil, bredder]. Klippningarna är numrerade cut-01 … i den ordning de visas.
const JOBS = {
  hero: ['real-01.jpg', [640, 960, 1179]],
  front: ['real-02.jpg', [640, 1100]],
  chair: ['real-03.jpg', [640, 1100]],
};
const CUTS = ['real-07.jpg', 'real-09.jpg', 'real-06.jpg', 'real-08.jpg', 'real-05.jpg', 'real-14.jpg', 'real-10.jpg', 'real-04.jpg',
  'real-16.jpg', 'real-21.jpg', 'real-12.jpg', 'real-18.jpg', 'real-11.jpg', 'real-24.jpg', 'real-19.jpg', 'real-13.jpg',
  'real-17.jpg', 'real-15.jpg', 'real-20.jpg', 'real-22.jpg', 'real-23.jpg'];
CUTS.forEach((f, i) => { JOBS[`cut-${String(i + 1).padStart(2, '0')}`] = [f, [480, 960]]; });

const ONLY = process.argv.slice(2); // t.ex. "npm run images -- og" gör bara delningsbild och ikoner
if (!ONLY.length) rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
const meta = {};
for (const [name, [file, widths]] of Object.entries(JOBS).filter(([n]) => !ONLY.length || ONLY.includes(n))) {
  const src = sharp(join(ROOT, 'photos', file)).rotate();
  const { width, height } = await src.metadata();
  meta[name] = { w: width, h: height, widths, source: file };
  for (const w of widths) {
    const img = src.clone().resize({ width: Math.min(w, width) });
    await img.clone().avif({ quality: 52, effort: 6 }).toFile(join(OUT, `${name}-${w}.avif`));
    if (w === widths[widths.length - 1] || w === 960) await img.clone().webp({ quality: 78 }).toFile(join(OUT, `${name}-${w}.webp`));
  }
}
if (!ONLY.length) writeFileSync(join(OUT, 'img.json'), JSON.stringify(meta, null, 1) + '\n');
console.log(`${Object.keys(meta).length} bilder → src/img/`);

// Delningsbild (Facebook/LINE/WhatsApp) 1200×630 och ikoner.
await sharp(join(ROOT, 'photos', 'hero-shop.jpg')).rotate().resize(1200, 630, { fit: 'cover', position: 'top' })
  .jpeg({ quality: 80, mozjpeg: true }).toFile(join(OUT, 'og.jpg'));
const icon = join(ROOT, 'src', 'icon.svg');
await sharp(icon, { density: 400 }).resize(180, 180).png().toFile(join(OUT, 'apple-touch-icon.png'));
await sharp(icon, { density: 400 }).resize(512, 512).png().toFile(join(OUT, 'icon-512.png'));
