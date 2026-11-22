// DokumentenOrganizer V2 – Versicherungs-Check
// Nutzt aus index.html: _loadSafe, esc, toast, sleep, mitSperre, ensureWorkspace, workspaceHandle,
// categories, arrayBufferToBase64, guessMime, MAX_DATEIGROESSE_MB, GEMINI_REQUEST_DELAY_MS

const VS_SPARTEN = {
  privathaftpflicht:     { label: 'Privathaftpflicht',            ebene: 'person',   gegen: 'Schäden, die man anderen zufügt' },
  krankenversicherung:   { label: 'Krankenversicherung',          ebene: 'person',   gegen: 'Krankheitskosten' },
  berufsunfaehigkeit:    { label: 'Berufsunfähigkeit',            ebene: 'person',   gegen: 'Einkommensverlust bei Berufsunfähigkeit', proMonat: true },
  risikoleben:           { label: 'Risikolebensversicherung',     ebene: 'person',   gegen: 'Absicherung Hinterbliebener im Todesfall' },
  auslandsreisekranken:  { label: 'Auslandsreisekrankenversicherung', ebene: 'person', gegen: 'Behandlungskosten im Ausland' },
  kapitalleben:          { label: 'Kapitallebensversicherung',    ebene: 'person',   kapital: true },
  private_rente:         { label: 'Private Rentenversicherung',   ebene: 'person',   kapital: true },
  riester:               { label: 'Riester-Rente',                ebene: 'person',   kapital: true },
  ruerup:                { label: 'Rürup-Rente',                  ebene: 'person',   kapital: true },
  bav:                   { label: 'Betriebliche Altersvorsorge',  ebene: 'person',   kapital: true },
  unfall:                { label: 'Unfallversicherung',           ebene: 'person',   hinweis: 'Laut Verbraucherschützern nur sinnvoll, wenn keine Berufsunfähigkeitsversicherung möglich ist.' },
  krankenzusatz:         { label: 'Krankenzusatz',                ebene: 'person' },
  zahnzusatz:            { label: 'Zahnzusatz',                   ebene: 'person' },
  pflegezusatz:          { label: 'Pflegezusatz',                 ebene: 'person' },
  kfz_haftpflicht:       { label: 'Kfz-Haftpflicht',              ebene: 'haushalt', gegen: 'Schäden an anderen durch das Auto' },
  kfz_kasko:             { label: 'Kfz-Kasko',                    ebene: 'haushalt', gegen: 'Schäden am eigenen Auto' },
  wohngebaeude:          { label: 'Wohngebäude',                  ebene: 'haushalt', gegen: 'Schäden am Haus' },
  hausrat:               { label: 'Hausrat',                      ebene: 'haushalt', gegen: 'Schäden an der Einrichtung' },
  tierhalterhaftpflicht: { label: 'Tierhalterhaftpflicht',        ebene: 'haushalt', gegen: 'Schäden durch den Hund' },
  rechtsschutz:          { label: 'Rechtsschutz',                 ebene: 'haushalt', hinweis: 'Optional.' },
  sonstige:              { label: 'Sonstige',                     ebene: 'person' }
};

// Faustregeln unabhängiger Verbraucherschützer (Finanztip, Verbraucherzentrale) – in der App änderbar
const VS_STANDARD_WERTE = {
  phvMin: 10000000,        // Privathaftpflicht: mind. 10 Mio. €
  kfzMin: 100000000,       // Kfz-Haftpflicht: 100 Mio. € pauschal
  tierMin: 10000000,       // Hundehalterhaftpflicht wie Privathaftpflicht
  buProzentNetto: 75,      // BU-Rente ca. 75 % vom Netto
  buMin: 1000,             // BU-Rente mindestens 1.000 €/Monat
  buEndalter: 67,          // BU-Laufzeit bis Rentenbeginn
  rlvFaktorMin: 3,         // Risikoleben: 3–5 × Bruttojahreseinkommen
  rlvFaktorMax: 5,
  hausratProQm: 650,       // Hausrat: 650 €/m² (Unterversicherungsverzicht)
  vorschauMonate: 36       // Änderungen: Blick nach vorn
};
const VS_WERTE_LABEL = {
  phvMin: 'Privathaftpflicht mind. (€)', kfzMin: 'Kfz-Haftpflicht mind. (€)', tierMin: 'Tierhalterhaftpflicht mind. (€)',
  buProzentNetto: 'BU-Rente in % vom Netto', buMin: 'BU-Rente mind. (€/Monat)', buEndalter: 'BU-Laufzeit bis Alter',
  rlvFaktorMin: 'Risikoleben: min. × Bruttojahr', rlvFaktorMax: 'Risikoleben: max. × Bruttojahr',
  hausratProQm: 'Hausrat €/m²', vorschauMonate: 'Änderungen: Vorschau (Monate)'
};

const VS_STATUS = { schule: 'Schule', ausbildung: 'Ausbildung', studium: 'Studium', arbeitnehmer: 'Angestellt',
  selbststaendig: 'Selbständig', beamter: 'Beamt/in', arbeitssuchend: 'Arbeitssuchend', rente: 'Rente', sonstiges: 'Sonstiges' };
const VS_FAMILIENSTAND = { ledig: 'ledig', verheiratet: 'verheiratet', partnerschaft: 'eingetr. Partnerschaft', geschieden: 'geschieden', verwitwet: 'verwitwet' };
const VS_KV = { gkv: 'gesetzlich', familie: 'Familienversicherung (GKV)', pkv: 'privat', beihilfe: 'Beihilfe + privat' };
const VS_WOHNEN = { miete: 'Miete', eigentum_haus: 'Eigenes Haus', eigentum_wohnung: 'Eigentumswohnung' };
const VS_ERWERB = ['arbeitnehmer', 'selbststaendig', 'beamter'];
const VS_AUSBILDUNG = ['schule', 'ausbildung', 'studium'];
const VS_PFLICHTSUMME = ['privathaftpflicht', 'kfz_haftpflicht', 'tierhalterhaftpflicht', 'hausrat', 'berufsunfaehigkeit', 'risikoleben'];

let vsHaushalt = Object.assign({ wohnsituation: '', wohnflaeche: null, autos: null, hund: null, kreditRestschuld: null, personen: [] },
  _loadSafe('ds_haushalt', {}));
let vsPolicen = _loadSafe('ds_policen', []);
let vsWerte = Object.assign({}, VS_STANDARD_WERTE, _loadSafe('ds_vs_werte', {}));
let vsGelesen = _loadSafe('ds_vs_gelesen', []);
let vsErledigt = _loadSafe('ds_vs_erledigt', []);
let vsAusstehend = _loadSafe('ds_vs_ausstehend', []); // abgelegt, aber Auslesen gescheitert
let _vsScanLaeuft = false;

function vsSpeichern() {
  const daten = { ds_haushalt: vsHaushalt, ds_policen: vsPolicen, ds_vs_werte: vsWerte, ds_vs_gelesen: vsGelesen.slice(-1000),
    ds_vs_erledigt: vsErledigt, ds_vs_ausstehend: vsAusstehend };
  for (const [k, v] of Object.entries(daten)) {
    try { localStorage.setItem(k, JSON.stringify(v)); }
    catch (e) { toast('Versicherungsdaten konnten nicht gespeichert werden: ' + e.message, 'err'); }
  }
}

