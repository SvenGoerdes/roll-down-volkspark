# 0078: Private Testversion vom Staging-Branch

- **Status:** Implemented; Access activation and CI deployment credential pending user login
- **Date:** 2026-10-27
- **Decided by:** Nutzer (Staging, ausschließlich eigener Zugang); Codex (Cloudflare und zusätzlicher JWT-Guard)
- **Built by:** GPT-6.1 Sol High (Packaging/CI), Codex (Access-Worker/Integration), unabhängiger Sol-High-Review
- **Commits:** `c4a9916` (Packaging/CI), `3e8212c` (isolierter Worker und JWT-Prüfung), folgende Origin-/Einrichtungsdokumentation auf `staging`

## Context

Der Nutzer möchte neue Spielstände auf einer festen Adresse am eigenen Gerät prüfen, ohne sie öffentlich freizugeben. GitHub Pages veröffentlicht bisher `main` aus dem öffentlichen Repository. Das Cloudflare-Konto und der Ideen-/Bestenlisten-Worker existieren bereits.

## Decision

`staging` wird separat als Cloudflare Worker mit Static Assets gehostet. Cloudflare Access soll den gesamten Worker und nur die bestätigte E-Mail schützen. Zusätzlich prüft der Worker vor **allen** Assets/APIs den signierten Access-JWT und dieselbe E-Mail. Ohne fertige Konfiguration bleibt die Website geschlossen; kein vorübergehend öffentlicher Upload. Der Frontend-Code erhält nur im Paket eine Same-Origin-API, separate Test-Bestenliste und deaktivierte Issue-Veröffentlichung.

GitHub Actions testet und paketiert jeden Staging-Push. Deployments sind auf diesen Branch und ein eigenes Environment begrenzt. Das Freigabeflag bleibt bis zum tatsächlichen Login-Test und zum Hinterlegen eines eigenen Deployment-Tokens ausgeschaltet. Die Produktion bleibt bei GitHub Pages.

## Alternatives

- Eine zweite GitHub-Pages-Adresse bietet für dieses öffentliche Repository keinen passenden persönlichen Login.
- Sites unterstützt private Momentaufnahmen, wäre aber ein weiterer Quell-/Publikationsweg außerhalb des gewünschten dauerhaft aktualisierten GitHub-Branches.
- Nur ein unbekannter Link oder Client-Passwortdialog schützt die ausgelieferten Spieldateien nicht ausreichend. Ein eigener Passwort-/Sessiondienst wäre zusätzliche Authentifizierungslogik; stattdessen wird Cloudflare Access mit serverseitiger Signaturprüfung verwendet.

## Consequences

Die Testwebsite ist von Produktionsdaten und -Deployments getrennt. Der Quellcode im öffentlichen Repository bleibt öffentlich. Access/Zero-Trust-Einrichtung und ein eng begrenzter CI-Token benötigen einmalig die persönliche Kontokonfiguration. Solange diese fehlen, existiert die Adresse, liefert aber kein spielbares Frontend. [Stand und Abschlussanleitung](../staging.md).
