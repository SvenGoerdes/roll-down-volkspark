# 0065: Cloudflare Turnstile für Bestenlisten-Einträge

- **Status:** Accepted (Code); Rollout wartet auf den Nutzer
- **Date:** 2026-10-18
- **Decided by:** user (Issue #77, „Jetzt umsetzen“, kein Deploy vor Rücksprache), Sonnet 5.5 (Umsetzung)
- **Built by:** Claude Sonnet 5.5
- **Commits:** siehe PR zu #77

## Context
`POST /scores` nimmt jede Zahl bis 10000 an. Wer die URL kennt, schreibt per `curl` beliebige Einträge in die Bestenliste.

## Decision
`POST /scores` verlangt ein Turnstile-Token, das der Worker bei Cloudflare (`siteverify`) prüft. Das gilt nur, wenn das Worker-Secret `TURNSTILE_SECRET` gesetzt ist. Ohne Secret verhält sich der Worker wie bisher, so gehen Frontend und Worker in beliebiger Reihenfolge live. Der Sitekey ist öffentlich (`TURNSTILE_SITEKEY` in `js/config.js`, leer = kein Widget). Das Widget lädt erst, wenn der Nutzer „Eintragen“ öffnet; Spielen und Lesen bleiben ohne Turnstile. Der Worker prüft das Token nach der Eingabeprüfung, damit ein Tippfehler im Namen das Einmal-Token nicht verbraucht. Nach jedem Absenden holt das Frontend ein neues Token. Gültig heißt zusätzlich: `hostname` ist `svengoerdes.github.io` und `action` ist `score` (Frontend setzt sie beim `render`), sonst 403. Beides lässt sich per `TURNSTILE_HOSTNAME`/`TURNSTILE_ACTION` überschreiben, nur für lokale Tests mit den Cloudflare-Testschlüsseln. Ist Cloudflare nicht erreichbar, lehnt der Worker mit 503 ab, er lässt nichts durch.

## Alternatives
- Signierter Lauf-Beweis (Replay oder Server-Spielstand): würde echte Scores beweisen, aber der Server müsste das Spiel nachrechnen. Zu groß für eine Freundes-Bestenliste (YAGNI).
- Nur Rate-Limit: gibt es schon (20/Stunde/IP); stoppt `curl` mit einer Zahl nicht.
- Eigenes Captcha / Passwort: mehr Aufwand, schlechtere Bedienung.

## Consequences
- **Ehrliche Grenze:** Turnstile stoppt `curl` und Bots. Es beweist **nicht**, dass jemand den Score erspielt hat. Wer im Browser per Dev-Tools `{ score: 9999 }` abschickt und das Widget löst, kommt weiterhin durch.
- Neue Abhängigkeit von Cloudflare Turnstile beim Eintragen; die CSP erlaubt dafür `challenges.cloudflare.com` (Skript und Frame).
- Test-Schlüssel von Cloudflare in den Tests, `fetch` gemockt, kein Netz.
- Rollout-Schritte in [operations.md](../operations.md).