// ── Hilfsfunktionen ──
function vsHeute() { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }
function vsDatum(s) { if (!s) return null; const d = new Date(String(s).substring(0, 10) + 'T00:00:00'); return isNaN(d) ? null : d; }
function vsDatumText(d) { return d ? d.toLocaleDateString('de-DE') : '–'; }
function vsAlter(geb, am) {
  const g = vsDatum(geb); if (!g) return null;
  am = am || vsHeute();
  let a = am.getFullYear() - g.getFullYear();
  if (am.getMonth() < g.getMonth() || (am.getMonth() === g.getMonth() && am.getDate() < g.getDate())) a--;
  return a;
}
function vsGeburtstag(geb, jahre) { const g = vsDatum(geb); return g ? new Date(g.getFullYear() + jahre, g.getMonth(), g.getDate()) : null; }
function vsZahl(v) {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') return isFinite(v) ? v : null;
  let s = String(v).replace(/[^\d,.-]/g, '');
  if (/,\d{1,2}$/.test(s)) s = s.replace(/\./g, '').replace(',', '.');
  else s = s.replace(/[.,]/g, '');
  const n = parseFloat(s);
  return isFinite(n) ? n : null;
}
function vsEuro(n) {
  if (n === null || n === undefined) return '?';
  if (n >= 1000000) return (n / 1000000).toLocaleString('de-DE', { maximumFractionDigits: 1 }) + ' Mio. €';
  return Math.round(n).toLocaleString('de-DE') + ' €';
}
function vsPersonName(id) { if (id === 'haushalt') return 'Familie/Haushalt'; const p = vsHaushalt.personen.find(x => x.id === id); return p ? p.name : '?'; }
function vsPersonZuName(name) {
  const n = String(name || '').trim().toLowerCase();
  if (!n) return null;
  return vsHaushalt.personen.find(p => {
    const pn = p.name.trim().toLowerCase();
    return pn === n || n.split(/\s+/).includes(pn.split(/\s+/)[0]) || pn.split(/\s+/)[0] === n.split(/\s+/)[0];
  }) || null;
}
function vsAktiv(x) { if (x.status === 'beendet') return false; const e = vsDatum(x.ende); return !e || e >= vsHeute(); }
function vsVersicherungsKategorie() {
  return categories.find(k => k.name === 'Versicherungen') || categories.find(k => k.folderName === 'Versicherungen') || null;
}

function vsDeckt(x, p) {
  if (x.personen.includes(p.id)) return true;
  if (!x.personen.includes('haushalt')) return false;
  if (x.sparte !== 'privathaftpflicht') return true;
  const vn = vsPersonZuName(x.versicherungsnehmer);
  if (!vn || vn.id === p.id) return true;
  const alter = vsAlter(p.geburtsdatum);
  if (alter !== null && alter < 18) return true;
  if (VS_AUSBILDUNG.includes(p.status) && p.familienstand !== 'verheiratet') return true;
  const paar = ['verheiratet', 'partnerschaft'];
  return paar.includes(p.familienstand) && paar.includes(vn.familienstand);
}
function vsPolicenFuer(p, sparte) { return vsPolicen.filter(x => x.sparte === sparte && vsAktiv(x) && vsDeckt(x, p)); }

function vsFamilienversicherungEnde(p) {
  if (!p.geburtsdatum) return null;
  if (VS_AUSBILDUNG.includes(p.status)) return vsGeburtstag(p.geburtsdatum, 25);
  if (p.status === 'arbeitssuchend') return vsGeburtstag(p.geburtsdatum, 23);
  return vsGeburtstag(p.geburtsdatum, 18);
}

// ── Bewertung ──
function vsZeile(sparte, policen, status, ist, empf, hinweis) {
  return { sparte, label: VS_SPARTEN[sparte]?.label || sparte, policen, status, ist, empf: empf || '', hinweis: hinweis || '' };
}
function vsSumme(policen) {
  const werte = policen.map(x => x.deckungssumme);
  if (werte.some(v => v === null || v === undefined)) return null;
  return werte.reduce((a, b) => a + b, 0);
}
function vsMax(policen) {
  const werte = policen.map(x => x.deckungssumme).filter(v => v !== null && v !== undefined);
  return werte.length ? Math.max(...werte) : null;
}

function vsBewertePerson(p) {
  const W = vsWerte, rows = [];
  const alter = vsAlter(p.geburtsdatum);

  // Privathaftpflicht
  {
    const pol = vsPolicenFuer(p, 'privathaftpflicht');
    const empf = '≥ ' + vsEuro(W.phvMin);
    if (!pol.length) {
      const famPol = vsPolicen.find(x => x.sparte === 'privathaftpflicht' && vsAktiv(x) && x.personen.includes('haushalt'));
      rows.push(vsZeile('privathaftpflicht', [], 'fehlt', null, empf,
        famPol ? 'Nicht (mehr) über die Familienpolice mitversichert – eigene Haftpflicht nötig.' : 'Wichtigste private Versicherung.'));
    } else {
      const max = vsMax(pol);
      const ueber = pol.find(x => x.personen.includes('haushalt') && vsPersonZuName(x.versicherungsnehmer)?.id !== p.id);
      rows.push(vsZeile('privathaftpflicht', pol, max === null ? 'offen' : max < W.phvMin ? 'unter' : 'ok', max, empf,
        ueber ? 'mitversichert über ' + (ueber.versicherungsnehmer || 'Familienpolice') : ''));
    }
  }

  // Krankenversicherung
  {
    const pol = vsPolicenFuer(p, 'krankenversicherung');
    if (p.kv === 'familie') {
      const ende = vsFamilienversicherungEnde(p);
      if (ende && ende <= vsHeute()) rows.push(vsZeile('krankenversicherung', pol, 'fehlt', 'Familienversicherung', 'eigene Versicherung',
        'Familienversicherung endet mit Erreichen der Altersgrenze – eigene Krankenversicherung nötig.'));
      else rows.push(vsZeile('krankenversicherung', pol, 'ok', 'Familienversicherung', 'Pflicht', ende ? 'voraussichtlich bis ' + vsDatumText(ende) : ''));
    } else if (p.kv || pol.length) {
      rows.push(vsZeile('krankenversicherung', pol, 'ok', VS_KV[p.kv] || 'vorhanden', 'Pflicht', ''));
    } else {
      rows.push(vsZeile('krankenversicherung', pol, 'offen', null, 'Pflicht', 'Art der Krankenversicherung angeben (offene Fragen).'));
    }
  }

  // Berufsunfähigkeit
  if (VS_ERWERB.includes(p.status) || ['ausbildung', 'studium'].includes(p.status)) {
    const pol = vsPolicenFuer(p, 'berufsunfaehigkeit');
    const empfRente = Math.max(W.buMin, p.nettoMonat ? Math.round(p.nettoMonat * W.buProzentNetto / 100 / 50) * 50 : 0);
    const empf = (p.nettoMonat ? '≈ ' + vsEuro(empfRente) + '/Monat (' + W.buProzentNetto + ' % vom Netto)' : '≥ ' + vsEuro(W.buMin) + '/Monat') + ', bis ' + W.buEndalter;
    if (!pol.length) {
      rows.push(vsZeile('berufsunfaehigkeit', [], 'fehlt', null, empf,
        VS_ERWERB.includes(p.status) ? 'Absicherung der Arbeitskraft.' : 'Früher Abschluss sichert günstigen Beitrag und guten Gesundheitsstatus.'));
    } else {
      const summe = vsSumme(pol);
      let status = summe === null ? 'offen' : summe < empfRente ? 'unter' : 'ok';
      const hinweise = [];
      const geb = vsDatum(p.geburtsdatum);
      for (const x of pol) {
        const e = vsDatum(x.ende);
        if (e && geb) {
          const endAlter = e.getFullYear() - geb.getFullYear();
          if (endAlter < W.buEndalter) { hinweise.push('Laufzeit endet mit ' + endAlter + ' Jahren'); if (status === 'ok') status = 'unter'; }
        }
      }
      if (p.status === 'beamter') hinweise.push('auf Dienstunfähigkeitsklausel achten');
      rows.push(vsZeile('berufsunfaehigkeit', pol, status, summe === null ? null : summe, empf, hinweise.join('; ')));
    }
  } else if (p.status === 'schule') {
    const pol = vsPolicenFuer(p, 'berufsunfaehigkeit');
    if (pol.length) rows.push(vsZeile('berufsunfaehigkeit', pol, 'ok', vsSumme(pol), 'optional', ''));
    else rows.push(vsZeile('berufsunfaehigkeit', [], 'optional', null, 'optional', 'Schüler-BU möglich; spätestens mit Ausbildung/Studium sinnvoll.'));
  }

  // Risikolebensversicherung
  {
    const pol = vsPolicenFuer(p, 'risikoleben');
    const kredit = VS_ERWERB.includes(p.status) ? (vsHaushalt.kreditRestschuld || 0) : 0;
    const braucht = p.abhaengige === true || kredit > 0;
    if (braucht) {
      const min = p.bruttoJahr ? p.bruttoJahr * W.rlvFaktorMin + kredit : null;
      const empf = p.bruttoJahr
        ? vsEuro(p.bruttoJahr * W.rlvFaktorMin + kredit) + ' – ' + vsEuro(p.bruttoJahr * W.rlvFaktorMax + kredit)
        : W.rlvFaktorMin + '–' + W.rlvFaktorMax + ' × Bruttojahreseinkommen' + (kredit ? ' + Kredit' : '');
      if (!pol.length) rows.push(vsZeile('risikoleben', [], 'fehlt', null, empf, p.abhaengige ? 'Andere sind finanziell abhängig.' : 'Kredit absichern.'));
      else {
        const summe = vsSumme(pol);
        rows.push(vsZeile('risikoleben', pol, summe === null || min === null ? 'offen' : summe < min ? 'unter' : 'ok', summe, empf,
          min === null ? 'Bruttojahreseinkommen angeben, um die Höhe zu prüfen.' : ''));
      }
    } else if (pol.length) {
      rows.push(vsZeile('risikoleben', pol, 'info', vsSumme(pol), 'nur nötig bei Abhängigen/Kredit', ''));
    }
  }

  // Auslandsreisekranken
  if (['gkv', 'familie'].includes(p.kv)) {
    const pol = vsPolicenFuer(p, 'auslandsreisekranken');
    rows.push(pol.length
      ? vsZeile('auslandsreisekranken', pol, 'ok', 'vorhanden', 'empfohlen', '')
      : vsZeile('auslandsreisekranken', [], 'empfohlen', null, 'empfohlen', 'Günstig; die gesetzliche Kasse zahlt im Ausland nur eingeschränkt.'));
  }

  // Kapitalversicherungen
  for (const x of vsPolicen.filter(x => VS_SPARTEN[x.sparte]?.kapital && vsAktiv(x) && vsDeckt(x, p))) {
    const fehlt = !x.auszahlungsjahr || (x.auszahlungGarantiert == null && x.auszahlungPrognose == null);
    rows.push(vsZeile(x.sparte, [x], fehlt ? 'offen' : 'kapital', null, '', ''));
  }

  // Übrige personenbezogene Verträge
  for (const sparte of ['unfall', 'krankenzusatz', 'zahnzusatz', 'pflegezusatz', 'sonstige']) {
    const pol = vsPolicen.filter(x => x.sparte === sparte && vsAktiv(x) && x.personen.includes(p.id));
    if (pol.length) rows.push(vsZeile(sparte, pol, 'info', vsSumme(pol), '', VS_SPARTEN[sparte].hinweis || ''));
  }
  return rows;
}

