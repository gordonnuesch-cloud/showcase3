// Die Oberflaeche: Titel, Wochenplanung, Bericht, Saisonbilanz.
// Rechnet nichts selbst - alle Zahlen kommen aus modell.js, auch die
// Vorschau. So zeigt die Oberflaeche immer das, was das Spiel tut.

import * as M from "./modell.js";
import { WOCHEN, REGELN, START } from "./data/saison.js";
import { PROJEKTE, HILFE } from "./data/projekte.js";
import { Ton } from "./audio.js";

const $ = (id) => document.getElementById(id);
const euro = (n) => `${Math.round(n).toLocaleString("de-DE")} €`;
const mitVorzeichen = (n) => (n > 0 ? "+" : n < 0 ? "−" : "±") + euro(Math.abs(n)).replace(/^-/, "");

const SPEICHER = "villa-dei-limoni-v1";

// Was die Villa gerade zeigen soll; main.js liest das pro Bild.
const ansichtZustand = { s: null, abend: 0, abendZiel: 0, gaeste: 0 };
export const ansicht = () => ansichtZustand;

let s = null, plan = null, wahl = null, phase = "titel", letzterBericht = null, spaeterOffen = false;
let zuletztEingeblendet = "";

// --- Speicher (nur Bequemlichkeit: ein Neuladen kostet die Saison nicht) -----

function speichern() {
  try { localStorage.setItem(SPEICHER, JSON.stringify({ s, phase, letzterBericht })); } catch { /* privat */ }
}
function laden() {
  try { const d = JSON.parse(localStorage.getItem(SPEICHER) || "null"); return d && d.s ? d : null; } catch { return null; }
}
function vergessen() { try { localStorage.removeItem(SPEICHER); } catch { /* privat */ } }

// --- Start -----------------------------------------------------------------

export function starten() {
  const gespeichert = laden();
  s = gespeichert ? gespeichert.s : M.neuesSpiel();
  ansichtZustand.s = s;
  if (gespeichert && !s.ende && s.woche > 0) {
    letzterBericht = gespeichert.letzterBericht;
    titel(true);
  } else {
    if (gespeichert) { s = M.neuesSpiel(); ansichtZustand.s = s; vergessen(); }
    titel(false);
  }
  kennzahlen();
}

function titel(weiterspielen) {
  phase = "titel";
  $("panel").innerHTML = `
    <div class="karte titelkarte">
      <p class="ey">Ligurien, oberhalb von San Martino</p>
      <h2>Sechzehn Wochen bis Ferragosto</h2>
      <p>Geerbt von einer Großtante, die man zweimal im Leben gesehen hat. Das Dach ist undicht,
         der Garten verwildert, ein Zimmer ist bewohnbar. Auf dem Konto liegen ${euro(START.geld)}.</p>
      <p>Danach zeigt sich, ob die Villa bleibt.</p>
      <div class="zeile">
        ${weiterspielen ? `<button class="knopf" id="weiter">Weiterspielen · Woche ${s.woche + 1}</button>
          <button class="knopf leise" id="neu">Neue Saison</button>`
        : `<button class="knopf" id="neu">Saison beginnen</button>`}
      </div>
      <p class="klein">Jede Woche: sechs Tage einteilen – Zimmer öffnen, renovieren, pflegen. Alles zeigt vorher, was es kostet.</p>
    </div>`;
  $("neu").onclick = () => { vergessen(); s = M.neuesSpiel(); ansichtZustand.s = s; Ton.start(); neueWoche(); };
  if (weiterspielen) $("weiter").onclick = () => { Ton.start(); M.wocheBeginnen(s); planen(); };
}

// --- Woche planen ------------------------------------------------------------

function neueWoche() {
  M.wocheBeginnen(s);
  planen();
}

function planen() {
  phase = "planen";
  ansichtZustand.abendZiel = dunkel() ? 1 : 0;
  ansichtZustand.gaeste = 0;
  Ton.stimmung(s.woche, dunkel());
  s.lichter = [];
  wahl = s.ereignis?.wahl ? 0 : null;
  plan = M.standardPlan(s);
  zeichnePlanung();
  speichern();
  kennzahlen();
}

