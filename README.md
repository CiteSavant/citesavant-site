# citesavant.com

The homepage for CiteSavant: four plain pages (Home, Key Features, What’s Next,
Your Data) that describe the app and link to it at https://app.citesavant.com.

## Where it is served

Vercel serves the `public/` folder at https://citesavant.com, deployed from the
`main` branch of this repository. Nothing is built: the pages are published as
they are.

## It collects nothing

The site has no scripts, analytics, cookies, forms, accounts or third-party
code. Its fonts, styles, logo and tab icons are served from the site itself, and its
security policy (in `vercel.json`) lets the browser load nothing from anywhere
else. Search engines may list it.

Vercel, as the host, keeps its own short-lived request logs, as any web host
does. The site adds nothing to them.

## What is in it

| Path | What it is |
| --- | --- |
| `public/*.html` | The four pages, and `404.html`, the page shown for an address that doesn’t exist |
| `public/site.css` | All styling (the security policy allows no styles inside the pages) |
| `public/citesavant-wordmark-dark.svg` | The logo |
| `public/fonts/` | IBM Plex Sans and its licence (below) |
| `public/img/` | The browser-tab icons and the link-preview picture (below) |
| `vercel.json` | Vercel settings: the security headers, and the deploy check as the build step |
| `scripts/check-site.mjs` | The deploy check |

## Fonts

IBM Plex Sans 1.1.0 (SIL Open Font License 1.1, see `public/fonts/LICENSE.txt`),
the same files the CiteSavant app ships, copied unchanged from
`public/vendor/plex/` in Ianoneil/Document-Digester (branch `app`, commit
`719484b`). Their SHA-256 fingerprints:

| File | SHA-256 |
| --- | --- |
| `IBMPlexSans-Regular.woff2` | `ba711a3085ff9f27440b6b9c4550cfc47c97bf36591d5da958b975bb3add8c1a` |
| `IBMPlexSans-Medium.woff2` | `5660f8a658f8bb50dbc005232f885eadffd2bc1c235c4f6fbb63469d1f9cde6d` |
| `IBMPlexSans-SemiBold.woff2` | `f78048030eab62e860efa39a0df79e2e5581bf122eb95b9bc42c0b8a4988d205` |
| `IBMPlexSans-Italic.woff2` | `13284fab1821ba6e3652c1580fcf2bbfd8c9309520c69b3d1224dab40b37c597` |
| `LICENSE.txt` | `7e6b2818edbd8f6a01ae80641cc8f16a51080d08fb4e532be3a0b6f74adb07da` |

## Tab icons

The app’s own tab icons, copied unchanged from `public/img/` in
Ianoneil/Document-Digester (branch `app`, commit `bbaa00c`). Every page links
them in its head exactly as the app does. `public/img/` holds these three files,
the link-preview picture (below) and nothing else. Their SHA-256 fingerprints:

| File | What it is | SHA-256 |
| --- | --- | --- |
| `logo.svg` | The icon, drawn to any size | `9a9529869db5f89f1605fc2b44db5be17b96b0a3f161a97fddeb314cc0e6da41` |
| `app-icon-32.png` | The tab icon, 32×32 | `2c7eec3ef43f4002a5b8408b28324c528abf203a638d18c92b15d13fb5916b86` |
| `app-icon-180.png` | The home-screen icon on iPhone and iPad, 180×180 | `39bf583925e9693b7b9815028d5e7bcd24a30489b088c77dfa2f201f7e479174` |

## Link previews

When someone shares a link to the site, the page’s head gives the preview:
the title “CiteSavant: read closely, cite honestly”, the home page’s opening
sentence as its description, the page’s own address, and a picture. These are
the only places the site names its own address, `https://www.citesavant.com/`.

The picture, `public/img/preview.png`, is 1200×630: the logo
(`citesavant-wordmark-dark.svg`, unchanged and never stretched) centred on the
top bar’s dark green `#0F1A14`, with more clear space around it than the height
of its “c”. Its SHA-256 fingerprint:
`af1cbc08e705140096d0c9b39693c02d70b951fc3de73f3bb6d1b97e78ad9f79`.

## Page not found

Vercel shows `public/404.html` for any address the site doesn’t have. Because
that address can be anything, the page names its styles, logo, icons and links
from the top of the site (`/site.css`, `/index.html` and so on), so they load
wherever it is shown.

## The deploy check

Vercel runs `node scripts/check-site.mjs` before every deployment. The
deployment stops, and the live site stays as it was, if:

- a page holds a script, an inline style or an inline event handler;
- a page links anywhere except the site’s own pages, https://app.citesavant.com
  and the feedback address (mailto:citesavant_admin@proton.me);
- a page names the site’s own address, https://www.citesavant.com/, anywhere but
  its two link-preview address tags (`og:url`, which must be the page’s own
  address, and `og:image`, which must be the preview picture), or names any other
  address in its `<meta>` tags;
- a font file is missing, added or changed (its fingerprint differs);
- a tab icon or the preview picture is missing or changed (its fingerprint
  differs), or `public/img/` holds anything but the three tab icons and the
  preview picture;
- `vercel.json` differs from the reviewed settings;
- the top of the repository holds anything but `README.md`, `public/`,
  `scripts/`, `vercel.json` and `.gitignore` (so no `api/` folder,
  `package.json` or other server or build code);
- `public/` holds anything but the site’s pages (`404.html` among them, checked
  like every other page), `site.css`, the logo, `fonts/` and `img/`.

To run it yourself: `node scripts/check-site.mjs` (needs only Node). To change
the fonts, the tab icons, the preview picture or `vercel.json` on purpose, update
the check in the same commit.