function vsBewerteHaushalt() {
  const W = vsWerte, rows = [], h = vsHaushalt;
  const pol = s => vsPolicen.filter(x => x.sparte === s && vsAktiv(x));

  const kfz = pol('kfz_haftpflicht');
  if ((h.autos || 0) > 0 || kfz.length) {
    const empf = '≥ ' + vsEuro(W.kfzMin) + ' pauschal';
    let status = 'ok', hinweis = '';
    if ((h.autos || 0) > kfz.length) { status = 'fehlt'; hinweis = kfz.length + ' von ' + h.autos + ' Autos versichert'; }
    else if (kfz.some(x => x.deckungssumme == null)) status = 'offen';
    else if (kfz.some(x => x.deckungssumme < W.kfzMin)) status = 'unter';
    rows.push(vsZeile('kfz_haftpflicht', kfz, status, vsMax(kfz), empf, hinweis));
  }
  const kasko = pol('kfz_kasko');
  if (kasko.length) rows.push(vsZeile('kfz_kasko', kasko, 'info', null, 'optional', 'Vollkasko meist nur bei neueren Autos sinnvoll.'));

  const geb = pol('wohngebaeude');
  if (h.wohnsituation === 'eigentum_haus' || geb.length) {
    const empf = 'gleitender Neuwert + Elementarschäden';
    if (!geb.length) rows.push(vsZeile('wohngebaeude', [], 'fehlt', null, empf, 'Für Hauseigentümer unverzichtbar.'));
    else {
      const ohneElementar = geb.some(x => x.elementar === false);
      const unklar = geb.some(x => x.elementar == null);
      rows.push(vsZeile('wohngebaeude', geb, ohneElementar ? 'unter' : unklar ? 'offen' : 'ok', 'vorhanden', empf,
        ohneElementar ? 'Elementarschäden (Hochwasser, Starkregen) nicht versichert.' : unklar ? 'Elementarschutz bitte prüfen.' : ''));
    }
  } else if (h.wohnsituation === 'eigentum_wohnung') {
    rows.push(vsZeile('wohngebaeude', [], 'info', null, 'über Eigentümergemeinschaft', 'Gebäude ist meist über die WEG versichert.'));
  }

  const hr = pol('hausrat');
  const hrMin = h.wohnflaeche ? h.wohnflaeche * W.hausratProQm : null;
  const hrEmpf = hrMin ? '≥ ' + vsEuro(hrMin) + ' (' + W.hausratProQm + ' €/m²)' : W.hausratProQm + ' €/m² Wohnfläche';
  if (hr.length) {
    const summe = vsSumme(hr);
    rows.push(vsZeile('hausrat', hr, summe === null || hrMin === null ? 'offen' : summe < hrMin ? 'unter' : 'ok', summe, hrEmpf,
      hrMin === null ? 'Wohnfläche angeben, um die Summe zu prüfen.' : ''));
  } else rows.push(vsZeile('hausrat', [], 'optional', null, hrEmpf, 'Sinnvoll, wenn ein Totalverlust der Einrichtung nicht selbst tragbar wäre.'));

  const tier = pol('tierhalterhaftpflicht');
  if (h.hund === true || tier.length) {
    const empf = '≥ ' + vsEuro(W.tierMin);
    if (!tier.length) rows.push(vsZeile('tierhalterhaftpflicht', [], 'fehlt', null, empf, 'Hundehalter haften unbegrenzt; in vielen Bundesländern Pflicht.'));
    else { const max = vsMax(tier); rows.push(vsZeile('tierhalterhaftpflicht', tier, max === null ? 'offen' : max < W.tierMin ? 'unter' : 'ok', max, empf, '')); }
  }

  const rs = pol('rechtsschutz');
  if (rs.length) rows.push(vsZeile('rechtsschutz', rs, 'info', null, 'optional', ''));
  return rows;
}

// ── Änderungen (positiv/negativ) ──
function vsEreignisse() {
  const heute = vsHeute();
  const bis = new Date(heute); bis.setMonth(bis.getMonth() + (vsWerte.vorschauMonate || 36));
  const ev = [];
  const add = (datum, wer, art, text) => { if (datum && datum >= heute && datum <= bis) ev.push({ datum, wer, art, text }); };

  for (const p of vsHaushalt.personen) {
    if (!p.geburtsdatum) continue;
    const alter = vsAlter(p.geburtsdatum);
    if (alter < 18) add(vsGeburtstag(p.geburtsdatum, 18), p.name, 'minus',
      'Wird volljährig: Mitversicherung in Familienverträgen und Kindertarife (z. B. Kinderunfall) prüfen.');
    if (p.kv === 'familie') add(vsFamilienversicherungEnde(p), p.name, 'minus',
      'Familienversicherung in der Krankenkasse endet (Altersgrenze) – eigene Krankenversicherung nötig, im Studium z. B. studentische KV.');
    if (VS_AUSBILDUNG.includes(p.status) && p.ausbildungsende) {
      const d = new Date(p.ausbildungsende, 8, 30);
      if (p.status === 'schule') {
        add(d, p.name, 'minus', 'Schulende (voraussichtlich ' + p.ausbildungsende + '): Folgt direkt Ausbildung oder Studium, bleiben Familien-Haftpflicht und Familienversicherung bestehen. Bei Job, Freiwilligendienst oder längerer Pause Versicherungsschutz prüfen.');
      } else {
        add(d, p.name, 'minus', 'Ausbildungsende (voraussichtlich ' + p.ausbildungsende + '): Mitversicherung in der Privathaftpflicht der Eltern endet – eigene Haftpflicht nötig.');
        add(d, p.name, 'plus', 'Eigenes Einkommen: Berufsunfähigkeit absichern; bei Familie/Kredit Risikoleben prüfen.');
      }
    }
    for (const x of vsPolicen.filter(x => x.sparte === 'berufsunfaehigkeit' && vsAktiv(x) && vsDeckt(x, p))) {
      const e = vsDatum(x.ende);
      if (!e) continue;
      const endAlter = e.getFullYear() - vsDatum(p.geburtsdatum).getFullYear();
      add(e, p.name, endAlter >= vsWerte.buEndalter - 1 ? 'plus' : 'minus',
        endAlter >= vsWerte.buEndalter - 1 ? 'BU-Vertrag (' + x.versicherer + ') endet mit Rentenbeginn – Beitrag entfällt.'
          : 'BU-Vertrag (' + x.versicherer + ') endet mit ' + endAlter + ' – danach ohne BU-Schutz.');
    }
  }
  for (const x of vsPolicen.filter(vsAktiv)) {
    const wer = x.personen.map(vsPersonName).join(', ') || '–';
    const label = VS_SPARTEN[x.sparte]?.label || x.sparte;
    if (VS_SPARTEN[x.sparte]?.kapital) {
      const d = vsDatum(x.ende) || (x.auszahlungsjahr ? new Date(x.auszahlungsjahr, 11, 1) : null);
      const betrag = x.auszahlungGarantiert != null ? vsEuro(x.auszahlungGarantiert) + ' garantiert' : x.auszahlungPrognose != null ? '≈ ' + vsEuro(x.auszahlungPrognose) : 'Summe offen';
      add(d, wer, 'plus', 'Auszahlung ' + label + ' (' + (x.versicherer || '?') + '): ' + betrag + '.');
    } else if (x.sparte !== 'berufsunfaehigkeit') {
      add(vsDatum(x.ende), wer, 'minus', label + ' (' + (x.versicherer || '?') + ') läuft aus – Anschluss prüfen.');
    }
  }
  return ev.sort((a, b) => a.datum - b.datum);
}