function freieTage() { return M.tage(s, wahl) - plan.offen - plan.projektTage; }

/** Nach jeder Aenderung: Rest geht in die Pflege, dann neu zeichnen. */
function planAngleichen() {
  const t = M.tage(s, wahl);
  plan.offen = Math.max(0, Math.min(plan.offen, s.zimmer, t));
  if (plan.projekt) {
    const p = M.projekt(plan.projekt);
    const rest = s.laufend?.id === p.id ? s.laufend.rest : p.tage;
    plan.projektTage = Math.max(0, Math.min(plan.projektTage, rest, t - plan.offen));
  } else plan.projektTage = 0;
  plan.pflegeTage = t - plan.offen - plan.projektTage;
  zeichnePlanung();
}

function zeichnePlanung() {
  const e = s.ereignis;
  const t = M.tage(s, wahl);
  const v = M.vorschau(s, plan, wahl);
  const occ = M.auslastung(s);
  const proZimmer = Math.round(7 * occ);

  const ereignis = e ? `
    <div class="ereignis">
      <p class="ey">${e.titel}</p>
      <p>${e.text}</p>
      ${e.wahl ? `<div class="wahl" role="radiogroup">${e.wahl.map((w, i) => `
        <label class="wahlpunkt"><input type="radio" name="wahl" value="${i}" ${wahl === i ? "checked" : ""}>
          <span><b>${w.label}</b> · ${w.text}</span></label>`).join("")}</div>` : ""}
    </div>` : "";

  const projekte = PROJEKTE.filter((p) => !M.istFertig(s, p.id))
    .map((p) => ({ p, st: M.projektStatus(s, p) }))
    .sort((a, b) => (b.st.laufend ? 2 : b.st.moeglich ? 1 : 0) - (a.st.laufend ? 2 : a.st.moeglich ? 1 : 0));
  const fertige = PROJEKTE.filter((p) => M.istFertig(s, p.id));

  $("panel").innerHTML = `
    <div class="karte">
      <div class="wochenkopf">
        <h2>Woche ${s.woche + 1} <span>von ${M.ANZAHL_WOCHEN}</span></h2>
        <p class="datum">${WOCHEN[s.woche]}</p>
      </div>
      ${ereignis}

      <div class="tage" aria-label="Tage dieser Woche">
        ${Array.from({ length: t }, (_, i) => `<i data-art="${i < plan.offen ? "gaeste" : i < plan.offen + plan.projektTage ? "projekt" : "pflege"}"></i>`).join("")}
        <span>${t} Tage${s.hilfe ? " (2 durch Signora Pia)" : ""}</span>
      </div>
      <p class="legende"><i data-art="gaeste"></i>Gäste <i data-art="projekt"></i>Renovieren <i data-art="pflege"></i>Pflege</p>

      <div class="posten">
        <div class="postenkopf"><b>Zimmer öffnen</b><span>je 1 Tag</span></div>
        <div class="stepper">
          <button data-schritt="offen" data-d="-1" aria-label="Ein Zimmer weniger" ${plan.offen <= 0 ? "disabled" : ""}>−</button>
          <output>${plan.offen} von ${s.zimmer}</output>
          <button data-schritt="offen" data-d="1" aria-label="Ein Zimmer mehr" ${plan.offen >= s.zimmer || freieTage() <= 0 && plan.pflegeTage <= 0 ? "disabled" : ""}>+</button>
        </div>
        <p class="klein">Erwartet je Zimmer: ${proZimmer} ${proZimmer === 1 ? "Nacht" : "Nächte"} à ${euro(M.preis(s))}${e?.extraNaechte ? ` · Gruppe ab ${e.abZimmern} offenen Zimmern: +${e.extraNaechte} Nächte` : ""}</p>
      </div>

      <div class="posten">
        <div class="postenkopf"><b>Renovieren</b><span>Geld beim Start, Tage nach und nach</span></div>
        ${plan.projekt ? `
          <div class="stepper">
            <button data-schritt="projektTage" data-d="-1" aria-label="Ein Tag weniger" ${plan.projektTage <= 0 ? "disabled" : ""}>−</button>
            <output>${plan.projektTage} ${plan.projektTage === 1 ? "Tag" : "Tage"} an „${M.projekt(plan.projekt).name}“</output>
            <button data-schritt="projektTage" data-d="1" aria-label="Ein Tag mehr" ${plan.pflegeTage <= 0 ? "disabled" : ""}>+</button>
          </div>` : ""}
        <ul class="projekte">${projekte.filter((x) => x.st.moeglich).map(({ p, st }) => projektZeile(p, st)).join("")}</ul>
        ${projekte.some((x) => !x.st.moeglich) ? `<details class="spaeter"><summary>Später (${projekte.filter((x) => !x.st.moeglich).length})</summary>
          <ul class="projekte">${projekte.filter((x) => !x.st.moeglich).map(({ p, st }) => projektZeile(p, st)).join("")}</ul></details>` : ""}
        ${fertige.length ? `<p class="klein fertig">Fertig: ${fertige.map((p) => p.name).join(" · ")}</p>` : ""}
      </div>

      <div class="posten">
        <div class="postenkopf"><b>Hilfe</b><span>${HILFE.name}</span></div>
        ${s.hilfe ? `<p class="klein">${HILFE.name} kommt jede Woche: +${REGELN.hilfeTage} Tage, ${euro(REGELN.hilfeKosten)} pro Woche.</p>`
        : M.hilfeMoeglich(s) ? `<button class="projekt" id="hilfe" aria-pressed="${!!plan.hilfe}">
            <span class="name">${HILFE.name} einstellen</span><span class="kosten">${euro(REGELN.hilfeKosten)} pro Woche</span>
            <span class="wirkung">+${REGELN.hilfeTage} Tage pro Woche, ab nächster Woche</span>
            <span class="text">${HILFE.text} Läuft bis zum Saisonende.</span></button>`
        : `<p class="klein">${HILFE.name} aus dem Dorf würde kommen, sobald das Dach gedeckt ist: +${REGELN.hilfeTage} Tage pro Woche für ${euro(REGELN.hilfeKosten)}.</p>`}
      </div>

      <div class="posten">
        <div class="postenkopf"><b>Pflege</b><span>der Rest der Tage</span></div>
        <p class="klein">${plan.pflegeTage} ${plan.pflegeTage === 1 ? "Tag" : "Tage"}: Garten, Putzen, Kleinkram. +${REGELN.pflegeProTag} Pflege je Tag, die Woche selbst kostet ${REGELN.pflegeVerfall}.</p>
        ${pflegeSinnvoll(v) < plan.pflegeTage ? `<p class="klein hinweis">Die Villa ist gepflegt: Mehr als ${pflegeSinnvoll(v)} ${pflegeSinnvoll(v) === 1 ? "Tag" : "Tage"} Pflege bringen diese Woche nichts. Die übrigen Tage verfallen.</p>` : ""}
      </div>

      <div class="vorschau" aria-live="polite">
        <p class="ey">Erwartet für diese Woche</p>
        <dl>
          <dt>Nächte</dt><dd>${v.naechte}</dd>
          <dt>Einnahmen</dt><dd>${mitVorzeichen(v.einnahmen)}</dd>
          <dt>Laufende Kosten</dt><dd>${mitVorzeichen(-v.laufend)}</dd>
          ${v.kostenProjekt ? `<dt>Projektstart</dt><dd>${mitVorzeichen(-v.kostenProjekt)}</dd>` : ""}
          ${v.sonstiges ? `<dt>${e?.titel || "Sonstiges"}</dt><dd>${mitVorzeichen(v.sonstiges)}</dd>` : ""}
          <dt class="summe">Geld danach</dt><dd class="summe ${v.geldNachher < 0 ? "minus" : ""}">${euro(v.geldNachher)}</dd>
          <dt>Charme danach</dt><dd>${v.charmeNachher}${v.projektFertig ? " · Projekt fertig" : ""}</dd>
        </dl>
        ${v.geldNachher < REGELN.dispo ? `<p class="warnung">So reicht das Geld nicht: Unter ${euro(REGELN.dispo)} muss verkauft werden.</p>` : ""}
      </div>

      <div class="fuss">
        <dl class="kurz">
          <div><dt>Saldo</dt><dd class="${v.saldo < 0 ? "minus" : ""}">${mitVorzeichen(v.saldo)}</dd></div>
          <div><dt>Geld danach</dt><dd class="${v.geldNachher < 0 ? "minus" : ""}">${euro(v.geldNachher)}</dd></div>
          <div><dt>Charme</dt><dd>${M.charme(s)} → ${v.charmeNachher}</dd></div>
        </dl>
        <button class="knopf gross" id="los">Woche beginnen</button>
      </div>
    </div>`;

  // Nur beim Wochenwechsel einblenden, nicht bei jedem Klick auf + oder -
  const kartenSchluessel = "planen" + s.woche;
  if (kartenSchluessel === zuletztEingeblendet) $("panel").querySelector(".karte").classList.add("bleibt");
  zuletztEingeblendet = kartenSchluessel;

  // Die Gruppe "Spaeter" bleibt offen, wenn man sie einmal geoeffnet hat
  const spaeter = $("panel").querySelector(".spaeter");
  if (spaeter) { spaeter.open = spaeterOffen; spaeter.ontoggle = () => (spaeterOffen = spaeter.open); }

  $("panel").querySelectorAll("[data-schritt]").forEach((b) => b.onclick = () => {
    const feld = b.dataset.schritt, d = Number(b.dataset.d);
    if (feld === "offen") plan.offen += d;
    else plan.projektTage += d;
    Ton.klick();
    planAngleichen();
  });
  $("panel").querySelectorAll("[data-projekt]").forEach((b) => b.onclick = () => {
    const id = b.dataset.projekt;
    if (plan.projekt === id && !s.laufend) { plan.projekt = null; plan.projektTage = 0; }
    else { plan.projekt = id; plan.projektTage = 99; }
    Ton.klick();
    planAngleichen();
  });
  const hilfe = $("hilfe");
  if (hilfe) hilfe.onclick = () => { plan.hilfe = !plan.hilfe; Ton.klick(); planAngleichen(); };
  $("panel").querySelectorAll('input[name="wahl"]').forEach((r) => r.onchange = () => { wahl = Number(r.value); Ton.klick(); planAngleichen(); });
  $("los").onclick = wocheLaufen;
}

