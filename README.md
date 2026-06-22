# Net-Worth

Personal net worth tracking app (**Worth Watchers**) — assets, debts, and trends over time with Firebase auth and Google Charts.

**Repository guide (for development / AI sessions):** [docs/REPOSITORY.md](docs/REPOSITORY.md)

## Local development

```bash
npm install    # uses project-local .npm-cache (see .npmrc)
npm run build  # concat + babel + minify → src/uglify*.js
npm start      # http://localhost:3000/
```

If `npm install` fails with `EACCES` on `~/.npm/_cacache`, the project `.npmrc` should avoid that. Otherwise: `sudo chown -R $(whoami) ~/.npm`

## URL parameters (main app)

Open the dashboard on a specific month by adding `month` to the query string. The value is **`YYYYMM`** (year + zero-padded month). A hyphen is optional and is stripped, so `202606` and `2026-06` both work.

| URL | Opens |
|-----|--------|
| `https://trevordowdle.github.io/Net-Worth/?month=202606` | June 2026 |
| `http://localhost:3000/?month=202512` | December 2025 |

**Behavior**

- On load, the header carousel centers on that month and loads its data.
- If `month` is missing, invalid, or out of range (month not 1–12), the app falls back to the current calendar month.
- After the first carousel navigation (arrows or swipe), the `month` parameter is removed from the address bar via `history.replaceState` so later navigation does not keep rewriting the URL.

Month navigation on the **profile** page (`/profile/`) uses the in-app prev/next controls only; there is no `month` URL parameter there. The profile does support `?user={firebaseUid}` for viewing a specific user’s data (see [docs/REPOSITORY.md](docs/REPOSITORY.md)).
