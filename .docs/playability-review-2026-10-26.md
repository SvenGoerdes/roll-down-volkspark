# Spielbarkeit: Brücke, Kamera und Spritzen

Stand 26.10.2026, gemeinsamer Review-Branch `codex/playability-review` auf Basis von `66b59d7`. Der Nutzer hat die drei Arbeiten und die Umsetzung durch Sol High in getrennten Worktrees beauftragt. Die neuen Spritzenbilder bleiben gemäß #34 bis zur Sichtfreigabe ein Entwurf. Kein Merge oder Produktionsrollout gehört zu diesem Prüfstand.

## Änderungen und Herkunft

- Oberbaumbrücke: Bogenfüße folgen den tatsächlichen Öffnungen, einschließlich seitlicher, doppelter und verbreiterter Lücken. Sol-High-Commit `a9ec072`, im gemeinsamen Branch `fc2cf65`. [Ursache und Bildprüfung](oberbaum-opening-fix-2026-10-26.md).
- Kamera: weiches seitliches Mitziehen zu 45 %, begrenzt auf 1,4 Welteinheiten; konsistente Projektion für Boden, Bauwerke, Eis und Effekte. Sol-High-Commit `11dedc1`, integriert als `8b4b6fa`. [Umsetzung und Messungen](camera-follow.md).
- Spritzen: seltene Randhindernisse, einmaliger Helmverbrauch oder Game Over, kurzer lesbarer Hinweis. Sol-High-Commit `002bbff`, integriert als `a8e1866`. [Regeln, Artvorschau und Balance](syringe-obstacles.md).

Die Integration erhält die neue Brückengeometrie und den Kameraversatz gemeinsam. Der unabhängige Code-Review fand einen Platzierungsfehler mit später aktivierter Lückenverbreiterung; der abschließende Spritzenstand schützt deshalb schon bei der Platzierung alle legalen Zentren der maximal verbreiterten Nachbarlücken. Eine konkrete Regression und 10.000 generierte Nachbarpaare decken diesen Fall ab.

## Gemeinsame Prüfung

- `bun test tests`: **184 pass, 0 fail**, 45.910 Assertions in 25 Dateien.
- Browser-Bundle: **50 Module**, erfolgreich; `git diff --check` ohne Befund.
- Chrome bei **390×844 und 375×667**, beide Spielmodi: Figur links/rechts, normale/verbreiterte Öffnung und Auslaufen des Effekts, mittiger Neustart, einmaliger Spritzentreffer mit Helm, Game Over ohne Helm, verfehlte Spritze und Ausschlüsse bei Herbst/Winter. Keine JavaScript-Fehler. Die gerenderte Figurenposition bestätigt den Kameraversatz; der Retry-Anker liegt jeweils exakt mittig.
- Separate Brückenprüfung mit Original-WebPs: **45/45** Varianten ohne ungestützte Bogenfußpixel; dieselbe Prüfung am Ausgangsstand findet 39 Fehlerfälle. Die Agenten prüften zusätzlich 320×568, alle Jahreszeiten sowie Winterböden und Intro/Tastatureingaben.
- Kurzer gemeinsamer Leistungstest: 390×844 bei DPR 2, vierfache CPU-Drosselung, drei Sekunden je Theme ab Mauer 36. Frame-Median/p95 jeweils **16,7/16,7 ms**. Update/Render p95 **3,3 ms** im Volkspark und **4,8 ms** in der Berlin-Tour; einzelne Spitzen bis 40,2/68,3 ms, auch die Basis zeigte Spitzen. Dies ist keine Zusage für echte Telefonhardware.
- Je **1.000** Balance-Runden mit und ohne Spritzen: Median **123**, p90 **201** Mauern, jeweils zwei Runden am Limit 400. **1,12** geplante Spritzen je 100 gespawnte Mauern, im Schnitt **0,9 tatsächlich passierte Spritzen pro Lauf**. Kein Bot-Treffer; der Bot folgt dem geschützten direkten Weg und beweist daher keinen subjektiven Ausweichdruck.

Die vollständige Browserprüfdatei liegt lokal unter `/private/tmp/roll-down-playability-review-20261026/checks.json`. Debugvorschauen sind reproduzierbar über `tools/oberbaum-preview.html` sowie `?preview=summer&width=390&height=844&syringe=near#debug` und `syringe=impact`.

## Offene Prüfung

Der Nutzer soll die Spritzenoptik und das tatsächliche Spielgefühl prüfen. Die Platzierung ist bewusst sehr defensiv und tritt nur in sicheren Frühjahr-/Sommerabschnitten auf. Echte Mobilgeräte, Safari und längeres Probespielen fehlen. Cache-Busting #14 und die weiteren priorisierten Features gehören zu späteren Arbeiten.
