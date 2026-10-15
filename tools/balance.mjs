// Balance-Simulation: tausend Saisons je Strategie mit genau der Spiellogik
// aus src/modell.js. Gibt die Verteilung der Ausgaenge aus und bricht mit
// Fehler ab, wenn die Zielvorgaben verletzt sind:
//   - keine Strategie landet fast immer ganz oben (>= 90 %)
//   - keine Strategie geht fast immer pleite (>= 95 %)
//   - Durchklicken landet im Mittelfeld, nicht oben
//   - mindestens drei verschiedene Wege fuehren oft nach oben
// Zusaetzlich: Wie gut sagt die Vorschau die Woche voraus?
//
// Aufruf: npm run balance  [-- --laeufe 5000]

import * as M from "../src/modell.js";
import { PROJEKTE } from "../src/data/projekte.js";
import { REGELN as R } from "../src/data/saison.js";

const LAEUFE = Number(process.argv[process.argv.indexOf("--laeufe") + 1]) || 1000;
const KURZ = ["Verkauf", "knapp", "trägt sich", "gut gebucht", "ausgebucht"];

// --- Hilfen fuer Strategien ------------------------------------------------
const moeglich = (s) => PROJEKTE.filter((p) => M.projektStatus(s, p).moeglich);
const nachFolge = (s, folge, reserve) => {
  if (s.laufend) return M.projekt(s.laufend.id);
  const p = folge.map(M.projekt).find((x) => moeglich(s).includes(x));
  return p && M.projektKosten(s, p) <= s.geld - reserve ? p : null;
};
/** Baut einen gueltigen Plan aus Wuenschen: offene Zimmer, Projekt, Rest Pflege. */
function plan(s, offen, p, wahl = null, projektAnteil = 1) {
  const t = M.tage(s, wahl);
  offen = Math.max(0, Math.min(offen, s.zimmer, t));
  let projektTage = 0;
  if (p) {
    const rest = s.laufend?.id === p.id ? s.laufend.rest : p.tage;
    projektTage = Math.min(rest, Math.floor((t - offen) * projektAnteil));
    if (p.tage === 0) projektTage = 0;
  }
  const pl = { offen, projekt: p ? p.id : null, projektTage, pflegeTage: t - offen - projektTage };
  return M.planFehler(s, pl, wahl) ? M.standardPlan(s) : pl;
}

// --- Strategien: (s, zufall) => { plan, wahl } -----------------------------
const STRATEGIEN = {
  "Zufall": (s, r) => {
    const wahl = s.ereignis?.wahl ? Math.floor(r() * 2) : null;
    const m = moeglich(s);
    const p = s.laufend ? M.projekt(s.laufend.id) : (m.length && r() < 0.6 ? m[Math.floor(r() * m.length)] : null);
    return { plan: plan(s, Math.floor(r() * (s.zimmer + 1)), p, wahl, r()), wahl };
  },
  "Durchklicken": (s) => ({ plan: M.standardPlan(s), wahl: null }),
  "Erst alles renovieren": (s) => {
    const p = nachFolge(s, ["dach", "fassade", "terrasse", "laeden", "garten", "laternen", "zimmer2", "zimmer3", "kueche"], 0);
    return { plan: plan(s, s.woche >= 7 ? 9 : 0, p), wahl: 0 };
  },
  "Früh öffnen, Zimmer ausbauen": (s) => {
    const p = nachFolge(s, ["dach", "zimmer2", "hilfe", "zimmer3", "turm"], 200);
    return { plan: plan(s, 9, p), wahl: 0 };
  },
  "Ausgewogen": (s) => {
    const m = moeglich(s).filter((p) => M.projektKosten(s, p) <= s.geld - 400 && p.charme > 0)
      .sort((a, b) => b.charme / b.geld - a.charme / a.geld);
    const p = s.laufend ? M.projekt(s.laufend.id) : m[0] || null;
    const offen = M.charme(s) >= 28 || s.geld < 600 ? 3 : 0;
    return { plan: plan(s, offen, p, 0, 0.8), wahl: 0 };
  },
  "Planer": (s) => {
    const p = nachFolge(s, ["laternen", "garten", "laeden", "dach", "hilfe", "zimmer2", "zimmer3", "terrasse", "fassade", "kueche", "turm"], 250);
    return { plan: plan(s, M.charme(s) >= 26 ? (p ? 4 : 9) : 0, p), wahl: 0 };
  },
  "Boutique": (s) => {
    const p = nachFolge(s, ["laternen", "garten", "laeden", "terrasse", "fassade", "kueche", "dach", "zimmer2"], 200);
    return { plan: plan(s, M.charme(s) >= 30 ? 2 : 0, p), wahl: 0 };
  },
  "Sparsam": (s) => {
    const p = s.laufend ? M.projekt(s.laufend.id) : moeglich(s).find((x) => x.geld <= 300 && x.charme > 0) || null;
    return { plan: plan(s, 2, p, 1, 0.5), wahl: 1 };
  }
};

