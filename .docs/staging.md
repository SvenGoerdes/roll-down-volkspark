# Private Staging-Version

Stand: 27.10.2026. Der Nutzer möchte eine separat gehostete Testversion vom Branch `staging`, die ausschließlich sein bestätigtes E-Mail-Konto betreten darf. Der Branch startet mit dem geprüften Stand von PR #99. Die produktive GitHub-Pages-Version wird weiter aus `main` veröffentlicht.

## Aktueller Einrichtungsstand

- Branch: `staging`; Worker: `roll-down-staging`.
- Adresse: <https://roll-down-staging.roll-down-ideas.workers.dev>.
- Eigene KV-Bestenliste `roll-down-staging-LEADERBOARD`, Binding `LEADERBOARD`; keine Produktionsdaten oder GitHub-Ideen-Schreibzugriffe.
- Worker und 105 freigegebene Laufzeitdateien sind hochgeladen. Der zusätzliche Zugriffsschutz liefert ohne vollständige Access-Konfiguration ausschließlich **503**, keine Spieldateien. Dies wurde extern für HTML, JavaScript, Bilder und API geprüft.
- **Noch nicht benutzbar:** Cloudflare Access ist im Konto bisher nicht aktiviert. Die vorhandene CLI-Anmeldung kann Workers verwalten; die Access-Einrichtung benötigt die persönliche Dashboard-Anmeldung bzw. passende Access-Verwaltungsrechte.
- GitHub-Environment `staging` erlaubt ausschließlich diesen Branch. `CLOUDFLARE_ACCOUNT_ID` ist gesetzt, `STAGING_DEPLOY_ENABLED` bewusst `false`. Ein langfristiger Deployment-Token als Environment-Secret fehlt noch. Die Pipeline testet und paketiert bis dahin, veröffentlicht aber nicht automatisch.

Der Zugangsschutz gilt für die gehostete Website. Das GitHub-Repository und der Branch selbst sind öffentlich; keine vertraulichen Zugangsdaten oder private E-Mail-Allowlist in Git eintragen.

## Schutz und getrennte Daten

`staging/src/access.js` prüft vor jeder Datei und API den von Cloudflare Access ausgestellten JWT mit `jose`: RS256-Signatur, Team-Issuer, Application Audience, Ablauf, Subject und die exakt freigegebene E-Mail. Fehlende Einstellungen ergeben 503, fehlende/falsche/abgelaufene Tokens 403. Ein gefälschter E-Mail-Header genügt nicht. Die Zertifikate werden ausschließlich vom konfigurierten HTTPS-Teamhost unter `cloudflareaccess.com` geladen; Schlüsselrotation wird gecacht.

`assets.run_worker_first = true` verhindert, dass der Asset-Router die Anmeldung umgeht; Preview-URLs sind ausgeschaltet. Antworten sind `private, no-store` und werden nicht indexiert. Auch bei versehentlich entferntem Access-Schutz liefert der Worker ohne gültigen JWT kein Spiel aus.

Das Paket verwendet `/api` auf derselben privaten Origin. Eine eigene KV-Bindung speichert Testrekorde, `/api/ideas` veröffentlicht keine Issues. Fremde API-Origins, einschließlich der Produktions-Origin, werden abgewiesen. Browser-GETs ohne `Origin` funktionieren; Schreibzugriffe benötigen die richtige Origin. Der Build schränkt `connect-src` auf `'self'` ein und lässt den Produktions-Worker unangetastet.

## Einmalig fertig einrichten

1. Im Cloudflare-Dashboard anmelden und Cloudflare Access/Zero Trust für das bestehende Konto aktivieren. Plan-/Vertragsauswahl persönlich durch den Nutzer abschließen; es wurde kein kostenpflichtiger Plan gewählt.
2. Unter Zero Trust → Integrations → Identity providers den **One-time PIN** aktivieren. Für den Worker `roll-down-staging` unter Access **All traffic** schützen, nicht nur Previews. Die Allow-Regel enthält ausschließlich die vom Nutzer bestätigte E-Mail; keine ganze Domain, Everyone-, Bypass- oder Service-Auth-Freigabe.
3. Team-Domain und Application Audience (AUD) aus der Access-Anwendung übernehmen und die folgenden Worker-Einstellungen setzen. Die E-Mail bleibt serverseitig. Werte/Token nie im Chat oder in Git hinterlegen:

   ```sh
   cd staging
   bun install --frozen-lockfile
   bunx --no-install wrangler secret put STAGING_ACCESS_DOMAIN  # https://<team>.cloudflareaccess.com
   bunx --no-install wrangler secret put STAGING_ACCESS_AUD
   bunx --no-install wrangler secret put STAGING_ALLOWED_EMAIL
   ```

4. Testen: ohne Sitzung muss Cloudflare zur Anmeldung führen; HTML/JS/Bilder/API dürfen nicht ausgeliefert werden. Mit dem erlaubten Konto müssen beide Spielmodi, Bilder und Test-Bestenliste funktionieren. Ein anderes Konto darf nicht hinein. Dieser positive reale Login-Test steht noch aus.
5. Einen möglichst eng auf den Staging-Worker beschränkten Cloudflare-Deployment-Token erstellen und in GitHub → Settings → Environments → `staging` als Secret `CLOUDFLARE_API_TOKEN` hinterlegen. Nicht den kurzlebigen lokalen OAuth-Token für CI verwenden. Keine Produktionssecrets oder GitHub-Issues-Tokens übernehmen.
6. Erst nach erfolgreicher Prüfung `STAGING_DEPLOY_ENABLED=true` im Environment setzen. Der nächste Push auf `staging` führt Tests, Paketierung und Deployment aus. Hauptbranch/Produktion werden dabei nicht gemergt oder deployt. `workflow_dispatch` wird erst regulär im GitHub-Actions-Menü angeboten, wenn die Workflowdatei auch auf dem Defaultbranch liegt; ein Staging-Push funktioniert bereits vorher.

## Lokale Prüfung und Deployment

```sh
cd staging && bun install --frozen-lockfile
cd .. && bun test tests staging/tests
bun tools/build-staging.js
cd staging && bunx --no-install wrangler deploy --dry-run
```

Der Builder kopiert nur freigegebene JS-/WebP-Laufzeitdateien und Icons; keine `.git`, `.docs`, `.claude`, Workerquellen, Ursprungsmodelle, Metadaten oder Secrets. Symlinks werden abgewiesen. Nur das generierte, ignorierte `staging/public` wird neu erstellt. Das originale `js/config.js` und die Produktions-CSP werden nicht verändert.

Prüfstand: **197 Tests grün**, einschließlich echter signierter JWTs, falschem Schlüssel/Konto/Audience/Issuer/Ablauf, Zugriff vor Assets, eigener KV-Bindung, Paket-Quellenlecks, Symlinks und Deployment-Freigabe. Cloudflare-Dry-Run erfolgreich. Ein unabhängiger Sol-High-Review fand den GET-ohne-Origin-Fall; Regression und Korrektur sind enthalten. Ein vollständiger Browserlauf hinter der echten Access-Anmeldung sowie mobile Geräteprüfung stehen aus.

Quellen: [Workers mit Access schützen](https://developers.cloudflare.com/workers/configuration/cloudflare-access/), [JWT-Prüfung mit jose](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/), [One-time PIN](https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/one-time-pin/), [Worker vor statischen Dateien ausführen](https://developers.cloudflare.com/workers/static-assets/routing/worker-script/).
