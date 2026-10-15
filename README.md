# Letters for Later — Love for Mena

A mailbox of notes that wait. Write a letter, choose the day it should open, and
seal it. Until that day arrives it stays shut — then it opens, whenever you're
ready. Part of the **Love for Mena** collection.

**Live:** https://menaammarpro.github.io/love-mailbox/

## What it does

- **Write a letter** with an optional title and choose its **open date**
- Sealed letters wait, showing how many days are left
- On (or after) that day you can **open** the letter and read it
- Delete any letter, or empty the whole mailbox
- Everything is stored on the device only — no tracking, no network calls
- Installable PWA with offline support

## How it works

Letters live in `localStorage` on that device. A date in the past opens
immediately; a future date seals it until then.

## Files

- `index.html` — the page
- `css/theme.css` — shared love-theme (copied from `_love-theme/`)
- `css/app.css` — page-specific styles (the drawn envelopes)
- `js/theme-main.js`, `js/effects.js` — shared behaviour/effects
- `js/app.js` — mailbox logic
- `manifest.webmanifest`, `sw.js` — PWA
- `assets/` — favicon and icons

## Run locally

```powershell
py -m http.server 8000
```

Then visit http://localhost:8000.

## Deploy

Static site, deployed with GitHub Pages from `main`.

## License

Creative Commons BY-NC-ND 4.0 — see [`LICENSE`](LICENSE).
© 2026 Ammar (MenaAmmarPro). Made with care for Mena.