// --- Simulation ----------------------------------------------------------
let abweichung = 0, wochen = 0;
const ergebnisse = {};
for (const [name, strategie] of Object.entries(STRATEGIEN)) {
  const zaehl = [0, 0, 0, 0, 0];
  let geld = 0, charme = 0; const werte = [];
  for (let i = 0; i < LAEUFE; i++) {
    const s = M.neuesSpiel(i * 7919 + name.length);
    let r0 = i * 104729 + 17;
    const r = () => { r0 = (r0 * 1103515245 + 12345) & 0x7fffffff; return r0 / 0x7fffffff; };
    while (!s.ende) {
      M.wocheBeginnen(s);
      const { plan: pl, wahl } = strategie(s, r);
      const erwartet = M.vorschau(s, pl, wahl);
      const b = M.wocheAusfuehren(s, pl, wahl);
      abweichung += Math.abs((b.geld - b.geldVorher) - erwartet.saldo); wochen++;
    }
    const a = M.ausgang(s);
    zaehl[a]++; geld += s.geld; charme += M.charme(s); werte.push(s.geld + R.charmeWert * M.charme(s));
  }
  werte.sort((a, b) => a - b);
  ergebnisse[name] = { anteil: zaehl.map((z) => z / LAEUFE), geld: geld / LAEUFE, charme: charme / LAEUFE,
    p10: werte[Math.floor(LAEUFE * 0.1)], p50: werte[Math.floor(LAEUFE * 0.5)], p90: werte[Math.floor(LAEUFE * 0.9)] };
}

// --- Ausgabe -------------------------------------------------------------
const pct = (x) => (x * 100).toFixed(0).padStart(4) + " %";
console.log(`\n${LAEUFE} Saisons je Strategie\n`);
console.log("Strategie".padEnd(30) + KURZ.map((k) => k.padStart(13)).join("") + "   Ø Geld   Ø Charme");
for (const [name, e] of Object.entries(ergebnisse)) {
  console.log(name.padEnd(30) + e.anteil.map((a) => pct(a).padStart(13)).join("") +
    String(Math.round(e.geld)).padStart(9) + String(Math.round(e.charme)).padStart(10) +
    (process.argv.includes("--streuung") ? `   Wert P10/P50/P90 ${e.p10}/${e.p50}/${e.p90}` : ""));
}
console.log(`\nVorschau-Treue: Ø Abweichung ${Math.round(abweichung / wochen)} € pro Woche (Zufall bei Gästen)`);

// --- Zielvorgaben ----------------------------------------------------------
const verstoss = [];
for (const [name, e] of Object.entries(ergebnisse)) {
  if (e.anteil[4] >= 0.9) verstoss.push(`${name} landet zu ${pct(e.anteil[4]).trim()} ganz oben`);
  if (e.anteil[0] >= 0.95) verstoss.push(`${name} geht zu ${pct(e.anteil[0]).trim()} pleite`);
}
const klick = ergebnisse["Durchklicken"].anteil;
const modus = klick.indexOf(Math.max(...klick));
if (modus < 1 || modus > 2) verstoss.push(`Durchklicken landet meist bei „${KURZ[modus]}“, Ziel: Mittelfeld`);
if (klick[3] + klick[4] >= 0.1) verstoss.push("Durchklicken kommt zu oft nach oben");
const wege = Object.entries(ergebnisse).filter(([, e]) => e.anteil[3] + e.anteil[4] >= 0.2).map(([n]) => n);
if (wege.length < 3) verstoss.push(`Nur ${wege.length} Wege führen oft nach oben (Ziel: mindestens 3)`);

console.log(`Wege, die oft nach oben führen: ${wege.join(", ")}`);
if (verstoss.length) {
  console.error("\nZielvorgaben verletzt:");
  verstoss.forEach((v) => console.error("  " + v));
  process.exit(1);
}
console.log("Zielvorgaben erfüllt.");
