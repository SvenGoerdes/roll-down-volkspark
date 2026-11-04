# 0080: Cache-Busting per Versionsstempel im Pages-CI-Deploy (#14)

- **Status:** Accepted
- **Date:** 2026-10-28
- **Decided by:** Nutzer („Kleines Skript stempelt `?v=<commit>` in alle Imports, läuft in CI vor dem Pages-Deploy, kein Build-Schritt lokal“, Issue #14)
- **Built by:** Gemini 3.1 Pro (Subagent) auf `feat/cache-busting`
- **Commits:** dieser PR (#14)

## Context

GitHub Pages liefert statische Dateien mit einem 10-Minuten-Browser-Cache (`max-age=600`) aus. Direkt nach einem Deploy konnte ein neu geladenes `index.html` auf noch gecachte ältere CSS-, JS- oder Bild-Dateien treffen (beobachtet am 2026-10-14: riesige Icons, alte Pickups; bei neuen oder umbenannten ES-Modul-Exporten droht ein Startabbruch). Gleichzeitig soll lokal weiterhin ohne Build-Schritt direkt aus den Quelldateien entwickelt und getestet werden ([ADR 0001](0001-static-site-no-build.md)).

## Decision

Ein kleines Skript `tools/stamp-version.mjs` bündelt bei jedem Push auf `main` im CI-Job `deploy` (`.github/workflows/ci.yml`) die Laufzeit-Dateien nach `_site` (`buildPagesBundle`) und stempelt `?v=<short-sha>` idempotent an alle lokalen Datei-Referenzen:

- `stampHtml`: lokale `href`- und `src`-Attribute in `index.html` (`style.css`, `js/main.js`, `manifest.webmanifest`, Icons und Powerup-Bilder).
- `stampCss`: lokale `url(...)`-Verweise in `style.css`.
- `stampJs`: relative statische ES-Modul-Imports und Re-Exports (`from './…'`, `import './…'`), dynamische Imports (`import('./…')`) sowie lokale `assets/…`-Bildpfade (`.webp`, `.png`, `.jpg`, auch in Template-Strings und `url(...)`).
- Externe URLs (`https://…` wie Turnstile, `http://…`, `data:…`, `#…`) bleiben unverändert.

Lokal (`bun tools/serve.js`, `bun test tests`) werden die Quelldateien weiterhin direkt und ohne Build-Schritt ausgeführt.

## Alternatives

- **Service Worker:** Eigener Cache-Lebenszyklus und Update-Handshake im Browser; für das Vermeiden gemischter Dateien im 10-Minuten-Fenster nach einem Deploy unnötig fehleranfällig.
- **Bundler (Vite/esbuild/Rollup) mit Dateinamen-Hashes:** Widerspricht [ADR 0001](0001-static-site-no-build.md) und erfordert zusätzliche Tooling-Abhängigkeiten.
- **Versionsstempel im Repo committen:** Erzeugt Rauschen in Git-Diffs und Merge-Konflikte zwischen parallelen Feature-Branches.

## Consequences

- Nach einem Deploy zieht ein neues `index.html` garantiert die exakt zugehörigen `.css`-, `.js`- und `assets/…`-Dateien desselben Commits nach.
- `_site` enthält ausschließlich Laufzeit-Dateien (`index.html`, `style.css`, `manifest.webmanifest`, `js/*.js`, Laufzeit-Bilder in `assets/environment`, `assets/figures`, `assets/landmarks`, `assets/powerups` sowie die drei App-Icons); `.docs`, `tests`, `tools`, `worker` und `assets/src` werden nicht mit ausgeliefert.
- `tests/cache-busting.test.js` prüft die Stempel-Funktionen, Idempotenz sowie das erzeugte `_site`-Bundle gegen das echte Repository.
- In den GitHub-Repository-Einstellungen (*Settings → Pages → Build and deployment*) wird als Quelle `GitHub Actions` genutzt (`actions/upload-pages-artifact@v3` + `actions/deploy-pages@v4`).
