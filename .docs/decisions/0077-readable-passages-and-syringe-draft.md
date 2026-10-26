# 0077: Lesbare Durchfahrten und vorsichtiger Spritzenentwurf

- **Status:** Implemented on review branch; syringe art awaits user review
- **Date:** 2026-10-26
- **Decided by:** Nutzer (Kamera, Brückenfehler, Priorisierung und Umsetzung); GPT-6.1 Sol High (Darstellung und konservative Startwerte)
- **Built by:** Drei GPT-6.1 Sol High Agents in getrennten Worktrees; gemeinsame Prüfung durch Codex
- **Commits:** `fc2cf65`, `8b4b6fa`, `a8e1866` auf `codex/playability-review`

## Context

Die Position der Figur vor versetzten Lücken ist schwer einschätzbar. Außerdem bleibt der feste Oberbaum-Bogen bei veränderter Lückenposition oder Verbreiterung ohne stützende Pfeiler in der Durchfahrt hängen. Zusätzliche Hindernisse aus #34 sollen die Orientierung nicht weiter erschweren.

## Decision

Die Kamera verschiebt sich weich seitlich, ohne Drehung, Zoom oder Regeländerung. Ihr Anteil von 45 %, die Grenze von 1,4 Welteinheiten und die Zeitkonstante von 0,2 s stehen in `config.js`. Alle Projektionen verwenden denselben Kameraursprung; die inverse Bodentabelle bleibt unverändert.

Der vorhandene Oberbaum-Bogen wird horizontal an jeder tatsächlichen Öffnung ausgerichtet. Höhe und Bilder bleiben erhalten. Das ersetzt ausschließlich die feste mittige Bogenplatzierung aus ADR 0053/0054; Spritepipeline, Türme und bestehende Trefferprüfung bleiben bestehen.

Spritzen werden zunächst als seltene Randgefahr umgesetzt. Die Platzierung schützt bereits maximal verbreiterte Nachbarlücken und nahe Pickups. Wind, Eis, Pfützenrutschen und Schotter werden nicht mit ihnen gestapelt. Ein Treffer nutzt den bestehenden Helm-/Crash-Ablauf und einen kurzen sichtbaren Hinweis; zusätzliche Steuerungsungenauigkeit oder starke Sichtstörungen entfallen. Die Grafik liegt im Review-Branch zur Freigabe, bevor sie live integriert wird.

## Consequences

Die Durchfahrt wird verständlicher, ohne die bestehende Schwierigkeit über breitere Lücken oder langsamere Mauern zu verändern. Bogenproportionen folgen der Öffnung. Die Spritzen sind absichtlich sehr defensiv; stärkeren Ausweichdruck erst nach Probespielen entscheiden. Gemeinsame Nachweise und Grenzen: [Prüfbericht](../playability-review-2026-10-26.md).
