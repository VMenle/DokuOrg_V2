# DokumentenOrganizer V2 – Dokumentation

<!-- DokumentenOrganizer V2 – README.md -->
<!-- 2025-06-10 -->

---

## Dateien & Zusammenhänge

Alle Dateien gehören zusammen und bilden ein vollständiges System.

| Datei | Zweck | Wo hochladen |
|---|---|---|
| `index.html` | Kunden-App (Haupt-App) | GitHub Pages |
| `landing.html` | Landingpage + Beta-Bewerbungsformular | GitHub Pages |
| `info.html` | Anleitung & FAQ für Nutzer | GitHub Pages |
| `agb.html` | AGB, Datenschutz, Impressum | GitHub Pages |
| `admin_supabase.html` | Admin-Panel (Lizenzverwaltung) | **Lokal – nur Google Drive** |

### Edge Functions (Supabase)

| Function | Aufgabe |
|---|---|
| `validate-license` | Prüft Lizenzschlüssel bei App-Login |
| `admin-actions` | Lizenzen erstellen, sperren, auflisten (Admin) |
| `beta-signup` | Beta-Bewerbungen entgegennehmen |

### Supabase-Tabellen

| Tabelle | Inhalt |
|---|---|
| `licenses` | Alle Lizenzen mit Ablaufdatum, Status, Plan |
| `payment_tokens` | Einmal-Codes für PayPal-Verlängerungen |
| `payment_log` | Alle Zahlungsvorgänge |
| `audit_log` | Admin-Aktionen und Beta-Anmeldungen |
| `admin_config` | Konfigurationswerte (Beta-Spots-Counter etc.) |
| `beta_applications` | Beta-Bewerbungen |

---

## Aktuellste Dateien

Die aktuell gültigen Dateien liegen im **Download-Ordner deines PCs**.  
Nach jedem Update: Dateien in GitHub Pages hochladen.

**GitHub Repository:** `https://github.com/vmenle/DokumentenOrganizer`  
**Live-URL:** `https://vmenle.github.io/DokumentenOrganizer/`

---

## Admin-Anleitung

### Voraussetzungen

- `admin_supabase.html` liegt **lokal** auf deinem Gerät (Google Drive)
- Supabase-Projekt: `qvvsuksdribtjkplaynu.supabase.co`
- Admin-Secret ist in der Datei konfiguriert

### Einloggen

1. `admin_supabase.html` im Browser öffnen (Chrome/Edge)
2. Admin-Passwort eingeben
3. Standard-Passwort beim ersten Login: `DokuAdmin2025` → **sofort ändern**

### Erste Lizenz erstellen (Beta-Tester)

1. Im Admin-Panel: Name + E-Mail eingeben
2. Plan: **Beta** auswählen (3 Monate)
3. „Lizenz erstellen" klicken
4. Schlüssel kopieren (Format: `XXXX-XXXX-XXXX-XXXX`)
5. „✉ E-Mail" klicken → E-Mail-Client öffnet sich mit vorausgefülltem Text
6. E-Mail an Beta-Tester senden

### Beta-Bewerbungen verwalten

Beta-Bewerbungen laufen automatisch über die Landing Page:
- Daten werden in der Tabelle `beta_applications` in Supabase gespeichert
- Du erhältst eine E-Mail-Benachrichtigung (über bestehenden E-Mail-Flow)
- Spot-Counter wird automatisch in `admin_config` hochgezählt

Bewerbungen ansehen: Supabase → Table Editor → `beta_applications`

### Passwort ändern

1. Im Admin-Panel → „Passwort ändern"
2. Aktuelles und neues Passwort eingeben
3. Den angezeigten Hash in `admin_supabase.html` ersetzen (in der Konstante `HARDCODED_PW_HASH`)
4. Datei neu speichern

### Lizenz sperren

Im Admin-Panel auf „Sperren" klicken → Lizenz wird sofort ungültig.
Der Nutzer sieht beim nächsten Login eine Fehlermeldung.

### PayPal-Verlängerung

1. Admin-Panel → „PayPal-Verlängerungs-Token" → Lizenz-ID eingeben
2. Token generieren → Kunde trägt den Code als PayPal-Verwendungszweck ein
3. Nach Zahlungseingang: Supabase PayPal-Webhook verlängert automatisch

---

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