// ── Offene Fragen ──
function vsOffeneFragen() {
  const f = [], h = vsHaushalt;
  const frage = (id, text, typ, ziel, optionen) => { if (!vsErledigt.includes(id)) f.push({ id, text, typ, ziel, optionen }); };

  if (!h.wohnsituation) frage('h:wohnsituation', 'Wie wohnt ihr?', 'select', { art: 'haushalt', feld: 'wohnsituation' }, VS_WOHNEN);
  if (h.wohnflaeche == null) frage('h:wohnflaeche', 'Wohnfläche in m² (für die Hausrat-Summe)?', 'zahl', { art: 'haushalt', feld: 'wohnflaeche' });
  if (h.autos == null) frage('h:autos', 'Wie viele Autos hat der Haushalt?', 'zahl', { art: 'haushalt', feld: 'autos' });
  if (h.hund == null) frage('h:hund', 'Gibt es einen Hund im Haushalt?', 'jn', { art: 'haushalt', feld: 'hund' });
  if (h.kreditRestschuld == null) frage('h:kredit', 'Offene Kreditschuld (z. B. Baufinanzierung) in €? 0 wenn keine.', 'zahl', { art: 'haushalt', feld: 'kreditRestschuld' });

  for (const p of h.personen) {
    const z = feld => ({ art: 'person', id: p.id, feld });
    if (!p.geburtsdatum) frage('p:' + p.id + ':geb', p.name + ': Geburtsdatum?', 'datum', z('geburtsdatum'));
    if (!p.status) frage('p:' + p.id + ':status', p.name + ': Schule, Studium, Beruf …?', 'select', z('status'), VS_STATUS);
    if (!p.kv) frage('p:' + p.id + ':kv', p.name + ': Wie krankenversichert?', 'select', z('kv'), VS_KV);
    if (VS_ERWERB.includes(p.status) && p.nettoMonat == null) frage('p:' + p.id + ':netto', p.name + ': Nettoeinkommen pro Monat (€)?', 'zahl', z('nettoMonat'));
    if (VS_ERWERB.includes(p.status) && p.bruttoJahr == null) frage('p:' + p.id + ':brutto', p.name + ': Bruttojahreseinkommen (€)?', 'zahl', z('bruttoJahr'));
    if (VS_ERWERB.includes(p.status) && p.abhaengige == null) frage('p:' + p.id + ':abh', p.name + ': Sind andere finanziell von dieser Person abhängig (Kinder, Partner)?', 'jn', z('abhaengige'));
    if (VS_AUSBILDUNG.includes(p.status) && !p.ausbildungsende) frage('p:' + p.id + ':ende', p.name + ': Voraussichtliches Ende von Schule/Ausbildung/Studium (Jahr)?', 'zahl', z('ausbildungsende'));
  }

  for (const x of vsPolicen.filter(vsAktiv)) {
    const name = (VS_SPARTEN[x.sparte]?.label || x.sparte) + ' ' + (x.versicherer || '') + (x.nummer ? ' (' + x.nummer + ')' : '');
    const z = feld => ({ art: 'police', id: x.id, feld });
    if (!x.personen.length) frage('x:' + x.id + ':personen', name + ': Wer ist versichert?' + (x.unbekanntePersonen?.length ? ' (im Dokument: ' + x.unbekanntePersonen.join(', ') + ')' : ''), 'personen', z('personen'));
    if (VS_PFLICHTSUMME.includes(x.sparte) && x.deckungssumme == null) {
      frage('x:' + x.id + ':summe', name + ': ' + (x.sparte === 'berufsunfaehigkeit' ? 'Monatliche BU-Rente (€)?' : 'Versicherungs-/Deckungssumme (€)?'), 'zahl', z('deckungssumme'));
    }
    if (VS_SPARTEN[x.sparte]?.kapital) {
      if (!x.auszahlungsjahr) frage('x:' + x.id + ':jahr', name + ': Jahr der Auszahlung bzw. des Rentenbeginns?', 'zahl', z('auszahlungsjahr'));
      if (x.auszahlungGarantiert == null && x.auszahlungPrognose == null) frage('x:' + x.id + ':auszahlung', name + ': Garantierte Auszahlungssumme (€)?', 'zahl', z('auszahlungGarantiert'));
    }
    if (x.sparte === 'wohngebaeude' && x.elementar == null) frage('x:' + x.id + ':elem', name + ': Sind Elementarschäden mitversichert?', 'jn', z('elementar'));
    (x.fragen || []).forEach((t, i) => frage('x:' + x.id + ':q:' + t, name + ': ' + t, 'notiz', { art: 'police', id: x.id, feld: 'notiz' }));
  }
  return f;
}

function vsAntwortSetzen(frage, wert) {
  const z = frage.ziel;
  if (z.art === 'haushalt') vsHaushalt[z.feld] = wert;
  else if (z.art === 'person') { const p = vsHaushalt.personen.find(x => x.id === z.id); if (p) p[z.feld] = wert; }
  else if (z.art === 'police') {
    const x = vsPolicen.find(y => y.id === z.id);
    if (!x) return;
    if (z.feld === 'notiz') { x.notiz = (x.notiz ? x.notiz + '\n' : '') + wert; vsErledigt.push(frage.id); }
    else { x[z.feld] = wert; x.manuell = [...new Set([...(x.manuell || []), z.feld])]; }
  }
  vsSpeichern();
}

