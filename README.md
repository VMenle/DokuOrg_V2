# DokumentenOrganizer V2 – Dokumentation

<!-- DokumentenOrganizer V2 – README.md -->
<!-- 2025-06-10 -->

## Nutzer-Anleitung

### Voraussetzungen

- **Browser:** Google Chrome oder Microsoft Edge (kein Firefox, kein Safari)
- **Gerät:** Windows, Mac, Linux oder Chromebook
- **Gemini API Key:** kostenlos unter [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
- **Lizenznummer:** per E-Mail erhalten (Format: `XXXX-XXXX-XXXX-XXXX`)

### Einrichtung (einmalig, ca. 5 Minuten)

1. App öffnen: `https://vmenle.github.io/DokuOrg_V2/`
2. **Lizenznummer** eingeben → Aktivieren
3. **Gemini API Key** eingeben:
   - Auf [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) gehen
   - „Create API Key" klicken
   - Key kopieren und in der App einfügen
4. **Arbeitsordner** auswählen:
   - Den Ordner wählen, der `_Eingang` enthalten soll (nicht `_Eingang` selbst und keinen Kategorieordner – das lehnt die App ab)
   - Bei einem leeren Ordner fragt die App nach, bevor sie `_Eingang` und die Kategorieordner anlegt
   - Liegt eine bestehende Struktur eine Ebene tiefer, schlägt die App diesen Unterordner vor
   - **Tipp:** Google Drive / OneDrive Desktop-Ordner als Arbeitsordner → automatisches Backup
5. Kategorien können bei Bedarf angepasst werden

### Dokumente verarbeiten

1. Dokument (PDF, JPG, PNG, WEBP, GIF, HEIC) in den `_Eingang`-Ordner legen
2. In der App auf **„▶ Jetzt starten"** klicken
3. Die KI analysiert, benennt um und legt ab – automatisch
4. Unsichere Dokumente erscheinen unter „Unklar" zur manuellen Zuordnung; sie bleiben bis dahin im `_Eingang`. „▶ Jetzt starten" überspringt sie, „🔄 Unklare neu analysieren" prüft nur sie erneut. Dateien, die nur an einem technischen Fehler scheiterten (z. B. Guthaben leer), versucht „Jetzt starten" automatisch erneut.
5. Jedes abgelegte Original wird unverändert und unter seinem ursprünglichen Namen in `_Archiv` gesichert. Den alten und neuen Namen zeigt das Protokoll.

### Eigene Regeln und Lernen aus Korrekturen

- **Eigene Regeln** (Einstellungen): „Wenn das Dokument mit X zu tun hat → Kategorie Y, Person Z“. Regeln haben Vorrang; die KI prüft sinngemäß, ähnliche Begriffe zählen mit. Voreingestellt: *Laura, Studium, Architekturstudium → Steuer, Person Laura* – nur wenn Betreff oder Empfänger auf Laura bzw. ihr Studium hinweisen; Architekten- und Baurechnungen ausdrücklich nicht.
- **Korrekturen**: Jede manuelle Zuordnung aus der Warteschlange und jede Korrektur im Protokoll (✏️) wird gespeichert. Die letzten 30 bekommt die KI als Beispiele mit.
- **Regel-Vorschläge**: Wird dreimal gleich korrigiert, schlägt die App vor, daraus eine feste Regel zu machen.
- **Korrigieren im Protokoll** verschiebt und benennt die Datei sicher um; inhaltsgleiche alte Steuer-Kopien werden entfernt, das Original in `_Archiv` bleibt.

### Versicherungs-Check (Tab „Versicherungen“)

- Zuerst alle Personen anlegen (Name, Geburtsdatum, Familienstand, Schule/Studium/Beruf, Krankenversicherung, Einkommen) und den Haushalt (Wohnsituation, Wohnfläche, Autos, Hund, Kredit).
- Dokumente im Ordner `Versicherungen` werden beim Ablegen automatisch von Gemini ausgelesen (Versicherer, versicherte Personen, Deckungssumme, Beitrag, Laufzeit, Auszahlung). Vorhandene Dokumente per Knopf – nur Dateinamen mit dem eingestellten Anfang (Standard `2026`).
- Je Person: Versicherung, Versicherer, wogegen, Höhe und in Klammern die Empfehlung; unterversichert/fehlend = dunkelgelb. Kapitalversicherungen mit Auszahlungsjahr und Summe.
- „Änderungen“ zeigt kommende Ereignisse (▲ positiv / ▼ negativ), z. B. Volljährigkeit, Ende der Familienversicherung, Ausbildungsende, Auszahlungen, auslaufende Verträge.
- Fehlende Angaben erscheinen als „Offene Fragen“ und lassen sich direkt beantworten; jeder Vertrag ist von Hand korrigierbar (korrigierte Felder werden beim erneuten Auslesen nicht überschrieben).
- Empfehlungswerte (Faustregeln nach Finanztip/Verbraucherzentrale) sind unter „Empfehlungswerte“ änderbar. Orientierung, keine Beratung.

### Datensicherheit beim Ablegen

- Zieldatei und Archivkopie werden geschrieben und per Größe und SHA-256-Prüfsumme gegen das Original geprüft
- Erst danach wird das Original aus `_Eingang` entfernt – und nur, wenn dort noch genau dieselbe Datei liegt
- Schlägt irgendein Schritt fehl, bleibt das Original unverändert im `_Eingang`
- Die App verarbeitet nie in zwei Tabs gleichzeitig
- Liegt der Arbeitsordner in Google Drive: Drive lädt im Hintergrund hoch – Gerät erst ausschalten, wenn die Synchronisierung fertig ist

### Nach jedem Browser-Neustart

Die App zeigt einen goldenen Banner – einmal klicken und denselben Ordner auswählen.
Das ist eine Browser-Sicherheitsbeschränkung, kein Fehler.

### Dateinamen-Format

```
YYYYMMDD_Kategorie_Art_Dokumenttyp_Person.pdf
Beispiel: 20250315_Versicherungen_KFZ_Rechnung_Allianz.pdf
```

### Limits

| Was | Wert |
|---|---|
| Max. Dateigröße | 14 MB (Gemini erlaubt max. 20 MB pro Anfrage inkl. Base64) |
| Formate | PDF, JPG, PNG, WEBP, GIF, HEIC |
| Gemini Free Tier | 1.500 Analysen/Tag |
| Pause zwischen Dateien | 4,2 Sekunden (Rate-Limit-Schutz) |

---

## Sicherheit (Aktueller Stand V2)

| Was | Wo gespeichert | Status |
|---|---|---|
| Lizenznummer | localStorage (Nutzer) + Supabase | ✅ |
| Lizenz-Validierung | Supabase Edge Function | ✅ Serverseitig |
| Gemini API Key | localStorage (Nutzer) | ✅ Nur lokal |
| Lizenzliste | Supabase (nicht localStorage) | ✅ |
| Admin-Passwort | SHA-256 Hash, hardcodiert in admin.html | ⚠️ Lokal, akzeptabel |
| Dokumente | Niemals hochgeladen | ✅ Bleiben lokal |
| Beta-Bewerbungen | Supabase `beta_applications` | ✅ |
| Beta-Spot-Counter | Supabase `admin_config` | ✅ Zentral/geräteübergreifend |

> `admin_supabase.html` läuft **nur lokal** (Google Drive) – nie öffentlich erreichbar.

---

## Browser-Kompatibilität

| Browser | Ordnerzugriff | Status |
|---|---|---|
| Chrome (Desktop) | ✅ | Empfohlen |
| Edge (Desktop) | ✅ | Unterstützt |
| Chrome (ChromeOS) | ✅ | Unterstützt |
| Firefox | ❌ | Nicht unterstützt |
| Safari | ❌ | Nicht unterstützt |
| Chrome (Android) | ⚠️ | Eingeschränkt |
| iOS | ❌ | Nicht unterstützt |

---

## Fehlerbehebung

**„Ordner kann nicht geöffnet werden"**
→ Browser-Berechtigung prüfen (goldener Banner oben in der App klicken)

**„Gemini API Fehler 429"**
→ Rate Limit erreicht – 1 Minute warten, dann neu starten

**„Gemini 402 – prepayment credits are depleted"**
→ Das Guthaben des Google-Projekts zum API Key ist aufgebraucht. Im Google AI Studio Guthaben aufladen oder unter Einstellungen → Gemini API Key einen anderen Key eintragen.
→ Die App bricht sofort ab; alle Dateien bleiben im `_Eingang` und werden beim nächsten Start automatisch verarbeitet. Nicht ausgelesene Versicherungsdokumente holt „Ordner Versicherungen auslesen“ nach.

**„Gemini API Fehler 404"**
→ Modell nicht gefunden – Seite neu laden, API Key in Einstellungen prüfen

**„Lizenz wird nicht akzeptiert"**
→ Internetverbindung prüfen (die Erstaktivierung läuft über Supabase)
→ Lizenz möglicherweise abgelaufen oder gesperrt – Admin kontaktieren

**Lizenz und API Key müssen immer wieder eingegeben werden**
→ Die App löscht die Lizenz nur bei ausdrücklicher Sperre durch den Server oder nach Ablaufdatum; Netzwerk- und Serverfehler werden ignoriert. Den API Key löscht sie nur über „Lizenz entfernen → alles löschen“.
→ Sind trotzdem beide weg, hat der Browser die Websitedaten gelöscht: `chrome://settings/content/siteData` prüfen („Daten beim Schließen aller Fenster löschen“ aus).
→ Immer dieselbe Adresse verwenden – jede Adresse hat ihren eigenen Speicher.

**„Datei nicht gefunden" beim manuellen Zuordnen**
→ Datei wurde manuell aus `_Eingang` verschoben – Eintrag wird automatisch als erledigt markiert

---

## Stack

| Komponente | Technologie |
|---|---|
| App-Hosting | GitHub Pages |
| Backend / Datenbank | Supabase (PostgreSQL + Edge Functions) |
| KI-Analyse | Google Gemini 2.5 Flash |
| Zahlungen | PayPal Business (Webhook) |
| E-Mail | Brevo (bestehende Integration) |
| Admin-Panel | Lokal, Google Drive |
| Ordner-Persistenz | IndexedDB (Browser) |
| Session-Daten | localStorage (Browser) |

---

*VM – Energy and Leisure · Volker Menle · Mögglingen · info@energy-leisure.de*
