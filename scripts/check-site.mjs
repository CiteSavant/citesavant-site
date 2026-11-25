// Deploy check for citesavant.com. No dependencies; needs only Node.
//
//   node scripts/check-site.mjs                 check this repository
//   node scripts/check-site.mjs --root <folder> check another copy (used to test the check)
//
// Vercel runs this as the build step (vercel.json, "buildCommand"), so if any
// rule below fails, the deployment stops and the live site stays as it was.
//
// It stops a deployment if:
//   1. a page holds a script, an inline style or an inline event handler;
//   2. a page links anywhere except the site's own files, https://app.citesavant.com
//      and the feedback address (mailto:citesavant_admin@proton.me);
//   2b. a page names the site's own address, https://www.citesavant.com/, anywhere
//      but its two link-preview address tags (og:url, which must be the page's own
//      address, and og:image, which must be a file of the site), or names any
//      other address in a <meta> tag;
//   3. a font file is missing, added, or its fingerprint (SHA-256) changed;
//   3b. a tab icon or the link-preview picture in public/img/ is missing or
//      changed (its fingerprint differs), or public/img/ holds anything else;
//   4. vercel.json differs from the reviewed settings below;
//   5. the top of the repository holds anything but README.md, public/, scripts/,
//      vercel.json and .gitignore (so no api/ folder, package.json or other
//      server or build code);
//   6. public/ holds anything but the site's pages, site.css, the logo, fonts/ and img/.
//
// To change the fonts, the tab icons, the preview picture or vercel.json on purpose, change them here
// in the same commit.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const rootArg = process.argv.indexOf('--root');
const root = rootArg > 0 && process.argv[rootArg + 1]
  ? path.resolve(process.argv[rootArg + 1])
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const site = path.join(root, 'public');

const problems = [];
const sha256 = buf => crypto.createHash('sha256').update(buf).digest('hex');
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e =>
  e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
const rel = f => path.relative(site, f).split(path.sep).join('/');

if (!fs.existsSync(site) || !fs.lstatSync(site).isDirectory()) {
  console.error(`Deploy check failed: there is no public/ folder in ${root}.`);
  process.exit(1);
}

// ---- 5. Only the expected items at the top of the repository -------------------
// Anything else (an api/ folder, middleware, a package.json and the like) could
// make Vercel run server code or a build of its own.
// .git is git's own folder. Vercel's build tool creates .vercel itself just
// before running this check; it is only refused if it already holds an output
// folder (pre-built files Vercel would serve instead of public/).
const TOP_LEVEL = new Set(['README.md', 'public', 'scripts', 'vercel.json', '.gitignore', '.git']);
for (const name of fs.readdirSync(root)) {
  if (name === '.vercel') {
    if (fs.existsSync(path.join(root, '.vercel', 'output'))) problems.push('.vercel/output exists before the build: pre-built output must never be in the repository.');
    continue;
  }
  if (!TOP_LEVEL.has(name)) problems.push(`Unexpected item at the top of the repository: ${name}. Only README.md, public/, scripts/, vercel.json and .gitignore belong there.`);
}

// ---- 6. Only the site itself in public/ ------------------------------------------
// The pages (each one checked below), the stylesheet, the logo, the fonts
// folder (whose contents are checked file by file in rule 3) and the tab-icon
// folder (checked file by file in rule 3b).
const PUBLIC_TOP = new Set(['site.css', 'citesavant-wordmark-dark.svg', 'fonts', 'img']);
const PUBLIC_DIRS = new Set(['fonts', 'img']);
for (const e of fs.readdirSync(site, { withFileTypes: true })) {
  const isPage = e.isFile() && /^[a-z0-9-]+\.html$/.test(e.name);
  const isKnown = PUBLIC_TOP.has(e.name) && (PUBLIC_DIRS.has(e.name) ? e.isDirectory() : e.isFile());
  if (!isPage && !isKnown) problems.push(`Unexpected item in public/: ${e.name}. Everything in public/ is published; only the pages, site.css, the logo, fonts/ and img/ belong there.`);
}

const files = walk(site).sort();