// ── Auslesen per Gemini ──
function vsExtraktionsPrompt() {
  const personen = vsHaushalt.personen.map(p => '- ' + p.name + (p.geburtsdatum ? ' (geb. ' + p.geburtsdatum + ')' : '')).join('\n') || '- (keine angelegt)';
  return 'Du liest deutsche Versicherungsunterlagen aus (Police, Versicherungsschein, Beitragsrechnung, Standmitteilung, Nachtrag).\n\n' +
    '## PERSONEN IM HAUSHALT\n' + personen + '\n\n' +
    '## SPARTEN (exakt einen Schlüssel verwenden)\n' + Object.entries(VS_SPARTEN).map(([k, v]) => k + ' = ' + v.label).join('\n') + '\n\n' +
    '## AUFGABE\nListe jede im Dokument genannte Versicherung (ein Dokument kann mehrere enthalten, z. B. Kfz-Haftpflicht und Kasko).\n' +
    '- sparte: Schlüssel aus der Liste\n- versicherer: Name der Gesellschaft\n- versicherungsnummer: Vertrags-/Policennummer, sonst leer\n' +
    '- versicherungsnehmer: Name\n- versicherte_personen: Namen der versicherten Personen; bei Familien-/Haushaltstarif ["Familie"]\n' +
    '- leistung: wogegen versichert, max. 10 Wörter\n' +
    '- deckungssumme: Zahl in Euro (Haftpflicht: pauschale Deckungssumme; Berufsunfähigkeit: monatliche Rente; Risikoleben: Todesfallsumme; Hausrat/Gebäude: Versicherungssumme), sonst null\n' +
    '- beitrag: Zahl in Euro; beitrag_intervall: monatlich|vierteljährlich|halbjährlich|jährlich\n' +
    '- beginn, ende: YYYY-MM-DD oder null\n' +
    '- auszahlungsjahr: nur Kapital-/Rentenversicherungen (Ablauf bzw. Rentenbeginn), sonst null\n' +
    '- auszahlung_garantiert, auszahlung_prognose: Zahl in Euro (Kapital bei Ablauf), sonst null\n' +
    '- elementar: nur Gebäude/Hausrat – Elementarschäden mitversichert? true/false/null\n' +
    '- unklar: kurze Fragen zu wichtigen Angaben, die fehlen oder widersprüchlich sind\n' +
    'Nur Angaben verwenden, die im Dokument stehen – nichts schätzen. Kein Versicherungsdokument: {"policen":[]}.\n\n' +
    'Antworte NUR mit JSON: {"policen":[{"sparte":"","versicherer":"","versicherungsnummer":"","versicherungsnehmer":"","versicherte_personen":[],"leistung":"","deckungssumme":null,"beitrag":null,"beitrag_intervall":"","beginn":null,"ende":null,"auszahlungsjahr":null,"auszahlung_garantiert":null,"auszahlung_prognose":null,"elementar":null,"unklar":[]}]}';
}

async function vsGemini(base64, mimeType) {
  const {text} = await kiAnfrage(base64, mimeType, vsExtraktionsPrompt(), { maxTokens: 4096, json: true, timeoutMs: 60000 });
  const m = text.replace(/```json\n?|```/g, '').match(/\{[\s\S]*\}/);
  if (!m) throw new Error('Antwort nicht lesbar');
  return JSON.parse(m[0]);
}

function vsUebernehmen(ergebnis, quelle) {
  let neu = 0, aktualisiert = 0;
  for (const r of (ergebnis.policen || [])) {
    const sparte = VS_SPARTEN[r.sparte] ? r.sparte : 'sonstige';
    const personen = [], unbekannt = [];
    if (VS_SPARTEN[sparte].ebene === 'haushalt') personen.push('haushalt');
    else {
      for (const n of (r.versicherte_personen || [])) {
        if (/^(familie|haushalt|alle)/i.test(String(n).trim())) { if (!personen.includes('haushalt')) personen.push('haushalt'); continue; }
        const p = vsPersonZuName(n);
        if (p) { if (!personen.includes(p.id)) personen.push(p.id); } else unbekannt.push(String(n).substring(0, 40));
      }
      if (!personen.length && !unbekannt.length) { const vn = vsPersonZuName(r.versicherungsnehmer); if (vn) personen.push(vn.id); }
    }
    const werte = {
      sparte, versicherer: String(r.versicherer || '').substring(0, 60), nummer: String(r.versicherungsnummer || '').substring(0, 40),
      versicherungsnehmer: String(r.versicherungsnehmer || '').substring(0, 60), personen,
      leistung: String(r.leistung || '').substring(0, 120), deckungssumme: vsZahl(r.deckungssumme),
      beitrag: vsZahl(r.beitrag), beitragIntervall: String(r.beitrag_intervall || ''),
      beginn: vsDatum(r.beginn) ? String(r.beginn).substring(0, 10) : '', ende: vsDatum(r.ende) ? String(r.ende).substring(0, 10) : '',
      auszahlungsjahr: vsZahl(r.auszahlungsjahr), auszahlungGarantiert: vsZahl(r.auszahlung_garantiert),
      auszahlungPrognose: vsZahl(r.auszahlung_prognose), elementar: typeof r.elementar === 'boolean' ? r.elementar : null
    };
    const nr = werte.nummer.replace(/[^0-9a-z]/gi, '').toLowerCase();
    const vers = werte.versicherer.toLowerCase().split(/\s+/)[0] || '';
    const vorhanden = vsPolicen.find(x =>
      (nr && x.nummer && x.nummer.replace(/[^0-9a-z]/gi, '').toLowerCase() === nr) ||
      (!nr && !x.nummer && x.sparte === sparte && vers && (x.versicherer || '').toLowerCase().startsWith(vers) &&
        JSON.stringify([...x.personen].sort()) === JSON.stringify([...personen].sort())));
    if (vorhanden) {
      for (const [k, v] of Object.entries(werte)) {
        if ((vorhanden.manuell || []).includes(k)) continue;
        const leer = v === null || v === '' || (Array.isArray(v) && !v.length);
        if (!leer) vorhanden[k] = v;
      }
      vorhanden.quellen = [...new Set([...(vorhanden.quellen || []), quelle])];
      vorhanden.unbekanntePersonen = unbekannt;
      vorhanden.fragen = [...new Set([...(vorhanden.fragen || []), ...(r.unklar || []).map(s => String(s).substring(0, 160))])];
      aktualisiert++;
    } else {
      vsPolicen.push({ id: 'v_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), status: 'aktiv', ...werte,
        unbekanntePersonen: unbekannt, fragen: (r.unklar || []).map(s => String(s).substring(0, 160)), quellen: [quelle], manuell: [], notiz: '' });
      neu++;
    }
  }
  vsSpeichern();
  return { neu, aktualisiert };
}

async function vsDateiAuslesen(ordnerHandle, dateiName) {
  const fh = await ordnerHandle.getFileHandle(dateiName);
  const file = await fh.getFile();
  const fp = dateiName + '|' + file.size;
  if (vsGelesen.includes(fp)) return null;
  if (file.size > MAX_DATEIGROESSE_MB * 1024 * 1024) throw new Error('Datei zu groß');
  const base64 = arrayBufferToBase64(await file.arrayBuffer());
  const ergebnis = await vsGemini(base64, file.type || guessMime(dateiName));
  const r = vsUebernehmen(ergebnis, dateiName);
  vsGelesen.push(fp);
  vsAusstehend = vsAusstehend.filter(n => n !== dateiName);
  vsSpeichern();
  return r;
}

// Nach jeder Ablage: Versicherungsdokument nur vormerken – ausgelesen wird erst auf Anforderung
function vsVormerken(folderName, dateiName) {
  const kat = vsVersicherungsKategorie();
  if (!kat || kat.folderName !== folderName) return;
  if (!vsAusstehend.includes(dateiName)) { vsAusstehend.push(dateiName); vsSpeichern(); }
  vsBadgeAktualisieren();
}