/** Wie viele Pflegetage diese Woche noch etwas bringen, bis die Pflege voll ist. */
function pflegeSinnvoll(v) {
  const fehlt = REGELN.pflegeMax - s.pflege + REGELN.pflegeVerfall + v.naechte / REGELN.abnutzungJeNaechte;
  return Math.max(0, Math.ceil(fehlt / REGELN.pflegeProTag));
}

function projektZeile(p, st) {
  const gewaehlt = plan.projekt === p.id;
  const kosten = M.projektKosten(s, p);
  const rabatt = kosten < p.geld;
  const rest = st.laufend ? s.laufend.rest : p.tage;
  const wirkung = [
    p.charme ? `+${p.charme} Charme` : "",
    p.zimmer ? "+1 Zimmer" : "",
    p.fruehstueck ? `+${REGELN.preisFruehstueck} € je Nacht` : ""
  ].filter(Boolean).join(" · ");
  const preisText = st.laufend ? "bezahlt" :
    rabatt ? `<s>${euro(p.geld)}</s> ${euro(kosten)}` : euro(kosten);
  return `<li>
    <button class="projekt" data-projekt="${p.id}" ${st.moeglich ? "" : "disabled"} aria-pressed="${gewaehlt}">
      <span class="name">${p.name}${st.laufend ? ` <em>läuft · noch ${rest} ${rest === 1 ? "Tag" : "Tage"}</em>` : ""}</span>
      <span class="kosten">${preisText} · ${p.tage ? `${p.tage} ${p.tage === 1 ? "Tag" : "Tage"}` : "sofort"}</span>
      <span class="wirkung">${wirkung}</span>
      <span class="text">${st.moeglich ? p.text : st.grund}</span>
    </button></li>`;
}