// ---- 3. Fonts ------------------------------------------------------------------
// IBM Plex Sans 1.1.0, copied unchanged from public/vendor/plex/ in
// Ianoneil/Document-Digester (branch app, commit 719484b), where the same
// fingerprints are recorded in vendor.lock.json.
const FONTS = {
  'fonts/IBMPlexSans-Regular.woff2':  'ba711a3085ff9f27440b6b9c4550cfc47c97bf36591d5da958b975bb3add8c1a',
  'fonts/IBMPlexSans-Medium.woff2':   '5660f8a658f8bb50dbc005232f885eadffd2bc1c235c4f6fbb63469d1f9cde6d',
  'fonts/IBMPlexSans-SemiBold.woff2': 'f78048030eab62e860efa39a0df79e2e5581bf122eb95b9bc42c0b8a4988d205',
  'fonts/IBMPlexSans-Italic.woff2':   '13284fab1821ba6e3652c1580fcf2bbfd8c9309520c69b3d1224dab40b37c597',
  'fonts/LICENSE.txt':                '7e6b2818edbd8f6a01ae80641cc8f16a51080d08fb4e532be3a0b6f74adb07da',
};
for (const [name, want] of Object.entries(FONTS)) {
  const f = path.join(site, name);
  if (!fs.existsSync(f)) { problems.push(`Font file missing: public/${name}.`); continue; }
  const got = sha256(fs.readFileSync(f));
  if (got !== want) problems.push(`Font file changed: public/${name} (fingerprint ${got}, expected ${want}).`);
}
for (const f of files) {
  const r = rel(f);
  const isFontDir = r.startsWith('fonts/');
  const isFontFile = /\.(woff2?|ttf|otf|eot)$/i.test(r);
  if ((isFontDir || isFontFile) && !(r in FONTS)) problems.push(`Unexpected ${isFontDir ? 'file in public/fonts/' : 'font file'}: public/${r}. Only the recorded IBM Plex Sans files and their licence may be published.`);
}

// ---- 3b. Tab icons and the link-preview picture ---------------------------------------
// The app's own tab icons, copied unchanged from public/img/ in
// Ianoneil/Document-Digester (branch app, commit bbaa00c), and the link-preview
// picture (1200x630: the logo citesavant-wordmark-dark.svg, unchanged, centred on
// the top bar's #0F1A14). public/img/ may hold these four files and nothing else.
const ICONS = {
  'img/logo.svg':         '9a9529869db5f89f1605fc2b44db5be17b96b0a3f161a97fddeb314cc0e6da41',
  'img/app-icon-32.png':  '2c7eec3ef43f4002a5b8408b28324c528abf203a638d18c92b15d13fb5916b86',
  'img/app-icon-180.png': '39bf583925e9693b7b9815028d5e7bcd24a30489b088c77dfa2f201f7e479174',
};
const PREVIEW = {
  'img/preview.png':      'af1cbc08e705140096d0c9b39693c02d70b951fc3de73f3bb6d1b97e78ad9f79',
};
const IMAGES = { ...ICONS, ...PREVIEW };
for (const [name, want] of Object.entries(IMAGES)) {
  const what = name in PREVIEW ? 'Link-preview picture' : 'Tab icon';
  const f = path.join(site, name);
  if (!fs.existsSync(f) || !fs.lstatSync(f).isFile()) { problems.push(`${what} missing: public/${name}.`); continue; }
  const got = sha256(fs.readFileSync(f));
  if (got !== want) problems.push(`${what} changed: public/${name} (fingerprint ${got}, expected ${want}).`);
}
const imgDir = path.join(site, 'img');
if (fs.existsSync(imgDir) && fs.lstatSync(imgDir).isDirectory()) {
  for (const e of fs.readdirSync(imgDir, { withFileTypes: true })) {
    if (!(e.isFile() && `img/${e.name}` in IMAGES)) problems.push(`Unexpected item in public/img/: ${e.name}. Only the recorded tab icons (logo.svg, app-icon-32.png, app-icon-180.png) and the link-preview picture (preview.png) may be published there.`);
  }
}

