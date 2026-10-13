# Roll Down Volkspark

Browser-Spiel: Ein Kind rollt den Berg im Volkspark Friedrichshain runter und muss durch die Lücken in den Steinmauern.
Spielen: https://svengoerdes.github.io/roll-down-volkspark/

- **Steuerung:** Wischen (Handy) oder Pfeiltasten / A–D (Desktop)
- **Powerups:** ⛑️ Helm (ein Crash frei, bis zu 3), ⏳ Zeitlupe (5 s), ↔️ breite Lücken (7 s)
- **Jahreszeiten** wechseln alle 20 Mauern, **Böden** (Erde, Schotter, Gras) unterwegs
- **Bestenliste** und **💡 Ideen-Button** laufen über einen Cloudflare Worker (`worker/`)

```sh
bun test tests   # Tests
```

Alles Weitere – Architektur, Betrieb, Entscheidungen, Verlauf – steht in [`.docs/`](.docs/README.md).