// --- Woche laufen lassen ------------------------------------------------------

function wocheLaufen() {
  const fehler = M.planFehler(s, plan, wahl);
  if (fehler) return;
  const zimmerVorher = ["zimmer1", ...["zimmer2", "zimmer3", "turm"].filter((id) => M.istFertig(s, id))];
  const bericht = M.wocheAusfuehren(s, plan, wahl);
  letzterBericht = bericht;
  // Abends: Licht in so vielen Zimmern, wie belegt waren
  const belegt = bericht.naechte > 0 ? plan.offen : 0;
  s.lichter = zimmerVorher.slice(0, belegt);
  ansichtZustand.abendZiel = 1;
  ansichtZustand.gaeste = Math.min(8, Math.round(bericht.naechte / 3));
  Ton.stimmung(s.woche, true);
  Ton.wocheVorbei(bericht);
  phase = "bericht";
  zeigeBericht(bericht);
  speichern();
  kennzahlen();
}

function zeigeBericht(b) {
  const p = b.fertig ? M.projekt(b.fertig) : null;
  const saldo = b.geld - b.geldVorher;
  $("panel").innerHTML = `
    <div class="karte bericht">
      <div class="wochenkopf"><h2>Woche ${b.woche + 1} <span>vorbei</span></h2><p class="datum">${WOCHEN[b.woche]}</p></div>
      ${p ? `<div class="fertigmeldung"><p class="ey">Fertig</p><p><b>${p.name}.</b> ${fertigText(p)}</p></div>` : ""}
      ${b.hilfe ? `<div class="fertigmeldung"><p class="ey">Ab nächster Woche</p><p><b>${HILFE.name}</b> kommt jede Woche. Zwei Tage mehr.</p></div>` : ""}
      <dl>
        <dt>Gäste</dt><dd>${b.naechte} ${b.naechte === 1 ? "Nacht" : "Nächte"}</dd>
        <dt>Einnahmen</dt><dd>${mitVorzeichen(b.einnahmen)}</dd>
        <dt>Laufende Kosten</dt><dd>${mitVorzeichen(-b.laufend)}</dd>
        ${b.kostenProjekt ? `<dt>Projektstart</dt><dd>${mitVorzeichen(-b.kostenProjekt)}</dd>` : ""}
        ${b.sonstiges ? `<dt>Sonstiges</dt><dd>${mitVorzeichen(b.sonstiges)}</dd>` : ""}
        <dt class="summe">Saldo der Woche</dt><dd class="summe ${saldo < 0 ? "minus" : ""}">${mitVorzeichen(saldo)}</dd>
        <dt>Charme</dt><dd>${b.charmeVorher} → ${b.charme}</dd>
      </dl>
      <p class="kommentar">${kommentar(b)}</p>
      <button class="knopf gross" id="weiter">${s.ende ? "Zur Saisonbilanz" : `Weiter zu Woche ${s.woche + 1}`}</button>
    </div>`;
  $("weiter").onclick = () => { Ton.klick(); if (s.ende) bilanz(); else neueWoche(); };
}

