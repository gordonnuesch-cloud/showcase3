// Einstieg: Zeichenschleife fuer die Villa, Start der Oberflaeche.
// Mit ?galerie zeigt die Seite die Villa in allen Ausbaustufen - zum
// Pruefen der Zeichnung, nicht fuer Spieler.

import * as M from "./modell.js";
import { villaZeichnen } from "./villa.js";
import * as UI from "./ui.js";

const $ = (id) => document.getElementById(id);

// --- Spiel -------------------------------------------------------------------

function spielen() {
  const cv = $("villa"), g = cv.getContext("2d");
  const groesse = () => {
    const r = cv.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
  };
  groesse();
  addEventListener("resize", groesse);
  const ruhig = matchMedia("(prefers-reduced-motion: reduce)");

  UI.starten();
  let zuletzt = 0;
  const schleife = (ts) => {
    const dt = Math.min(0.1, (ts - zuletzt) / 1000 || 0); zuletzt = ts;
    const a = UI.ansicht();
    // Tag und Abend gehen weich ineinander ueber (ohne Bewegung: sofort)
    a.abend += ruhig.matches ? a.abendZiel - a.abend : (a.abendZiel - a.abend) * Math.min(1, dt * 2.2);
    const t = ruhig.matches ? 0 : ts / 1000;
    villaZeichnen(g, cv.width, cv.height, a.s, { abend: false, t, gaeste: a.abend > 0.5 ? a.gaeste : 0 });
    if (a.abend > 0.01) villaZeichnen(g, cv.width, cv.height, a.s, { abend: true, t, gaeste: a.gaeste, deckkraft: a.abend });
    requestAnimationFrame(schleife);
  };
  requestAnimationFrame(schleife);

  if (new URLSearchParams(location.search).has("rauchtest")) {
    window.__rauchtest = { spiel: UI.spiel, phase: UI.aktuellePhase, M };
  }
}

// --- Galerie -------------------------------------------------------------------

function zustand(fertig, extra = {}) {
  const s = M.neuesSpiel(1);
  s.fertig = [...fertig];
  for (const id of fertig) {
    const p = M.projekt(id);
    s.projektCharme += p.charme; s.zimmer += p.zimmer || 0;
    if (p.hilfe) s.hilfe = true;
    if (p.fruehstueck) s.fruehstueck = true;
  }
  return Object.assign(s, extra);
}

function galerie() {
  const alle = ["laternen", "garten", "laeden", "dach", "zimmer2", "zimmer3", "fassade", "terrasse", "kueche", "turm", "hilfe"];
  const stufen = [
    ["Start", zustand([], { pflege: 2 })],
    ["Garten in Arbeit", zustand(["laternen"], { laufend: { id: "garten", rest: 1 }, pflege: 6 })],
    ["Laternen, Garten, Läden", zustand(alle.slice(0, 3), { pflege: 8, woche: 3 })],
    ["Dach gedeckt", zustand(alle.slice(0, 4), { pflege: 9, woche: 6 })],
    ["Zimmer 2 und 3", zustand(alle.slice(0, 6), { pflege: 10, woche: 8 })],
    ["Fassade, Terrasse", zustand(alle.slice(0, 8), { pflege: 12, woche: 10 })],
    ["Alles fertig", zustand(alle, { pflege: 15, woche: 14 })],
    ["Abend mit Gästen", zustand(alle, { pflege: 15, woche: 14, lichter: ["zimmer1", "zimmer2", "turm"] }), true, 6]
  ];
  for (const [, s] of stufen) if (s.fertig.includes("garten")) s.verlauf = [{ woche: 1, fertig: "garten" }];
  document.body.innerHTML = `<main class="wrap"><h1>Villa – Galerie</h1><div class="galerie"></div></main>`;
  const box = document.querySelector(".galerie");
  for (const [titel, s, abend, gaeste] of stufen) {
    const fig = document.createElement("figure");
    fig.innerHTML = `<canvas width="800" height="500"></canvas><figcaption>${titel}</figcaption>`;
    box.appendChild(fig);
    villaZeichnen(fig.querySelector("canvas").getContext("2d"), 800, 500, s, { abend, t: 1, gaeste: gaeste || 0 });
  }
}

if (new URLSearchParams(location.search).has("galerie")) galerie();
else spielen();
document.documentElement.dataset.bereit = "1";