async function vsOrdnerAuslesen() {
  if (_vsScanLaeuft) return;
  const prefix = (document.getElementById('vsPrefix')?.value || '').trim();
  const kat = vsVersicherungsKategorie();
  if (!kat) { toast('Keine Kategorie „Versicherungen“ vorhanden', 'warn'); return; }
  if (!await ensureWorkspace()) return;
  const info = document.getElementById('vsScanInfo');
  _vsScanLaeuft = true;
  let neu = 0, akt = 0, fehler = 0, n = 0;
  try {
    const ordner = await workspaceHandle.getDirectoryHandle(kat.folderName, { create: false });
    const liste = [];
    for await (const [name, h] of ordner.entries()) {
      if (h.kind !== 'file' || !/\.(pdf|jpg|jpeg|png|webp|gif|heic)$/i.test(name)) continue;
      if (!name.startsWith(prefix) && !vsAusstehend.includes(name)) continue;
      const f = await h.getFile();
      if (!vsGelesen.includes(name + '|' + f.size)) liste.push(name);
    }
    liste.sort();
    if (!liste.length) { toast('Keine neuen Dokumente' + (prefix ? ' mit „' + prefix + '…“' : '') + ' im Ordner ' + kat.folderName, 'info'); return; }
    for (const name of liste) {
      n++;
      if (info) info.textContent = 'Lese ' + n + '/' + liste.length + ': ' + name;
      try {
        const r = await vsDateiAuslesen(ordner, name);
        if (r) { neu += r.neu; akt += r.aktualisiert; }
      } catch (e) {
        fehler++;
        console.warn('Auslesen fehlgeschlagen:', name, e);
        if (/(?:Gemini|Claude) (402|429|401|403)/.test(e.message)) {
          toast(e.message.includes(' 402') ? '💳 Guthaben beim KI-Anbieter aufgebraucht (402) – Auslesen abgebrochen. Nach dem Aufladen erneut starten.'
            : e.message.includes('429') ? geminiLimitMeldung(e.message) + ' Noch nicht gelesene Dokumente bleiben vorgemerkt.'
            : 'Abgebrochen: ' + e.message.substring(0, 120), 'err');
          break;
        }
      }
      if (n < liste.length) await sleep(GEMINI_REQUEST_DELAY_MS);
    }
    toast('🛡 ' + n + ' Dokument(e) gelesen: ' + neu + ' Verträge neu, ' + akt + ' aktualisiert' + (fehler ? ', ' + fehler + ' Fehler' : ''), fehler ? 'warn' : 'ok');
  } catch (e) {
    toast('Auslesen fehlgeschlagen: ' + e.message, 'err');
  } finally {
    _vsScanLaeuft = false;
    if (info) info.textContent = '';
    renderVersicherungen();
  }
}

// ── Oberfläche ──
function vsBadgeAktualisieren() {
  const b = document.getElementById('vsBadge');
  if (!b) return;
  const unter = vsHaushalt.personen.reduce((a, p) => a + vsBewertePerson(p).filter(r => r.status === 'unter' || r.status === 'fehlt').length, 0)
    + vsBewerteHaushalt().filter(r => r.status === 'unter' || r.status === 'fehlt').length;
  const n = vsHaushalt.personen.length ? unter + vsOffeneFragen().length + vsAusstehend.length : 0;
  b.textContent = n;
  b.style.display = n > 0 ? 'inline-flex' : 'none';
}

const VS_STATUS_TEXT = { ok: '✓', unter: '⚠ unterversichert', fehlt: '⚠ fehlt', offen: '? offen', empfohlen: 'empfohlen', optional: 'optional', info: '', kapital: '' };

function vsHoehe(r) {
  if (r.status === 'kapital' || (r.status === 'offen' && VS_SPARTEN[r.sparte]?.kapital)) {
    const x = r.policen[0];
    const teile = [];
    if (x.auszahlungGarantiert != null) teile.push(vsEuro(x.auszahlungGarantiert) + ' garantiert');
    if (x.auszahlungPrognose != null) teile.push('≈ ' + vsEuro(x.auszahlungPrognose) + ' Prognose');
    return '<b>Auszahlung ' + (x.auszahlungsjahr || '?') + ':</b> ' + (teile.join(' / ') || 'Summe offen');
  }
  let ist;
  if (typeof r.ist === 'number') ist = vsEuro(r.ist) + (VS_SPARTEN[r.sparte]?.proMonat ? '/Monat' : '');
  else ist = r.ist ? esc(r.ist) : (r.policen.length ? '?' : '–');
  return ist + (r.empf ? ' <span class="vs-empf">(' + esc(r.empf) + ')</span>' : '');
}

function vsTabelle(rows) {
  if (!rows.length) return '<div class="empty" style="padding:8px 0;">Keine Einträge</div>';
  return '<div style="overflow-x:auto;"><table class="vs-table"><thead><tr><th>Versicherung</th><th>Versicherer</th><th>Wogegen</th><th>Höhe (Empfehlung)</th><th>Beitrag</th><th>Status</th></tr></thead><tbody>' +
    rows.map(r => {
      const cls = r.status === 'unter' || r.status === 'fehlt' ? 'vs-unter' : r.status === 'offen' ? 'vs-offen' : r.status === 'optional' || r.status === 'empfohlen' || r.status === 'info' ? 'vs-opt' : 'vs-ok';
      const vers = r.policen.map(x => '<a href="#" data-vs-action="police-edit" data-id="' + esc(x.id) + '">' + esc(x.versicherer || '?') + '</a>' + (x.nummer ? '<br><span class="vs-klein">' + esc(x.nummer) + '</span>' : '')).join('<br>') || '–';
      const gegen = esc(r.policen.map(x => x.leistung).filter(Boolean).join('; ') || VS_SPARTEN[r.sparte]?.gegen || '');
      const beitrag = r.policen.filter(x => x.beitrag != null).map(x => vsEuro(x.beitrag) + (x.beitragIntervall ? ' ' + esc(x.beitragIntervall) : '')).join('<br>') || '–';
      return '<tr class="' + cls + '"><td><b>' + esc(r.label) + '</b></td><td>' + vers + '</td><td>' + gegen + '</td><td>' + vsHoehe(r) + '</td><td>' + beitrag + '</td>' +
        '<td><span class="vs-status">' + (VS_STATUS_TEXT[r.status] || '') + '</span>' + (r.hinweis ? '<div class="vs-klein">' + esc(r.hinweis) + '</div>' : '') + '</td></tr>';
    }).join('') + '</tbody></table></div>';
}

function vsFrageEingabe(q, i) {
  const id = 'vsA' + i;
  if (q.typ === 'select') return '<select id="' + id + '"><option value="">– wählen –</option>' + Object.entries(q.optionen).map(([k, v]) => '<option value="' + k + '">' + esc(v) + '</option>').join('') + '</select>';
  if (q.typ === 'jn') return '<select id="' + id + '"><option value="">– wählen –</option><option value="ja">Ja</option><option value="nein">Nein</option></select>';
  if (q.typ === 'datum') return '<input type="date" id="' + id + '">';
  if (q.typ === 'zahl') return '<input type="text" inputmode="decimal" id="' + id + '">';
  if (q.typ === 'personen') return '<div id="' + id + '" class="vs-checks">' + [['haushalt', 'Familie/Haushalt'], ...vsHaushalt.personen.map(p => [p.id, p.name])]
    .map(([k, v]) => '<label><input type="checkbox" value="' + esc(k) + '"> ' + esc(v) + '</label>').join('') + '</div>';
  return '<input type="text" id="' + id + '" placeholder="Antwort / Notiz">';
}

