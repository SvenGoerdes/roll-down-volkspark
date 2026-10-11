# Roll Down Volkspark

Browser-Spiel: Eine Person rollt den Berg im Volkspark Friedrichshain runter und muss durch die Lücken in den Steinmauern.

- **Steuerung:** Wischen (Handy) oder Pfeiltasten / A–D (Desktop)
- **Powerups:** ⛑️ Helm (ein Crash frei), ⏳ Zeitlupe (5 s), ↔️ breite Lücken (7 s)
- **Jahreszeiten** wechseln alle 20 Mauern: 🌸 Pfützen machen rutschig, ☀️ schneller und doppelte Lücken, 🍂 Windböen, ❄️ Glatteis
- Tempo steigt mit der Zeit, Lücken werden enger.

## Lokal starten

```sh
python3 -m http.server 8000   # dann http://localhost:8000
bun test tests                 # Tests
```

Reine statische Seite (HTML, CSS, JS-Module), kein Build-Schritt. `index.html#debug` legt `window.rollDown` zum Testen frei.

## Ideen-Backlog

Der 💡-Button unten rechts schickt Ideen an einen Cloudflare Worker (`worker/`). Der legt sie als GitHub-Issue mit Label `idee` an:
https://github.com/SvenGoerdes/roll-down-volkspark/issues?q=is%3Aopen+label%3Aidee

```sh
cd worker
npx wrangler secret put GITHUB_TOKEN   # fine-grained Token: nur dieses Repo, Issues lesen & schreiben
npx wrangler deploy
```

Schutz gegen Spam: nur Anfragen von der Spielseite, max. 5 Ideen pro Stunde und IP, verstecktes Honeypot-Feld.