// ---- 4. vercel.json --------------------------------------------------------------
const EXPECTED_CONFIG = {
  $schema: 'https://openapi.vercel.sh/vercel.json',
  framework: null,
  buildCommand: 'node scripts/check-site.mjs',
  installCommand: null,
  outputDirectory: 'public',
  headers: [
    {
      source: '/(.*)',
      headers: [
        { key: 'Content-Security-Policy', value: "default-src 'none'; style-src 'self'; img-src 'self'; font-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'" },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'no-referrer' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
      ],
    },
  ],
};
try {
  const config = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
  if (JSON.stringify(config) !== JSON.stringify(EXPECTED_CONFIG)) {
    problems.push('vercel.json differs from the reviewed settings in scripts/check-site.mjs.');
  }
} catch (e) {
  problems.push(`vercel.json could not be read: ${e.message}`);
}

// ---- 1 and 2. Pages --------------------------------------------------------------
// Reads every tag of a page, with its attributes, respecting quoted values.
function tagsOf(html) {
  const tags = [];
  let i = 0;
  while (i < html.length) {
    const lt = html.indexOf('<', i);
    if (lt < 0) break;
    if (html.startsWith('<!--', lt)) { const end = html.indexOf('-->', lt + 4); i = end < 0 ? html.length : end + 3; continue; }
    const m = /^<\/?([A-Za-z][^\s/>]*)/.exec(html.slice(lt, lt + 200));
    if (!m) { i = lt + 1; continue; }
    let j = lt + m[0].length, quote = null;
    while (j < html.length) {
      const c = html[j];
      if (quote) { if (c === quote) quote = null; }
      else if (c === '"' || c === "'") quote = c;
      else if (c === '>') break;
      j++;
    }
    const closing = html[lt + 1] === '/';
    const attrs = [];
    if (!closing) {
      const re = /([^\s"'=<>\/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
      const body = html.slice(lt + m[0].length, j);
      let a;
      while ((a = re.exec(body))) attrs.push({ name: a[1].toLowerCase(), value: a[2] ?? a[3] ?? a[4] ?? '' });
    }
    tags.push({ name: m[1].toLowerCase(), closing, attrs });
    i = j + 1;
  }
  return tags;
}
const decode = s => s
  .replace(/&#x([0-9a-f]+);?/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);?/g, (_, d) => String.fromCodePoint(Number(d)))
  .replace(/&colon;/gi, ':').replace(/&sol;/gi, '/').replace(/&tab;/gi, '\t').replace(/&newline;/gi, '\n')
  .replace(/&amp;/gi, '&');

const FEEDBACK = 'mailto:citesavant_admin@proton.me';
const APP_HOST = 'app.citesavant.com';
// The site's own address, allowed only in the two link-preview address tags.
const SITE_HOST = 'www.citesavant.com';
const SITE_ADDRESS = `https://${SITE_HOST}/`;
const PREVIEW_ADDRESS_TAGS = new Set(['og:url', 'og:image']);
const pageAddress = page => rel(page) === 'index.html' ? SITE_ADDRESS : SITE_ADDRESS + rel(page);

// What is wrong with the address in a preview tag, or null if it is allowed.
function previewProblem(key, raw, page) {
  const value = decode(raw).trim();
  if (!value.startsWith(SITE_ADDRESS)) return `must start with ${SITE_ADDRESS}`;
  let u;
  try { u = new URL(value); } catch { return 'is not a valid address'; }
  if (u.protocol !== 'https:' || u.hostname !== SITE_HOST || u.port || u.username || u.password) return `must be on ${SITE_ADDRESS}`;
  if (u.search || u.hash || value.includes('?') || value.includes('#')) return 'carries a query or a fragment, which this site never needs';
  if (u.href !== value) return 'is not written plainly';
  const target = u.pathname === '/' ? 'index.html' : decodeURIComponent(u.pathname.slice(1));
  const file = path.join(site, target);
  const inside = path.relative(site, file);
  if (inside.startsWith('..') || path.isAbsolute(inside)) return 'points outside the site folder';
  if (!fs.existsSync(file) || !fs.lstatSync(file).isFile()) return 'points to a file that does not exist';
  if (key === 'og:url' && value !== pageAddress(page)) return `must be the page's own address, ${pageAddress(page)}`;
  if (key === 'og:image' && !(rel(file) in PREVIEW)) return 'must be the recorded link-preview picture';
  return null;
}
// Attributes that load or link to something.
const LINK_ATTRS = new Set(['href', 'src', 'srcset', 'action', 'formaction', 'poster', 'data', 'xlink:href', 'cite', 'background', 'ping', 'manifest', 'codebase', 'longdesc', 'imagesrcset']);

function linkProblem(raw, page) {
  const value = decode(raw).trim();
  if (value === FEEDBACK) return null;
  if (value.startsWith('#')) return null;                                   // a place on the same page
  if (/^[a-z][a-z0-9+.\-]*:/i.test(value.replace(/[\s\u0000-\u001f]/g, '')) || value.startsWith('//') || value.startsWith('\\')) {
    let u;
    try { u = new URL(value, 'https://citesavant.com/'); } catch { return 'is not a valid address'; }
    if (u.protocol === 'https:' && u.hostname === APP_HOST && !u.port && !u.username && !u.password) return null;
    return 'leads outside the site';
  }
  // A file of this site: it must exist inside public/.
  const target = value.split('#')[0].split('?')[0];
  if (value.includes('?')) return 'carries a query, which this site never needs';
  if (target === '') return null;
  const file = target.startsWith('/') ? path.join(site, target) : path.join(path.dirname(page), target);
  const inside = path.relative(site, file);
  if (inside.startsWith('..') || path.isAbsolute(inside)) return 'points outside the site folder';
  if (!fs.existsSync(file)) return 'points to a file that does not exist';
  return null;
}

const pages = files.filter(f => /\.html?$/i.test(f));
if (pages.length === 0) problems.push('No pages found in public/.');
for (const page of pages) {
  const where = `public/${rel(page)}`;
  const html = fs.readFileSync(page, 'utf8');
  if (/<\s*script/i.test(html)) problems.push(`${where}: holds a script.`);
  for (const tag of tagsOf(html)) {
    if (tag.closing) continue;
    if (tag.name === 'script') problems.push(`${where}: holds a <script> element.`);
    if (tag.name === 'style') problems.push(`${where}: holds an inline <style> element.`);
    if (tag.name === 'meta' && tag.attrs.some(a => a.name === 'http-equiv' && /refresh/i.test(a.value))) problems.push(`${where}: has a <meta http-equiv="refresh">, which can send readers elsewhere.`);
    if (tag.name === 'meta') {
      const key = decode((tag.attrs.find(a => a.name === 'property') || tag.attrs.find(a => a.name === 'name') || { value: '' }).value).trim().toLowerCase();
      for (const a of tag.attrs.filter(a => a.name === 'content')) {
        if (PREVIEW_ADDRESS_TAGS.has(key)) {
          const why = previewProblem(key, a.value, page);
          if (why) problems.push(`${where}: <meta ${key} content="${a.value}"> ${why}.`);
        } else if (/:\s*\/\/|^\s*\/\/|\\\\|www\.|citesavant\.com/i.test(decode(a.value))) {
          problems.push(`${where}: <meta${key ? ' ' + key : ''} content="${a.value}"> names an address. Only og:url and og:image may, and only ${SITE_ADDRESS}.`);
        }
      }
    }
    for (const a of tag.attrs) {
      if (a.name === 'style') problems.push(`${where}: <${tag.name}> has an inline style attribute.`);
      if (a.name.startsWith('on')) problems.push(`${where}: <${tag.name}> has an inline event handler (${a.name}).`);
      if (LINK_ATTRS.has(a.name)) {
        const values = /srcset$/.test(a.name) ? a.value.split(',').map(s => s.trim().split(/\s+/)[0]).filter(Boolean) : [a.value];
        for (const v of values) {
          const why = linkProblem(v, page);
          if (why) problems.push(`${where}: <${tag.name} ${a.name}="${v}"> ${why}. Allowed: the site's own pages, https://${APP_HOST} and ${FEEDBACK}.`);
        }
      }
    }
  }
}

if (problems.length) {
  console.error(`Deploy check failed (${problems.length} problem${problems.length > 1 ? 's' : ''}). Nothing was deployed.\n`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(`Deploy check passed: ${pages.length} pages, no scripts, inline styles or event handlers; links only to the site, the app and the feedback address; the site's own address only in the preview tags; ${Object.keys(FONTS).length} font files, ${Object.keys(ICONS).length} tab icons and the preview picture match their fingerprints; vercel.json matches the reviewed settings; nothing unexpected in the repository or in public/.`);