function renderVersicherungen() {
  const el = document.getElementById('vsInhalt');
  if (!el) return;
  const personen = vsHaushalt.personen;
  let html = '<div class="info-box" style="margin-bottom:16px;">Orientierung nach Faustregeln unabhängiger Verbraucherschützer (u. a. Finanztip, Verbraucherzentrale) – keine Beratung. Die Richtwerte findest du unten unter „Empfehlungswerte“; bitte gelegentlich gegenprüfen.</div>';

  if (!personen.length) {
    html += '<div class="card"><div class="card-title" style="margin-bottom:8px;">Los geht’s: Personen anlegen</div>' +
      '<p style="font-size:13px;color:var(--text2);margin-bottom:12px;">Lege alle Personen im Haushalt an (Name, Geburtsdatum, Familienstand, Schule/Studium/Beruf …). Danach liest die App deine Versicherungsunterlagen aus und stellt offene Fragen.</p>' +
      '<button class="btn btn-primary btn-sm" data-vs-action="person-neu">+ Person anlegen</button></div>';
    el.innerHTML = html;
    vsBadgeAktualisieren();
    return;
  }

  // Vorgemerkte, noch nicht ausgelesene Dokumente
  if (vsAusstehend.length) {
    html += '<div class="card" style="border-color:var(--accent);"><div class="vs-kopf" style="margin-bottom:0;align-items:center;"><div>' +
      '<div class="card-title">📄 ' + vsAusstehend.length + ' neue(s) Versicherungsdokument(e) noch nicht ausgelesen</div>' +
      '<div class="vs-klein">Wird erst auf Anforderung an Gemini geschickt.</div></div>' +
      '<button class="btn btn-primary btn-sm" data-vs-action="scan">Jetzt auslesen</button></div></div>';
  }

  // Offene Fragen
  const fragen = vsOffeneFragen();
  if (fragen.length) {
    html += '<div class="card"><div class="card-title" style="margin-bottom:10px;">❓ Offene Fragen (' + fragen.length + ')</div>' +
      fragen.slice(0, 15).map((q, i) => '<div class="vs-frage"><div class="vs-frage-text">' + esc(q.text) + '</div><div class="vs-frage-eingabe">' + vsFrageEingabe(q, i) +
        '<button class="btn btn-primary btn-sm" data-vs-action="frage-ok" data-i="' + i + '">OK</button>' +
        '<button class="btn btn-ghost btn-sm" data-vs-action="frage-skip" data-i="' + i + '" title="Nicht mehr fragen">Überspringen</button></div></div>').join('') +
      (fragen.length > 15 ? '<div class="vs-klein">… und ' + (fragen.length - 15) + ' weitere</div>' : '') + '</div>';
  }

  // Änderungen
  const ev = vsEreignisse();
  html += '<div class="card"><div class="card-title" style="margin-bottom:10px;">📅 Änderungen in den nächsten ' + vsWerte.vorschauMonate + ' Monaten</div>' +
    (ev.length ? ev.map(e => '<div class="vs-ev"><span class="vs-ev-' + e.art + '">' + (e.art === 'plus' ? '▲' : '▼') + '</span><span class="vs-ev-datum">' + vsDatumText(e.datum) + '</span><span><b>' + esc(e.wer) + ':</b> ' + esc(e.text) + '</span></div>').join('')
      : '<div class="vs-klein">Keine absehbaren Änderungen.</div>') + '</div>';

  // Je Person
  for (const p of personen) {
    const alter = vsAlter(p.geburtsdatum);
    const rows = vsBewertePerson(p);
    const probleme = rows.filter(r => r.status === 'unter' || r.status === 'fehlt').length;
    html += '<div class="card"><div class="vs-kopf"><div><div class="card-title">' + esc(p.name) + (alter !== null ? ', ' + alter + ' J.' : '') + '</div>' +
      '<div class="vs-klein">' + [VS_FAMILIENSTAND[p.familienstand], VS_STATUS[p.status], VS_KV[p.kv]].filter(Boolean).map(esc).join(' · ') + '</div></div>' +
      '<div style="display:flex;gap:8px;align-items:center;">' + (probleme ? '<span class="vs-zaehler">' + probleme + ' Lücke' + (probleme > 1 ? 'n' : '') + '</span>' : '<span class="vs-zaehler ok">keine Lücken</span>') +
      '<button class="btn btn-ghost btn-sm" data-vs-action="person-edit" data-id="' + esc(p.id) + '">✏️</button></div></div>' + vsTabelle(rows) + '</div>';
  }

  // Haushalt
  html += '<div class="card"><div class="vs-kopf"><div><div class="card-title">🏠 Haushalt</div><div class="vs-klein">' +
    [VS_WOHNEN[vsHaushalt.wohnsituation], vsHaushalt.wohnflaeche ? vsHaushalt.wohnflaeche + ' m²' : '', vsHaushalt.autos != null ? vsHaushalt.autos + ' Auto(s)' : '', vsHaushalt.hund ? 'Hund' : '']
      .filter(Boolean).map(esc).join(' · ') + '</div></div><button class="btn btn-ghost btn-sm" data-vs-action="haushalt-edit">✏️</button></div>' + vsTabelle(vsBewerteHaushalt()) + '</div>';

  // Verwaltung
  html += '<div class="card"><div class="card-title" style="margin-bottom:10px;">Unterlagen & Verträge</div>' +
    '<p style="font-size:13px;color:var(--text2);margin-bottom:10px;">Ausgelesen wird nur auf Anforderung (spart KI-Kontingent): vorgemerkte neue Versicherungsdokumente' + (vsAusstehend.length ? ' (<b>' + vsAusstehend.length + '</b>)' : '') + ' und vorhandene Dokumente, deren Name so beginnt:</p>' +
    '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:8px;"><span class="vs-klein">Dateiname beginnt mit</span><input type="text" id="vsPrefix" value="2026" style="width:90px;" class="vs-input">' +
    '<button class="btn btn-primary btn-sm" data-vs-action="scan">📂 Ordner Versicherungen auslesen</button></div><div id="vsScanInfo" class="vs-klein"></div>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;"><button class="btn btn-ghost btn-sm" data-vs-action="person-neu">+ Person</button>' +
    '<button class="btn btn-ghost btn-sm" data-vs-action="police-neu">+ Vertrag manuell</button><button class="btn btn-ghost btn-sm" data-vs-action="werte-edit">Empfehlungswerte</button></div>' +
    '<div class="vs-klein" style="margin-top:12px;">' + vsPolicen.length + ' Verträge erfasst' + (vsPolicen.length ? ':' : '') + '</div>' +
    vsPolicen.map(x => '<div class="dash-log-row" style="gap:8px;"><span class="dash-log-name" style="white-space:normal;">' + (vsAktiv(x) ? '' : '<s>') +
      esc((VS_SPARTEN[x.sparte]?.label || x.sparte) + ' · ' + (x.versicherer || '?') + ' · ' + (x.personen.map(vsPersonName).join(', ') || 'Person offen')) + (vsAktiv(x) ? '' : '</s>') +
      '</span><button class="btn btn-ghost btn-sm" data-vs-action="police-edit" data-id="' + esc(x.id) + '">✏️</button></div>').join('') + '</div>';

  el.innerHTML = html;
  el._fragen = fragen;
  vsBadgeAktualisieren();
}

// ── Formulare im Overlay ──
function vsFormular(titel, felder, werte, onSave, onDelete) {
  const box = document.getElementById('vsModal');
  box.innerHTML = '<h2 style="margin-bottom:14px;">' + esc(titel) + '</h2><div class="form-grid">' + felder.map(f => {
    const v = werte[f.k];
    let input;
    if (f.typ === 'select') input = '<select id="vsF_' + f.k + '"><option value="">–</option>' + Object.entries(f.opt).map(([k, l]) => '<option value="' + esc(k) + '"' + (String(v) === k ? ' selected' : '') + '>' + esc(l) + '</option>').join('') + '</select>';
    else if (f.typ === 'personen') input = '<div id="vsF_' + f.k + '" class="vs-checks">' + [['haushalt', 'Familie/Haushalt'], ...vsHaushalt.personen.map(p => [p.id, p.name])]
      .map(([k, l]) => '<label><input type="checkbox" value="' + esc(k) + '"' + ((v || []).includes(k) ? ' checked' : '') + '> ' + esc(l) + '</label>').join('') + '</div>';
    else input = '<input type="' + (f.typ === 'datum' ? 'date' : 'text') + '" id="vsF_' + f.k + '" value="' + esc(v == null ? '' : f.typ === 'zahl' ? String(v) : v) + '"' + (f.typ === 'zahl' ? ' inputmode="decimal"' : '') + '>';
    return '<div class="fg' + (f.voll ? ' form-full' : '') + '"><label>' + esc(f.l) + '</label>' + input + '</div>';
  }).join('') + '</div><div class="modal-actions">' + (onDelete ? '<button class="btn btn-danger" id="vsDel">Löschen</button>' : '') +
    '<button class="btn btn-ghost" id="vsAbbr">Abbrechen</button><button class="btn btn-success" id="vsOk">✓ Speichern</button></div>';
  const ov = document.getElementById('vsOverlay');
  ov.classList.add('active');
  const zu = () => ov.classList.remove('active');
  document.getElementById('vsAbbr').onclick = zu;
  if (onDelete) document.getElementById('vsDel').onclick = () => { if (onDelete()) zu(); };
  document.getElementById('vsOk').onclick = () => {
    const neu = {};
    for (const f of felder) {
      const e = document.getElementById('vsF_' + f.k);
      if (f.typ === 'personen') neu[f.k] = [...e.querySelectorAll('input:checked')].map(c => c.value);
      else if (f.typ === 'zahl') neu[f.k] = vsZahl(e.value);
      else if (f.typ === 'jn') neu[f.k] = e.value === 'ja' ? true : e.value === 'nein' ? false : null;
      else neu[f.k] = e.value.trim();
    }
    if (onSave(neu) !== false) { zu(); renderVersicherungen(); }
  };
}

const VS_JN = { ja: 'Ja', nein: 'Nein' };
function vsJnWert(v) { return v === true ? 'ja' : v === false ? 'nein' : ''; }

