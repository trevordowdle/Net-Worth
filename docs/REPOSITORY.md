# Net-Worth Repository Guide

Reference document for understanding and working on this codebase in future sessions.

## Overview

**Net-Worth** (branded in the UI as **Worth Watchers**) is a personal finance web app for tracking monthly **assets**, **debts**, and **net worth** over time. Users sign in with Firebase, enter line items per month, and view summaries and charts.

| Item | Detail |
|------|--------|
| **Repository** | [github.com/trevordowdle/Net-Worth](https://github.com/trevordowdle/Net-Worth) |
| **Public deployment** | [trevordowdle.github.io/Net-Worth/](https://trevordowdle.github.io/Net-Worth/) (GitHub Pages) |
| **License** | ISC (`package.json`); terms page also references MIT for software |
| **Runtime** | Static frontend + Firebase backend; optional local Node static server |

There is no backend API in this repo—all persistence goes through **Firebase Realtime Database** and **Firebase Authentication**.

---

## Technology Stack

| Layer | Technology | Notes |
|-------|------------|--------|
| UI framework | [Cycle.js](https://cycle.js.org/) v6 + [@cycle/isolate](https://github.com/cyclejs/cyclejs/tree/master/isolate) | Functional reactive UI; `Cycle.run`, virtual DOM via `CycleDOM` |
| Reactive streams | RxJS v4 | `Rx.Observable`, event streams from DOM |
| DOM helpers | jQuery 1.12 | Materialize plugins, imperative DOM updates alongside Cycle |
| CSS / components | Materialize CSS 0.97.7 | Layout, modals, side nav, carousel, toasts |
| Auth | Firebase JS 3.5 + Firebase UI 0.5 | Google + email sign-in; popup flow on login |
| Database | Firebase Realtime Database | Per-user tree at `/{uid}/` |
| Charts | Google Charts | Line charts (net worth trend); pie charts on profile |
| Build | Gulp 4 | Concat → Babel (`@babel/preset-env`) → uglify into `src/` |
| Local server | `server.js` | Plain `http` static file server on port **3000** |

Dependencies are only in `devDependencies` (Gulp toolchain). The app loads libraries from CDNs in HTML—no bundler for vendor code.

---

## Repository Layout

```
Net-Worth/
├── index.html              # Main app entry (loads src/uglify.js)
├── terms.html              # Terms of service / privacy (static)
├── server.js               # Local static file server (:3000)
├── package.json
├── gulpfile.js             # Build: concat + babel + uglify
│
├── js/                     # Source modules (edit these)
│   ├── main.js             # App bootstrap, page layout, auth gate
│   ├── login.js            # Login screen + Firebase UI
│   ├── utility.js          # Firebase init, data model, CRUD helpers
│   ├── sidebar.js          # Side nav, lists, chart population
│   ├── modal.js            # Add / edit / remove entry modals
│   ├── carousel.js         # Month carousel in header
│   └── plugins.js          # Large file: Waves + Materialize-related code
│
├── src/                    # Build output (committed; regenerate with Gulp)
│   ├── concat.js           # Unminified main bundle
│   ├── uglify.js           # Production bundle for index.html
│   ├── concatProfile.js
│   └── uglifyProfile.js    # Production bundle for profile
│
├── css/
│   ├── main.css            # App layout, carousel, charts, side nav
│   └── login.css           # Login page styling
│
├── profile/                # Secondary “profile” view
│   ├── index.html
│   ├── js/main.js          # Profile-specific Cycle app + charts
│   └── css/main.css
│
└── docs/
    └── REPOSITORY.md       # This file
```

**Not in repo (expected at runtime):** `img/` (e.g. `logo2.png`, `anony.jpg`) referenced by HTML/JS; `404.html` referenced by `server.js` on missing files.

`package.json` declares `"directories": { "doc": "docs" }` for documentation.

---

## Application Surfaces

### 1. Main app (`index.html`)

**Authenticated flow:**

1. `utility.js` initializes Firebase and Google Charts on load.
2. `main.js` `initApp()` listens to `firebase.auth().onAuthStateChanged`.
3. If signed in: `utility.setDatabase(user.uid)`, then `Cycle.run(page, drivers)`.
4. If signed out: `Cycle.run(loginModule, drivers)` unless `?user=test` triggers a dev auto-login (see **Caveats**).

**UI composition (`page`):**

- `headerModule` — carousel (month picker), `sideNavModule`, two `modalModule` instances (add + edit).
- `mainModule` — net worth summary row, line chart (`#curve_chart`), placeholder columns for asset/debt charts.

**Side nav:** collapsible Assets / Debts lists; floating “+” opens add modal; profile image links to `profile/`.

### 2. Profile (`profile/index.html`)

Shareable/historical view for a user:

- Loads `../src/uglifyProfile.js` (built from `js/utility.js` + `profile/js/main.js`).
- Auth: requires `?user={uid}` in URL **or** signed-in user (then URL is updated via `history.replaceState`).
- Month navigation (arrows), toggle Net Worth / Assets / Debts line charts, asset/debt pie charts.
- Viewing another user’s profile (`?user=` without matching login) sets `utility.profileEdit = false` (read-only; no name edit, logout hidden).

### 3. Login (`login.js`)

Green full-page login; Firebase UI in `#firebaseui-auth-container`. Providers: Google, email. Terms link to `terms.html`.

---

## Architecture

```mermaid
flowchart TB
  subgraph Browser
    HTML[index.html / profile/index.html]
    Bundle[src/uglify.js or uglifyProfile.js]
    Cycle[Cycle.js components]
    jQ[jQuery + Materialize]
    Charts[Google Charts]
  end

  subgraph Firebase
    Auth[Firebase Auth]
    DB[(Realtime Database /uid/...)]
  end

  HTML --> Bundle
  Bundle --> Cycle
  Cycle --> jQ
  Cycle --> Charts
  Cycle --> Auth
  utility[utility.js] --> DB
  Auth --> utility
```

**Pattern:** Cycle components render virtual DOM and wire DOM events to Rx streams. **Data sync** is largely imperative: `utility.watchData` / `watchDataProfile` subscribe to Firebase `on("value")`, then jQuery/DOM functions (`populateNetWorthValues`, `drawLineGraph`, etc.) update the page.

**Global state:** `userData` and `userDatabase` are module-level variables in `utility.js` (and used across concatenated files).

---

## Firebase Data Model

Each user’s data lives at:

```
/{firebaseAuthUid}/
  displayName: string (optional)
  photoURL: string (optional)
  entries/
    {YYYYMM}/          # e.g. "201612" = December 2016
      Asset/
        {name}: number
      Debt/
        {name}: number
      NetWorth: number | null    # computed on write
      Assets: number | null
      Debts: number | null
```

**Month key format:** `utility.getReferenceStr(month, year)` → `year + zeroPaddedMonth` (e.g. `2016` + `12` → `"201612"`).

**Writes:** `utility.updateData(entry)` merges asset/debt line items, recomputes totals via `getNetWorth()`, and `userDatabase.update(updateObj)` with paths like `entries/201612/Asset/Savings`.

**Reads:** `watchData` keeps `userData.entries` in sync; `getDataObj()` picks the current carousel month, falls back to previous month if current has no `NetWorth` (shown greyed via `entryGrey`).

Firebase config (including `apiKey`) is in `js/utility.js`—standard for client Firebase apps; security rules are not in this repo.

---

## Key Modules (where to change what)

| File | Responsibility |
|------|----------------|
| `js/utility.js` | Firebase init, `setDatabase`, `updateData`, `getDataObj`, `formatEntry`, month averages (1/3/6 mo), profile vs main chart package loading |
| `js/main.js` | Auth routing, `page` / `headerModule` / `mainModule`, email verification on first login |
| `js/login.js` | Firebase UI config, login layout |
| `js/sidebar.js` | Side nav VTree, `populateNetWorthValues`, `drawLineGraph`, `drawGraph` (pie, main app) |
| `js/modal.js` | Add/update/remove handlers (`addClick`, `updateClick`, `removeClick`), validation toasts |
| `js/carousel.js` | Materialize carousel for month selection; updates `userData.currentMonth` / `currentYear` |
| `js/plugins.js` | Third-party UI behavior (very large); avoid editing unless necessary |
| `profile/js/main.js` | Profile layout, `populateNetWorthGraph`, profile line/pie charts, profile auth URL handling |

**Edit workflow:** change files under `js/` (and `profile/js/`), run Gulp, commit updated `src/uglify*.js` if that is the project convention (built artifacts are present in the repo).

---

## Build and Run

### Install (Gulp toolchain)

```bash
npm install
```

The repo includes `.npmrc` with `cache=.npm-cache` so installs use a **project-local npm cache**. Use this if you see `EACCES` / `EEXIST` errors under `~/.npm/_cacache` (often from an old `sudo npm` run). To repair the global cache instead: `sudo chown -R $(whoami) ~/.npm`.

### Build bundles

```bash
npm run build
# equivalent: npx gulp
```

| Gulp task | Input | Output |
|-----------|--------|--------|
| Default (main) | `js/*.js` (alphabetical glob order) | `src/concat.js`, `src/uglify.js` |
| Profile | `js/utility.js` + `profile/js/main.js` | `src/concatProfile.js`, `src/uglifyProfile.js` |

Concat order for main bundle (glob): `carousel.js`, `login.js`, `main.js`, `modal.js`, `plugins.js`, `sidebar.js`, `utility.js`.

### Local development server

```bash
npm start
# Serves at http://localhost:3000/
```

`server.js` maps `/` and `/Net-Worth` → `index.html`, `/Net-Worth/profile` → `profile/index.html`. Paths assume deployment under a `/Net-Worth` base on GitHub Pages.

### Tests

`npm test` is a placeholder (exits with error). No automated test suite in the repo.

---

## User Flows (quick reference)

| Flow | Entry | Behavior |
|------|--------|----------|
| Sign in | `/` or `/Net-Worth` | Firebase UI → main dashboard |
| Add entry | Side nav “+” | Modal → `utility.updateData` → Firebase + UI refresh |
| Edit entry | Hover edit icon on line item | `#modal2` → update |
| Remove entry | Edit modal “REMOVE” | Sets value `null`, removes DOM node |
| Change month | Header carousel arrows | Updates current month, reloads data/charts |
| View profile | Side nav profile image | `profile/` with own uid |
| Share profile | `profile/?user={uid}` | Read-only view of that user’s history |

---

## Deployment

- **GitHub Pages** at `https://trevordowdle.github.io/Net-Worth/` (see `terms.html`).
- Static assets only; Firebase project `networth-8b077` (see `utility.js`).
- HTML references built files `src/uglify.js` and `src/uglifyProfile.js`, not raw `js/` sources.

---

## Caveats and Technical Debt

1. **Legacy stack** — Firebase 3.x, Cycle.js 6, RxJS 4, Materialize 0.97, jQuery 1.12. Upgrades would be a large migration.
2. **Built artifacts in git** — Production loads `src/uglify*.js`; remember to rebuild after editing `js/`.
3. **Dev test login** — `?user=test` on the main app auto-signs in with hardcoded `test@test.com` / `joejoe` in `main.js`. Remove or guard before any public fork.
4. **Mixed paradigms** — Cycle for structure, jQuery for Materialize and many updates. New features should follow existing patterns in the same file/module.
5. **Missing assets** — References to `img/logo2.png`, `img/anony.jpg`; ensure they exist for local/GitHub Pages hosting.
6. **Security rules** — Firebase database rules are not versioned here; behavior depends on Firebase console configuration.

---

## Common Tasks for Future Sessions

| Task | Where to look |
|------|----------------|
| Change auth providers | `js/login.js` → `uiConfig.signInOptions` |
| Change data shape / calculations | `js/utility.js` → `updateData`, `getNetWorth`, `getDataObj` |
| Change main dashboard layout | `js/main.js`, `js/sidebar.js`, `css/main.css` |
| Change profile charts | `profile/js/main.js` → `drawLineGraph`, `drawPieGraphs` |
| Fix modal validation | `js/modal.js` → `toastMap`, `addClick` |
| Update dependencies / CDN URLs | `index.html`, `profile/index.html` |
| Fix local routing | `server.js` path mappings |

---

## File → Concern Index

```
Auth gate .............. main.js, profile/js/main.js
Firebase config ........ utility.js
CRUD / totals .......... utility.js, modal.js
Lists & sidebar ........ sidebar.js
Month picker ........... carousel.js
Login UI ............... login.js
Profile-only UI ........ profile/js/main.js
Styles ................. css/main.css, css/login.css, profile/css/main.css
Build .................. gulpfile.js → src/
Local server ........... server.js
Legal .................. terms.html
```

---

*Last documented from repository review: May 2026.*
