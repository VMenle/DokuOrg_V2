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

1. App öffnen: `https://vmenle.github.io/DokumentenOrganizer/`
2. **Lizenznummer** eingeben → Aktivieren
3. **Gemini API Key** eingeben:
   - Auf [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) gehen
   - „Create API Key" klicken
   - Key kopieren und in der App einfügen
4. **Arbeitsordner** auswählen:
   - Beliebigen Ordner auf deinem Gerät wählen
   - Die App legt automatisch `_Eingang` und alle Kategorieordner an
   - **Tipp:** Google Drive / OneDrive Desktop-Ordner als Arbeitsordner → automatisches Backup
5. Kategorien können bei Bedarf angepasst werden

### Dokumente verarbeiten

1. Dokument (PDF, JPG, PNG, WEBP, GIF, HEIC) in den `_Eingang`-Ordner legen
2. In der App auf **„▶ Jetzt starten"** klicken
3. Die KI analysiert, benennt um und legt ab – automatisch
4. Unsichere Dokumente erscheinen unter „TODO – Unklar" zur manuellen Zuordnung

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
| Max. Dateigröße | 15 MB |
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

**„Gemini API Fehler 404"**
→ Modell nicht gefunden – Seite neu laden, API Key in Einstellungen prüfen

**„Lizenz wird nicht akzeptiert"**
→ Internetverbindung prüfen (Validierung läuft über Supabase)
→ Lizenz möglicherweise abgelaufen oder gesperrt – Admin kontaktieren

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
