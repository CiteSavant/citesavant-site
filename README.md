# citesavant.com

The homepage for CiteSavant: four plain pages (Home, Key Features, What’s Next,
Your Data) that describe the app and link to it at https://app.citesavant.com.

## Where it is served

Vercel serves the `public/` folder at https://citesavant.com, deployed from the
`main` branch of this repository. Nothing is built: the pages are published as
they are.

## It collects nothing

The site has no scripts, analytics, cookies, forms, accounts or third-party
code. Its fonts, styles and logo are served from the site itself, and its
security policy (in `vercel.json`) lets the browser load nothing from anywhere
else. Search engines may list it.

Vercel, as the host, keeps its own short-lived request logs, as any web host
does. The site adds nothing to them.

## What is in it

| Path | What it is |
| --- | --- |
| `public/*.html` | The four pages |
| `public/site.css` | All styling (the security policy allows no styles inside the pages) |
| `public/citesavant-wordmark-dark.svg` | The logo |
| `public/fonts/` | IBM Plex Sans and its licence (below) |
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

## The deploy check

Vercel runs `node scripts/check-site.mjs` before every deployment. The
deployment stops, and the live site stays as it was, if:

- a page holds a script, an inline style or an inline event handler;
- a page links anywhere except the site’s own pages, https://app.citesavant.com
  and the feedback address (mailto:citesavant_admin@proton.me);
- a font file is missing, added or changed (its fingerprint differs);
- `vercel.json` differs from the reviewed settings;
- the top of the repository holds anything but `README.md`, `public/`,
  `scripts/`, `vercel.json` and `.gitignore` (so no `api/` folder,
  `package.json` or other server or build code);
- `public/` holds anything but the site’s pages, `site.css`, the logo and
  `fonts/`.

To run it yourself: `node scripts/check-site.mjs` (needs only Node). To change
the fonts or `vercel.json` on purpose, update the check in the same commit.