function fertigText(p) {
  return {
    laternen: "Abends sieht man jetzt, wo der Weg ist.",
    garten: "Die Zitronenbäume sind klein, aber sie stehen.",
    laeden: "Die persiane sind grün und schließen wieder.",
    dach: "Das Gerüst ist weg. Oben kann man wieder schlafen, sobald jemand die Zimmer herrichtet.",
    zimmer2: "Ab nächster Woche ein Zimmer mehr, mit Blick aufs Meer.",
    zimmer3: "Ab nächster Woche ein Zimmer mehr, über dem Garten.",
    fassade: "Die Villa ist von unten im Dorf zu sehen. Man redet darüber.",
    terrasse: "Unter der Pergola wird abends gegessen.",
    kueche: "Morgens riecht es nach Kaffee. Die Nächte bringen mehr.",
    turm: "Das Turmzimmer ist das erste, das gebucht wird."
  }[p.id] || "";
}

function kommentar(b) {
  if (s.pleite) return "Die Bank ruft an.";
  if (b.naechte === 0 && b.plan.offen > 0) return "Niemand kam. Die Villa ist noch nicht so weit, wie man es ihr wünscht.";
  if (b.naechte === 0) return "Keine Gäste diese Woche. Dafür Ruhe zum Arbeiten.";
  if (b.naechte >= 14) return "Ein volles Haus. Die Wäscheleine reicht kaum.";
  if (b.einnahmen > 0 && b.geld > b.geldVorher) return "Die Woche hat mehr gebracht, als sie gekostet hat.";
  return "Die Gäste waren zufrieden. Die Rechnung noch nicht ganz.";
}

