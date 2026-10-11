# Roll Down Volkspark

Browser-Spiel: Eine Person rollt den Berg im Volkspark Friedrichshain runter und muss durch die Lücken in den Steinmauern.

- **Steuerung:** Wischen (Handy) oder Pfeiltasten / A–D (Desktop)
- **Powerups:** ⛑️ Helm (ein Crash frei), ⏳ Zeitlupe (5 s), ↔️ breite Lücken (7 s)
- **Jahreszeiten** wechseln alle 20 Mauern: 🌸 Pfützen machen rutschig, ☀️ schneller und doppelte Lücken, 🍂 Windböen, ❄️ Glatteis
- Tempo steigt mit der Zeit, Lücken werden enger.

## Lokal starten

```sh
python3 -m http.server 8000   # dann http://localhost:8000
bun test                       # Logik-Tests
```

Reine statische Seite (HTML, CSS, JS-Module), kein Build-Schritt. `index.html#debug` legt `window.rollDown` zum Testen frei.
