# Spritzen zum Ausweichen – lokaler Entwurf für #34 / #35 / #36

Stand 26.10.2026. Priorisierung und Umsetzung autorisiert vom Nutzer; Regeln und technische Umsetzung durch GPT-6.1 Sol High im eigenen Worktree. **Grafik ist ein prüfbarer Entwurf, vor Merge/Live-Integration braucht sie die Sichtfreigabe des Nutzers.** Keine Party-Edition, Profile, D1-Änderung oder Veröffentlichung.

## Regeln und Abwägung

- Frühestens ab Mauerindex 8 (neunte Mauer); bis Index 11 zunächst 8 % Kandidatenchance, danach 18 %. Mindestens fünf Mauerindizes Abstand zwischen Kandidaten, die tatsächlich platziert wurden. Die Auswahl wird aus bestehender Lückengeometrie gehasht und braucht keinen zusätzlichen Zufallswurf.
- Platzierung in der Mitte zwischen zwei bereits bekannten Mauern, mindestens 6 Welteinheiten von beiden Ebenen entfernt. Am Rand bei x = ±3,43, Kollisionsradius 0,32; die Figur nutzt wie an Mauern Radius 0,525.
- Geschützt ist die komplette Verbindung aller legalen Figurenmittelpunkte in **beiden maximal verbreiterten Nachbarlücken** (auch Sommer-Doppellücken), zusätzlich 0,35 Einheiten Driftreserve. Ein später eingesammeltes ↔️-Pickup kann dadurch keine vorher sichere direkte Verbindung gefährlich machen. Kein passender Randplatz: keine Spritze. Enge/späte Lücken und große Lückenwechsel erzeugen keine zusätzliche Pflichtbewegung.
- Keine Spritzen bei Herbstwind, Wintereis, auf Schotter oder in den ersten beiden Mauern einer Jahreszeit. Eine vorherige Pfütze innerhalb von 45 Einheiten schließt den Kandidaten aus; dies deckt die normale Rutschzeit ab. Nahe Pickups werden seitlich freigehalten, damit keine Belohnung in eine Spritze lockt.
- Auch der **tatsächliche** Laufzustand wird geprüft: Helmtreffer können bestandene und gespawnte Mauern auseinanderlaufen lassen. Bei tatsächlichem Herbst/Winter, Pfützenrutschen oder Schotter werden noch geplante Spritzen entfernt. Diese vorsichtige Einschränkung verhindert das Stapeln von Gefahren; sie ist bewusst Teil dieser ersten Balance.
- Eine Spritze wird einmal beim Überqueren der Spielerebene aufgelöst, auch bei einem Ausweichmanöver. Ein Treffer verbraucht genau einen Helm und setzt die Perfekt-Serie zurück. Ohne Helm endet die Runde über denselben Crash-Ablauf wie sonst. Entfernung zur Mauerebene verhindert doppelte Treffer im normalen, auf 1/30 s begrenzten Frame.
- Der Treffer zeigt 0,85 s lang „Spritze!“ nahe der Figur. Der vorhandene kurze Crash-Ruck/Blitz bleibt; keine zusätzliche Unschärfe, Sichtdrehung, Geschwindigkeits- oder Steuerungsänderung. `impact-effect.js` hält nur Ablauf und das Zeichnen eines vorberechneten Bildes und ist auch für einen späteren zweiten Effekt verwendbar.
- Bestehende Geschwindigkeitskurve, Mauerabstände, Lücken, Pickup-Chancen und Helmregeln bleiben unverändert. Die Spritzenprobe kann den bestehenden Entfernungstrack früher erweitern; ein Vergleich mit `--no-syringes` führt dieselben Planungs-/Bodenproben aus und isoliert die Kollisionswirkung.

## Grafik und lokale Prüfung

`render-syringes.js` malt einmal ein kleines 192×96-Canvas: heller kantiger Körper, dunkle Kontur, türkisfarbene Füllung und orangefarbener Stempel. Kein Mensch, keine Verletzung und kein Blut. Keine Bildgenerierung, keine neue WebP-Datei oder Bibliothek. Der Laufzeitpfad kopiert den vorberechneten Sprite und zeichnet einen kleinen Schatten. Eine Mindestbreite von 34 CSS-Pixeln bei 390 Pixeln Spielbreite hält die Silhouette aus der Entfernung erkennbar; sie blendet zwischen z=45 und 30 ein. Die Trefferanzeige ist ein zweites vorbereitetes Canvas. Zusammen ca. 0,23 MiB unkomprimierter RGBA-Speicher.

Die bestehenden Figuren, Bauwerke und Landschaften behalten ihren Look. Die neue comichafte Gegenstandsgrafik ist ausdrücklich noch zur Freigabe vorgesehen.

Bun-Server auf eigenem Port 8773, im isolierten Worktree. Reproduzierbare, eingefrorene Debug-Ansichten:

- `http://127.0.0.1:8773/?preview=summer&width=390&height=844&syringe=near#debug`
- Dieselbe URL mit `syringe=approach` bzw. `syringe=impact`.
- `http://127.0.0.1:8773/?preview=spring&width=320&height=568&syringe=near#debug`

Die zusätzlichen Fixture-Parameter funktionieren ausschließlich mit dem vorhandenen `preview`/`#debug`-Modus; sie verändern normale Runden nicht. Browserbilder liegen lokal unter `/private/tmp/syringe-{near,approach,impact}-390x844.png` und `/private/tmp/syringe-near-320x568.png`. 390×844 Sommer und 320×568 Frühling im echten Browser visuell geprüft, keine Konsolenfehler. Das ist keine Prüfung auf echten Telefonen/Safari und keine neue FPS-Messung.

## Validierung und Grenzen

Reine Tests decken sichere Korridore über 10.000 generierte Nachbarpaare, frühe Einführung, Saisonwechsel, Eis/Wind/Pfützen/Schotter, Pickup-Abstände, einmalige Treffer, Helmverbrauch, Crash ohne Helm und Effektablauf ab. Der konkrete Review-Grenzfall mit einem später aktivierten Verbreiterungs-Pickup ist als Regression enthalten.

Die Balance-Simulation benutzt dieselben Platzierungs-/Trefferregeln wie die Laufzeit. `--no-syringes` schaltet nur die Objekte/Treffer ab. Der vorhandene Bot folgt direkten Lückenwegen und trifft diese konservativ platzierten Randhindernisse deshalb voraussichtlich selten oder gar nicht; ein unveränderter Median beweist keine subjektive Ausweichschwierigkeit. Die Funktion ist absichtlich eine seltene Randgefahr und erfordert noch echtes Probespielen, wenn stärkerer Ausweichdruck gewünscht wird. Keine spätere Balanceverschärfung ohne neue Entscheidung.

Abschließender Stand dieses Branches: **177 Tests grün**, Browser-Bundle mit 50 Modulen erfolgreich. Je 1.000 Simulationsrunden mit und ohne Spritzen: Median **123**, p90 **201**, jeweils zwei Runden am Limit 400. Mit Spritzen **1,5 gespawnt / 0,9 passiert pro Lauf**, **1,12 pro 100 gespawnte Mauern**, **0 Bot-Treffer**. Die tatsächlichen Pickup-Häufigkeiten liegen bei Helm 5,03 %, Zeitlupe 10,15 %, Verbreiterung 10,01 % je berechtigter Mauer; die konfigurierten Chancen sind unverändert. Aktive Rutsch-/Saison-/Schotterzustände entfernen einen Teil der vorher geplanten Objekte, deshalb liegt „passiert“ unter „gespawnt“.