// --- Saisonbilanz --------------------------------------------------------------

function bilanz() {
  phase = "bilanz";
  const b = M.bilanz(s);
  s.lichter = s.pleite ? [] : ["zimmer1", "zimmer2", "zimmer3", "turm"].filter((id) => id === "zimmer1" || M.istFertig(s, id));
  ansichtZustand.abendZiel = 1;
  ansichtZustand.gaeste = s.pleite ? 0 : Math.min(8, 2 + b.index * 2);
  Ton.bilanz(b.index);
  $("panel").innerHTML = `
    <div class="karte bilanz" data-ausgang="${b.index}">
      <p class="ey">Saisonbilanz · Ferragosto</p>
      <h2>${b.titel}</h2>
      <p>${b.text}</p>
      <ol class="stufen" aria-label="Mögliche Ausgänge">${[0, 1, 2, 3, 4].map((i) => `<li data-an="${i === b.index ? 1 : 0}"></li>`).join("")}</ol>
      <dl>
        <dt>Geld</dt><dd class="${b.geld < 0 ? "minus" : ""}">${euro(b.geld)}</dd>
        <dt>Charme</dt><dd>${b.charme}</dd>
        <dt>Gästenächte</dt><dd>${b.gaeste}</dd>
        <dt>Zimmer</dt><dd>${b.zimmer}</dd>
        <dt>Projekte fertig</dt><dd>${b.fertig} von ${PROJEKTE.length}</dd>
      </dl>
      <button class="knopf gross" id="nochmal">Neue Saison</button>
    </div>`;
  $("nochmal").onclick = () => { vergessen(); s = M.neuesSpiel(); ansichtZustand.s = s; Ton.klick(); neueWoche(); kennzahlen(); };
  vergessen();
  kennzahlen();
}

// --- Kopfzeile mit Kennzahlen ----------------------------------------------------

let tonAn = true;
export function tonSchalter() {
  const b = $("tonknopf");
  b.onclick = () => {
    tonAn = !tonAn; Ton.start(); Ton.an(tonAn);
    b.textContent = tonAn ? "Ton aus" : "Ton an"; b.setAttribute("aria-pressed", String(!tonAn));
  };
}

function kennzahlen() {
  $("kennzahlen").innerHTML = `
    <div><dt>Geld</dt><dd class="${s.geld < 0 ? "minus" : ""}">${euro(s.geld)}</dd></div>
    <div><dt>Charme</dt><dd>${M.charme(s)}</dd></div>
    <div><dt>Zimmer</dt><dd>${s.zimmer}</dd></div>
    <div><dt>Woche</dt><dd>${Math.min(s.woche + (phase === "bericht" || phase === "bilanz" ? 0 : 1), M.ANZAHL_WOCHEN)} / ${M.ANZAHL_WOCHEN}</dd></div>`;
}

function dunkel() {
  const t = document.documentElement.dataset.theme;
  return t ? t === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
}

export const aktuellePhase = () => phase;
export const spiel = () => s;
