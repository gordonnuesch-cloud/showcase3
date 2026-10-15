// Die ganze Spiellogik, ohne DOM. Das Spiel rechnet damit, und
// tools/balance.mjs simuliert damit tausend Saisons - es gibt keine zweite
// Fassung der Regeln, die auseinanderlaufen koennte.
//
// Ablauf einer Woche:
//   wocheBeginnen(s)        Ereignis ziehen (steht beim Planen schon fest)
//   plan = standardPlan(s)  Vorschlag: alle Zimmer offen, Rest Pflege
//   vorschau(s, plan)       erwartete Woche, ohne Zufall - fuer die Anzeige
//   wocheAusfuehren(s, plan, wahlIndex)  rechnet ab, gibt einen Bericht

import { WOCHEN, NACHFRAGE, START, REGELN as R, AUSGAENGE, SCHWELLEN as SW } from "./data/saison.js";
import { PROJEKTE } from "./data/projekte.js";
import { EREIGNISSE } from "./data/ereignisse.js";

export const ANZAHL_WOCHEN = WOCHEN.length;
export const projekt = (id) => PROJEKTE.find((p) => p.id === id);

/** Kleiner, reproduzierbarer Zufall. Der Zustand liegt im Spielstand. */
function zufall(s) {
  s.saat = (s.saat + 0x6d2b79f5) | 0;
  let t = Math.imul(s.saat ^ (s.saat >>> 15), 1 | s.saat);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function neuesSpiel(saat = Date.now()) {
  const s = {
    saat: saat | 0, woche: 0, geld: START.geld, pflege: START.pflege, zimmer: START.zimmer,
    projektCharme: 0, fertig: [], laufend: null, hilfe: false, fruehstueck: false,
    ereignis: null, stapel: [], pleite: false, ende: false, gaeste: 0, verlauf: []
  };
  return s;
}

// --- Abgeleitete Werte ------------------------------------------------------

export const charme = (s) => Math.round(R.charmeBasis + s.projektCharme + s.pflege);
export const preis = (s) => Math.round(R.preisBasis + R.preisJeCharme * charme(s) + (s.fruehstueck ? R.preisFruehstueck : 0));
export const istFertig = (s, id) => s.fertig.includes(id);

/** Die gewaehlte Moeglichkeit eines Wahl-Ereignisses; ohne Wahl die erste. */
function wahlVon(s, wahlIndex) {
  const e = s.ereignis || {};
  return e.wahl ? e.wahl[wahlIndex ?? 0] : {};
}

/** Arbeitstage dieser Woche, inklusive Hilfe, Ereignis und Wahl. */
export function tage(s, wahlIndex = null) {
  const e = s.ereignis || {};
  const w = wahlVon(s, wahlIndex);
  return R.tage + (s.hilfe ? R.hilfeTage : 0) + (e.tage || 0) + (w.tage || 0);
}

export function auslastung(s) {
  const e = s.ereignis || {};
  return Math.min(1, NACHFRAGE[s.woche] * (e.nachfrage || 1) * charme(s) / R.auslastungTeiler);
}

/** Was ein Projekt jetzt kosten wuerde (Rabatt der Woche eingerechnet). */
export function projektKosten(s, p) {
  return Math.round(p.geld * (1 - (s.ereignis?.rabatt || 0)));
}

/** Signora Pia kommt erst, wenn es oben Zimmer geben kann. */
export const hilfeMoeglich = (s) => istFertig(s, "dach");

/** Kann dieses Projekt begonnen werden - und wenn nicht, warum? */
export function projektStatus(s, p) {
  if (istFertig(s, p.id)) return { moeglich: false, grund: "fertig" };
  if (s.laufend?.id === p.id) return { moeglich: true, laufend: true, rest: s.laufend.rest };
  if (s.laufend) return { moeglich: false, grund: "Erst das laufende Projekt beenden" };
  if (p.braucht && !istFertig(s, p.braucht)) return { moeglich: false, grund: `Braucht: ${projekt(p.braucht).name}` };
  if (projektKosten(s, p) > s.geld) return { moeglich: false, grund: "Zu wenig Geld" };
  return { moeglich: true };
}

// --- Woche ---------------------------------------------------------------------

/** Zieht das Ereignis der Woche. Ein gemischter Stapel, damit sich wenig wiederholt. */
export function wocheBeginnen(s) {
  if (s.ende) return;
  let e;
  for (let versuch = 0; versuch < 30; versuch++) {
    if (!s.stapel.length) {
      s.stapel = EREIGNISSE.map((x) => x.id);
      for (let i = s.stapel.length - 1; i > 0; i--) {
        const j = Math.floor(zufall(s) * (i + 1));
        [s.stapel[i], s.stapel[j]] = [s.stapel[j], s.stapel[i]];
      }
    }
    const id = s.stapel.pop();
    e = EREIGNISSE.find((x) => x.id === id);
    if (!e.braucht || istFertig(s, e.braucht)) break;
  }
  s.ereignis = e;
  // Der Handwerker kommt spaeter: das laufende Projekt dauert laenger -
  // laeuft nichts, trifft es das Projekt, das diese Woche beginnt.
  s.verzoegerung = 0;
  if (e.projektPlus) {
    if (s.laufend) s.laufend.rest += e.projektPlus;
    else s.verzoegerung = e.projektPlus;
  }
}

/** Der Vorschlag, den man mit einem Klick uebernimmt: alle Zimmer offen,
 *  ein laufendes Projekt weiter, der Rest Pflege. */
export function standardPlan(s) {
  const t = tage(s);
  const offen = Math.min(s.zimmer, t);
  const projektTage = s.laufend ? Math.min(s.laufend.rest, t - offen) : 0;
  return { offen, projekt: s.laufend?.id || null, projektTage, pflegeTage: t - offen - projektTage };
}

/** Prueft einen Plan; gibt null zurueck, wenn er gilt, sonst den Grund. */
export function planFehler(s, plan, wahlIndex = null) {
  const t = tage(s, wahlIndex);
  if (plan.offen < 0 || plan.projektTage < 0 || plan.pflegeTage < 0) return "Negative Tage";
  if (plan.offen > s.zimmer) return "Mehr Zimmer geöffnet als vorhanden";
  if (plan.offen + plan.projektTage + plan.pflegeTage > t) return "Mehr Tage verplant als vorhanden";
  if (plan.projektTage > 0 && !plan.projekt) return "Projekttage ohne Projekt";
  if (plan.projekt) {
    const st = projektStatus(s, projekt(plan.projekt));
    if (!st.moeglich) return st.grund;
  }
  if (plan.hilfe && !s.hilfe && !hilfeMoeglich(s)) return "Hilfe erst, wenn das Dach gedeckt ist";
  return null;
}

/** Erwartete Woche ohne Zufall - fuer die Anzeige vor dem Klick. */
export function vorschau(s, plan, wahlIndex = null) {
  const e = s.ereignis || {};
  const w = wahlVon(s, wahlIndex);
  const p = plan.projekt ? projekt(plan.projekt) : null;
  const startet = p && s.laufend?.id !== p.id;
  const kostenProjekt = startet ? projektKosten(s, p) : 0;
  const rest = p ? (startet ? p.tage + (s.verzoegerung || 0) : s.laufend.rest) : 0;
  const fertig = p && plan.projektTage >= rest;
  // Was diese Woche fertig wird, wirkt erst ab naechster Woche
  let naechte = plan.offen * Math.round(7 * auslastung(s));
  if (e.extraNaechte && plan.offen >= e.abZimmern) naechte += e.extraNaechte;
  const einnahmen = naechte * preis(s);
  const laufend = R.fixkosten + (s.hilfe ? R.hilfeKosten : 0) + naechte * R.proNacht;
  const sonstiges = (e.geld || 0) + (w.geld || 0);
  const kosten = laufend + kostenProjekt;
  const pflegeNeu = pflegeNachher(s, plan.pflegeTage, naechte, (e.pflege || 0) + (w.pflege || 0));
  const charmeNeu = Math.round(R.charmeBasis + s.projektCharme + (fertig ? p.charme : 0) + pflegeNeu);
  return {
    naechte, einnahmen, laufend, kostenProjekt, sonstiges, saldo: einnahmen - kosten + sonstiges,
    geldNachher: s.geld + einnahmen - kosten + sonstiges, charmeNachher: charmeNeu, projektFertig: fertig ? p.id : null
  };
}

function pflegeNachher(s, pflegeTage, naechte, extra) {
  const p = s.pflege + R.pflegeProTag * pflegeTage - R.pflegeVerfall - naechte / R.abnutzungJeNaechte + extra;
  return Math.max(0, Math.min(R.pflegeMax, p));
}

/** Rechnet die Woche ab. Gibt einen Bericht fuer die Anzeige zurueck. */
export function wocheAusfuehren(s, plan, wahlIndex = null) {
  const fehler = planFehler(s, plan, wahlIndex);
  if (fehler) throw new Error("Ungültiger Plan: " + fehler);
  const e = s.ereignis || {};
  if (e.wahl && wahlIndex === null) wahlIndex = 0;
  const w = wahlVon(s, wahlIndex);
  const vorher = { geld: s.geld, charme: charme(s), zimmer: s.zimmer };

  // Gaeste und Geld mit dem Stand vom Wochenbeginn. Was diese Woche fertig
  // wird, wirkt ab naechster Woche - so stimmt die Vorschau genau.
  const occ = auslastung(s);
  let naechte = 0;
  for (let i = 0; i < plan.offen; i++) {
    naechte += Math.round(7 * Math.min(1, Math.max(0, occ + (zufall(s) - 0.5) * 0.2)));
  }
  if (e.extraNaechte && plan.offen >= e.abZimmern) naechte += e.extraNaechte;
  const einnahmen = naechte * preis(s);
  const laufend = R.fixkosten + (s.hilfe ? R.hilfeKosten : 0) + naechte * R.proNacht;
  const sonstiges = (e.geld || 0) + (w.geld || 0);

  // Projekt beginnen bzw. weiterfuehren
  let fertigId = null, kostenProjekt = 0;
  if (plan.projekt) {
    const p = projekt(plan.projekt);
    if (s.laufend?.id !== p.id) {
      kostenProjekt = projektKosten(s, p);
      s.laufend = { id: p.id, rest: p.tage + (s.verzoegerung || 0) };
    }
    s.laufend.rest -= plan.projektTage;
    if (s.laufend.rest <= 0) {
      fertigId = p.id;
      s.fertig.push(p.id);
      s.projektCharme += p.charme;
      s.zimmer += p.zimmer || 0;
      if (p.fruehstueck) s.fruehstueck = true;
      s.laufend = null;
    }
  }
  const eingestellt = !!plan.hilfe && !s.hilfe;
  if (eingestellt) s.hilfe = true;

  s.geld += einnahmen - laufend - kostenProjekt + sonstiges;
  s.gaeste += naechte;
  s.pflege = pflegeNachher(s, plan.pflegeTage, naechte, (e.pflege || 0) + (w.pflege || 0));

  const bericht = {
    woche: s.woche, ereignis: e.id || null, wahl: wahlIndex, plan: { ...plan },
    naechte, einnahmen, laufend, kostenProjekt, sonstiges, fertig: fertigId, hilfe: eingestellt,
    geldVorher: vorher.geld, geld: s.geld, charmeVorher: vorher.charme, charme: charme(s),
    zimmerNeu: s.zimmer - vorher.zimmer
  };
  s.verlauf.push(bericht);
  s.woche++;
  s.ereignis = null;
  s.verzoegerung = 0;
  if (s.geld < R.dispo) { s.pleite = true; s.ende = true; }
  if (s.woche >= ANZAHL_WOCHEN) s.ende = true;
  return bericht;
}

// --- Bilanz --------------------------------------------------------------------

/** Index in AUSGAENGE, 0 = Verkauf ... 4 = ausgebucht. */
export function ausgang(s) {
  if (s.pleite || s.geld < 0) return 0;
  const c = charme(s), wert = s.geld + R.charmeWert * c;
  if (c >= SW.ausgebucht.charme && s.geld >= SW.ausgebucht.geld) return 4;
  if (wert >= SW.gutGebucht) return 3;
  if (wert >= SW.traegtSich) return 2;
  return 1;
}

export function bilanz(s) {
  const i = ausgang(s);
  return { index: i, ...AUSGAENGE[i], geld: s.geld, charme: charme(s), gaeste: s.gaeste, zimmer: s.zimmer, fertig: s.fertig.length };
}