function vsPersonFormular(p) {
  const felder = [
    { k: 'name', l: 'Name', voll: true }, { k: 'geburtsdatum', l: 'Geburtsdatum', typ: 'datum' },
    { k: 'familienstand', l: 'Familienstand', typ: 'select', opt: VS_FAMILIENSTAND },
    { k: 'status', l: 'Schule / Studium / Beruf', typ: 'select', opt: VS_STATUS },
    { k: 'ausbildungsende', l: 'Ende Schule/Ausb./Studium (Jahr)', typ: 'zahl' },
    { k: 'kv', l: 'Krankenversicherung', typ: 'select', opt: VS_KV },
    { k: 'nettoMonat', l: 'Netto pro Monat (€)', typ: 'zahl' }, { k: 'bruttoJahr', l: 'Brutto pro Jahr (€)', typ: 'zahl' },
    { k: 'abhaengige', l: 'Andere finanziell abhängig?', typ: 'jn' }
  ];
  const werte = p ? { ...p, abhaengige: vsJnWert(p.abhaengige) } : {};
  felder.find(f => f.k === 'abhaengige').typ = 'select';
  felder.find(f => f.k === 'abhaengige').opt = VS_JN;
  vsFormular(p ? 'Person bearbeiten' : 'Person anlegen', felder, werte, neu => {
    if (!neu.name) { toast('Bitte Namen eingeben', 'warn'); return false; }
    neu.abhaengige = neu.abhaengige === 'ja' ? true : neu.abhaengige === 'nein' ? false : null;
    if (p) Object.assign(p, neu);
    else vsHaushalt.personen.push({ id: 'p_' + Date.now().toString(36), ...neu });
    vsSpeichern();
  }, p ? () => {
    if (!confirm(p.name + ' löschen? Verträge bleiben erhalten.')) return false;
    vsHaushalt.personen = vsHaushalt.personen.filter(x => x.id !== p.id);
    vsPolicen.forEach(x => x.personen = x.personen.filter(id => id !== p.id));
    vsSpeichern(); renderVersicherungen(); return true;
  } : null);
}

function vsHaushaltFormular() {
  const h = vsHaushalt;
  vsFormular('Haushalt', [
    { k: 'wohnsituation', l: 'Wohnsituation', typ: 'select', opt: VS_WOHNEN }, { k: 'wohnflaeche', l: 'Wohnfläche (m²)', typ: 'zahl' },
    { k: 'autos', l: 'Anzahl Autos', typ: 'zahl' }, { k: 'hund', l: 'Hund?', typ: 'select', opt: VS_JN },
    { k: 'kreditRestschuld', l: 'Offene Kreditschuld (€)', typ: 'zahl' }
  ], { ...h, hund: vsJnWert(h.hund) }, neu => {
    neu.hund = neu.hund === 'ja' ? true : neu.hund === 'nein' ? false : null;
    Object.assign(vsHaushalt, neu); vsSpeichern();
  });
}

function vsPoliceFormular(x) {
  const spartenOpt = Object.fromEntries(Object.entries(VS_SPARTEN).map(([k, v]) => [k, v.label]));
  const felder = [
    { k: 'sparte', l: 'Art', typ: 'select', opt: spartenOpt }, { k: 'versicherer', l: 'Versicherer' },
    { k: 'nummer', l: 'Vertragsnummer' }, { k: 'versicherungsnehmer', l: 'Versicherungsnehmer' },
    { k: 'personen', l: 'Versicherte Personen', typ: 'personen', voll: true }, { k: 'leistung', l: 'Wogegen versichert', voll: true },
    { k: 'deckungssumme', l: 'Deckungssumme € (BU: Rente/Monat)', typ: 'zahl' }, { k: 'beitrag', l: 'Beitrag (€)', typ: 'zahl' },
    { k: 'beitragIntervall', l: 'Beitrag je', typ: 'select', opt: { monatlich: 'Monat', vierteljährlich: 'Quartal', halbjährlich: 'Halbjahr', jährlich: 'Jahr' } },
    { k: 'beginn', l: 'Beginn', typ: 'datum' }, { k: 'ende', l: 'Ende / Ablauf', typ: 'datum' },
    { k: 'auszahlungsjahr', l: 'Auszahlungsjahr (Kapital)', typ: 'zahl' }, { k: 'auszahlungGarantiert', l: 'Auszahlung garantiert (€)', typ: 'zahl' },
    { k: 'auszahlungPrognose', l: 'Auszahlung Prognose (€)', typ: 'zahl' }, { k: 'elementar', l: 'Elementarschäden?', typ: 'select', opt: VS_JN },
    { k: 'status', l: 'Status', typ: 'select', opt: { aktiv: 'aktiv', beendet: 'beendet/gekündigt' } }, { k: 'notiz', l: 'Notiz', voll: true }
  ];
  const werte = x ? { ...x, elementar: vsJnWert(x.elementar) } : { status: 'aktiv', personen: [] };
  vsFormular(x ? 'Vertrag bearbeiten' : 'Vertrag anlegen', felder, werte, neu => {
    if (!neu.sparte) { toast('Bitte Art wählen', 'warn'); return false; }
    neu.elementar = neu.elementar === 'ja' ? true : neu.elementar === 'nein' ? false : null;
    if (x) {
      const geaendert = Object.keys(neu).filter(k => JSON.stringify(neu[k]) !== JSON.stringify(x[k] ?? (k === 'elementar' ? null : '')));
      Object.assign(x, neu);
      x.manuell = [...new Set([...(x.manuell || []), ...geaendert])];
    } else {
      vsPolicen.push({ id: 'v_' + Date.now().toString(36), ...neu, quellen: [], fragen: [], unbekanntePersonen: [], manuell: Object.keys(neu) });
    }
    vsSpeichern();
  }, x ? () => {
    if (!confirm('Vertrag löschen? (Zum Beenden besser Status „beendet“ wählen.)')) return false;
    vsPolicen = vsPolicen.filter(y => y.id !== x.id); vsSpeichern(); renderVersicherungen(); return true;
  } : null);
}

function vsWerteFormular() {
  vsFormular('Empfehlungswerte', Object.keys(VS_STANDARD_WERTE).map(k => ({ k, l: VS_WERTE_LABEL[k], typ: 'zahl' })), vsWerte, neu => {
    for (const k of Object.keys(neu)) if (neu[k] == null) neu[k] = VS_STANDARD_WERTE[k];
    vsWerte = neu; vsSpeichern();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('vsInhalt')?.addEventListener('click', e => {
    const b = e.target.closest('[data-vs-action]');
    if (!b) return;
    e.preventDefault();
    const a = b.dataset.vsAction, el = document.getElementById('vsInhalt');
    if (a === 'person-neu') vsPersonFormular(null);
    else if (a === 'person-edit') vsPersonFormular(vsHaushalt.personen.find(p => p.id === b.dataset.id));
    else if (a === 'haushalt-edit') vsHaushaltFormular();
    else if (a === 'police-neu') vsPoliceFormular(null);
    else if (a === 'police-edit') vsPoliceFormular(vsPolicen.find(x => x.id === b.dataset.id));
    else if (a === 'werte-edit') vsWerteFormular();
    else if (a === 'scan') mitSperre(vsOrdnerAuslesen);
    else if (a === 'frage-skip' || a === 'frage-ok') {
      const i = parseInt(b.dataset.i), q = el._fragen?.[i];
      if (!q) return;
      if (a === 'frage-skip') { vsErledigt.push(q.id); vsSpeichern(); renderVersicherungen(); return; }
      const inp = document.getElementById('vsA' + i);
      let wert;
      if (q.typ === 'personen') wert = [...inp.querySelectorAll('input:checked')].map(c => c.value);
      else if (q.typ === 'zahl') wert = vsZahl(inp.value);
      else if (q.typ === 'jn') wert = inp.value === 'ja' ? true : inp.value === 'nein' ? false : null;
      else wert = inp.value.trim();
      if (wert === null || wert === '' || (Array.isArray(wert) && !wert.length)) { toast('Bitte eine Antwort eingeben', 'warn'); return; }
      vsAntwortSetzen(q, wert);
      renderVersicherungen();
    }
  });
});
