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
