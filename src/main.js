// Einstieg. Wird mit den folgenden Schritten zum Spiel ausgebaut.
// Mit ?galerie zeigt die Seite die Villa in allen Ausbaustufen - zum
// Pruefen der Zeichnung, nicht fuer Spieler.

import * as M from "./modell.js";
import { villaZeichnen } from "./villa.js";

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
  const stufen = [
    ["Start", zustand([], { pflege: 2 })],
    ["Garten in Arbeit", zustand(["laternen"], { laufend: { id: "garten", rest: 1 }, pflege: 6 })],
    ["Laternen, Garten, Läden", zustand(["laternen", "garten", "laeden"], { pflege: 8, woche: 3 })],
    ["Dach gedeckt", zustand(["laternen", "garten", "laeden", "dach"], { pflege: 9, woche: 6 })],
    ["Zimmer 2 und 3", zustand(["laternen", "garten", "laeden", "dach", "zimmer2", "zimmer3"], { pflege: 10, woche: 8 })],
    ["Fassade, Terrasse", zustand(["laternen", "garten", "laeden", "dach", "zimmer2", "zimmer3", "fassade", "terrasse"], { pflege: 12, woche: 10 })],
    ["Alles fertig", zustand(["laternen", "garten", "laeden", "dach", "zimmer2", "zimmer3", "fassade", "terrasse", "kueche", "turm", "hilfe"], { pflege: 15, woche: 14 })],
    ["Abend mit Gästen", zustand(["laternen", "garten", "laeden", "dach", "zimmer2", "zimmer3", "fassade", "terrasse", "kueche", "turm", "hilfe"], { pflege: 15, woche: 14, lichter: ["zimmer1", "zimmer2", "turm"] }), true, 6]
  ];
  // verlauf fuer das Alter des Gartens
  for (const [, s] of stufen) if (s.fertig.includes("garten")) s.verlauf = [{ woche: 1, fertig: "garten" }];
  const app = document.getElementById("app");
  app.innerHTML = `<h1>Villa – Galerie</h1><div class="galerie"></div>`;
  const box = app.querySelector(".galerie");
  for (const [titel, s, abend, gaeste] of stufen) {
    const fig = document.createElement("figure");
    fig.innerHTML = `<canvas width="800" height="500"></canvas><figcaption>${titel}</figcaption>`;
    box.appendChild(fig);
    villaZeichnen(fig.querySelector("canvas").getContext("2d"), 800, 500, s, { abend, t: 1, gaeste: gaeste || 0 });
  }
}

if (new URLSearchParams(location.search).has("galerie")) galerie();
document.documentElement.dataset.bereit = "1";
