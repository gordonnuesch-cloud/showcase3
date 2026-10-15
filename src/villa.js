// Die Villa dei Limoni in Canvas. Der Zustand kommt ausschliesslich aus dem
// Spielstand (modell.js) - jedes fertige Projekt veraendert ein sichtbares
// Stueck: Dach, Laeden, Fassade, Zimmer, Garten, Terrasse, Laternen, Turm.
// Das ist die Belohnung des Genres; die Zahlen sind nur die Begleitung.
//
// Gezeichnet wird in einem gedachten Raum von 800 x 500. Die Szene wird je
// Zustand einmal gebacken; pro Bild kommen nur Meerglitzern, Rauch, Laternen
// und Figuren dazu.

const W = 800, H = 500, ZOOM = 1.25;

// Sommerillustration: Kornblumenhimmel, satte Flaechen, keine Konturen,
// keine harten Schatten. Zypressen, Zitronen, Sternblueten, weisse Wellen.
const P = {
  himmelOben: "#86a6de", himmelUnten: "#dfe8f6", abendOben: "#2c3a6e", abendUnten: "#f0a77a",
  meer: "#5b8fd8", meerAbend: "#33508a", fern: "#a9c48a", fernAbend: "#5d6a8a",
  huegel: "#a5c46a", huegelDunkel: "#8fb257", erde: "#e2c38f", mauer: "#f1e3c6", mauerFuge: "#d9c49e",
  olive: "#6f9a45", oliveHell: "#8fb85a", stamm: "#7a5a40", zypresse: "#2f6b3e", zypresseHell: "#3f8a4e",
  putzAlt: "#e3d6c2", putzFleck: "#cbbba3", ocker: "#f2b56b", ockerSchatten: "#e29e55", rahmen: "#fff4e0",
  ziegel: "#e2733f", ziegelDunkel: "#c45c2e", plane: "#6f9bd8", geruest: "#b08a5a",
  laden: "#4f9a62", ladenHell: "#6cb57c", ladenAlt: "#b3a68f", glas: "#a9c7ee", glasAbend: "#2a3560", licht: "#ffd76a",
  holz: "#9a6a42", stein: "#f1e6d2", zitrone: "#f7d43a", blatt: "#4e8c3c", blattHell: "#72ae4e",
  unkraut: "#9aa54e", bluete: ["#f4a9a8", "#fff3e2", "#f7d43a", "#f8c9c3"], wein: "#5f9a3c",
  schatten: "rgba(40,50,90,.12)", figur: ["#3f6fbf", "#e2733f", "#f7d43a", "#4e8c3c", "#d97a9a", "#2f4a8a"]
};

const fertig = (s, id) => s.fertig.includes(id);
const laeuft = (s, id) => s.laufend?.id === id;

const cache = new Map();   // Tag und Abend liegen gleichzeitig bereit

/** Schluessel aller Zustaende, die das gebackene Bild veraendern. */
function schluessel(s, abend) {
  const garten = fertig(s, "garten") ? Math.min(6, s.woche - gartenWoche(s)) : -1;
  return [s.fertig.join(","), s.laufend?.id || "", Math.round(s.pflege / 3), garten, abend ? 1 : 0].join("|");
}
function gartenWoche(s) {
  const i = s.verlauf.findIndex((b) => b.fertig === "garten");
  return i < 0 ? s.woche : s.verlauf[i].woche;
}

function zufall(saat) {
  let a = saat | 0;
  return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const kreis = (g, x, y, r) => { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); };
const kreise = (g, liste) => { g.beginPath(); for (const [x, y, r] of liste) { g.moveTo(x + r, y); g.arc(x, y, r, 0, Math.PI * 2); } g.fill(); };

// --- Gebackene Szene -----------------------------------------------------------

function backen(s, abend) {
  const c = document.createElement("canvas");
  c.width = W * 2; c.height = H * 2;
  const g = c.getContext("2d");
  g.scale(2, 2);
  const r = zufall(42);

  himmel(g, abend, r);
  landschaft(g, abend, r);
  turm(g, s, abend);
  haus(g, s, abend);
  garten(g, s, r);
  terrasse(g, s);
  weg(g, s);
  pflege(g, s, r);
  if (abend) {
    // Abendlicht: kuehler Schleier ueber allem, was nicht leuchtet
    g.fillStyle = "rgba(40,30,80,.14)"; g.fillRect(0, 190, W, H);
  }
  return c;
}

function himmel(g, abend, r) {
  const v = g.createLinearGradient(0, 0, 0, 200);
  v.addColorStop(0, abend ? P.abendOben : P.himmelOben);
  v.addColorStop(1, abend ? P.abendUnten : P.himmelUnten);
  g.fillStyle = v; g.fillRect(0, 0, W, 200);
  if (abend) for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(255,248,225,${0.3 + r() * 0.5})`; kreis(g, r() * W, r() * 110, 0.5 + r()); }
  // Sonne bzw. Abendsonne ueber dem Meer
  g.fillStyle = abend ? "rgba(255,180,110,.5)" : "rgba(255,248,220,.6)";
  kreis(g, 660, abend ? 182 : 128, abend ? 30 : 24);
  g.fillStyle = abend ? "#f7a85c" : "#fff6dc";
  kreis(g, 660, abend ? 182 : 128, abend ? 18 : 15);
  // Meer bis zum Horizont, ferne Landzunge mit Zypressen
  g.fillStyle = abend ? P.meerAbend : P.meer; g.fillRect(0, 186, W, 40);
  g.strokeStyle = abend ? "rgba(255,255,255,.35)" : "rgba(255,255,255,.85)"; g.lineWidth = 1.6; g.lineCap = "round";
  for (const [wx, wy] of [[40, 200], [130, 212], [300, 198], [470, 208], [560, 196], [700, 210], [760, 199]]) welle(g, wx, wy, 26);
  g.fillStyle = abend ? P.fernAbend : P.fern;
  g.beginPath(); g.moveTo(0, 190); g.bezierCurveTo(90, 160, 170, 168, 240, 190); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(560, 190); g.bezierCurveTo(660, 172, 740, 158, 800, 168); g.lineTo(800, 190); g.closePath(); g.fill();
  g.fillStyle = abend ? "#3c4a4a" : P.zypresse;
  for (const x of [70, 82, 140, 690, 705, 760]) { g.beginPath(); g.ellipse(x, 172, 3, 11, 0, 0, 7); g.fill(); }
}

/** Eine weisse Wellenlinie, wie mit dem Pinsel gezogen. */
function welle(g, x, y, b) {
  g.beginPath(); g.moveTo(x, y);
  g.bezierCurveTo(x + b * 0.25, y - 4, x + b * 0.5, y - 4, x + b * 0.5, y);
  g.bezierCurveTo(x + b * 0.5, y + 3, x + b * 0.75, y - 4, x + b, y - 1);
  g.stroke();
}

function zypresse(g, x, yBoden, h) {
  const b = h * 0.13;
  g.fillStyle = P.zypresse;
  g.beginPath(); g.moveTo(x, yBoden - h);
  g.bezierCurveTo(x + b * 1.3, yBoden - h * 0.7, x + b, yBoden - h * 0.15, x + b * 0.5, yBoden);
  g.lineTo(x - b * 0.5, yBoden);
  g.bezierCurveTo(x - b, yBoden - h * 0.15, x - b * 1.3, yBoden - h * 0.7, x, yBoden - h);
  g.fill();
  g.fillStyle = P.zypresseHell;
  g.beginPath(); g.moveTo(x - 1, yBoden - h * 0.92);
  g.bezierCurveTo(x - b * 0.7, yBoden - h * 0.6, x - b * 0.6, yBoden - h * 0.2, x - b * 0.25, yBoden - 4);
  g.lineTo(x - 1, yBoden - 6); g.closePath(); g.fill();
}

/** Fuenfblaettrige Sternbluete mit gelber Mitte. */
function sternbluete(g, x, y, r, farbe) {
  g.fillStyle = farbe;
  for (let i = 0; i < 5; i++) {
    const a = i * Math.PI * 2 / 5 - Math.PI / 2;
    g.beginPath(); g.ellipse(x + Math.cos(a) * r * 0.7, y + Math.sin(a) * r * 0.7, r * 0.55, r * 0.3, a, 0, 7); g.fill();
  }
  g.fillStyle = "#f2b33a"; kreis(g, x, y, r * 0.28);
}

function landschaft(g, abend, r) {
  // Huegel mit Terrassen und Trockenmauern
  g.fillStyle = P.huegel;
  g.beginPath(); g.moveTo(0, 230); g.bezierCurveTo(200, 205, 600, 205, 800, 222); g.lineTo(800, H); g.lineTo(0, H); g.closePath(); g.fill();
  for (const [y, x0, x1] of [[262, 0, 230], [300, 0, 210], [338, 0, 190], [270, 620, 800], [440, 0, 120]]) {
    g.fillStyle = P.mauer; g.fillRect(x0, y, x1 - x0, 7);
    g.fillStyle = P.mauerFuge;
    for (let x = x0 + 6; x < x1; x += 14) g.fillRect(x, y + 3, 6, 1.2);
  }
  // Zypressen rahmen die Villa, wie auf jeder Postkarte von der Riviera
  for (const [x, y, h] of [[214, 404, 150], [234, 404, 120], [604, 330, 130], [628, 330, 104], [770, 300, 90]]) zypresse(g, x, y, h);
  // Sternblueten im Gras
  for (let i = 0; i < 26; i++) {
    const x = r() * W, y = 330 + r() * 170;
    if (x > 250 && x < 600 && y < 410) continue;
    sternbluete(g, x, y, 3.2 + r() * 2.2, P.bluete[i % 2 === 0 ? 0 : 1]);
  }
  // Olivenbaeume auf den Terrassen
  for (const [x, y, k] of [[40, 258, 1], [110, 256, 0.9], [175, 260, 0.8], [60, 296, 1.1], [150, 298, 0.9], [30, 334, 1], [120, 336, 1.2], [660, 266, 0.9], [740, 264, 1]]) olive(g, x, y, k, r);
}

function olive(g, x, y, k, r) {
  g.fillStyle = P.schatten; g.beginPath(); g.ellipse(x + 6 * k, y + 2, 16 * k, 4 * k, 0, 0, 7); g.fill();
  g.fillStyle = P.stamm; g.fillRect(x - 1.5 * k, y - 12 * k, 3 * k, 12 * k);
  g.fillStyle = P.olive; kreise(g, [[x, y - 18 * k, 11 * k], [x - 9 * k, y - 13 * k, 8 * k], [x + 9 * k, y - 14 * k, 8 * k]]);
  g.fillStyle = P.oliveHell; kreise(g, [[x - 3 * k, y - 21 * k, 6 * k]]);
  void r;
}

// --- Das Haus ------------------------------------------------------------------

const HAUS = { x: 270, y: 236, w: 250, h: 164 };   // Fassade ohne Dach; Erdgeschoss ab y 318
const FENSTER = {
  // id des Zimmers (null = Flur/Kueche), Position oben links, oberes Stockwerk?
  eg: [{ id: "kueche", x: 292, y: 336 }, { id: "zimmer1", x: 448, y: 336 }],
  og: [{ id: "zimmer2", x: 292, y: 256 }, { id: null, x: 370, y: 256 }, { id: "zimmer3", x: 448, y: 256 }]
};

function haus(g, s, abend) {
  const { x, y, w, h } = HAUS;
  const fassade = fertig(s, "fassade");
  // Nur ein weicher Schatten am Boden - flache Illustration, kein Schlagschatten
  g.fillStyle = P.schatten; g.beginPath(); g.ellipse(x + w / 2, y + h + 2, w * 0.62, 9, 0, 0, 7); g.fill();
  // Wand
  g.fillStyle = fassade ? P.ocker : P.putzAlt; g.fillRect(x, y, w, h);
  if (fassade) {
    g.fillStyle = P.ockerSchatten; g.fillRect(x + w - 12, y, 12, h);
    // Aufgemalte Gesimse und Ecklisenen, wie an der Riviera ueblich
    g.fillStyle = P.rahmen;
    g.fillRect(x, y + 74, w, 6); g.fillRect(x, y, 10, h); g.fillRect(x + w - 10, y, 10, h);
    g.fillRect(x, y + h - 10, w, 10);
  } else {
    // Abblaetternder Putz: Flecken und Risse
    const r = zufall(7);
    g.fillStyle = P.putzFleck;
    for (let i = 0; i < 22; i++) { g.beginPath(); g.ellipse(x + r() * w, y + r() * h, 6 + r() * 14, 3 + r() * 6, r() * 3, 0, 7); g.fill(); }
    g.strokeStyle = "rgba(90,70,50,.35)"; g.lineWidth = 1;
    for (const [sx, sy] of [[300, 300], [470, 250], [400, 380]]) { g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + 6, sy + 10); g.lineTo(sx + 2, sy + 18); g.stroke(); }
  }
  // Dach
  dach(g, s);
  // Fenster und Tuer
  for (const f of FENSTER.og) fenster(g, s, f, abend, true);
  for (const f of FENSTER.eg) fenster(g, s, f, abend, false);
  tuer(g, s, abend);
  // Schornstein, mit Rauch, wenn die Kueche laeuft (Rauch zeichnet die Laufzeit)
  g.fillStyle = fassade ? P.ockerSchatten : P.putzFleck; g.fillRect(470, 190, 16, 26);
  g.fillStyle = P.ziegelDunkel; g.fillRect(467, 186, 22, 5);
  if (laeuft(s, "fassade")) geruest(g, x - 6, y + 70, w + 12, 90);
}

function dach(g, s) {
  const { x, y, w } = HAUS;
  const ok = fertig(s, "dach");
  g.fillStyle = P.ziegel;
  g.beginPath(); g.moveTo(x - 16, y + 2); g.lineTo(x + 40, y - 34); g.lineTo(x + w - 40, y - 34); g.lineTo(x + w + 16, y + 2); g.closePath(); g.fill();
  g.fillStyle = P.ziegelDunkel;
  // Ziegelreihen folgen der Dachschraege: oben schmal, unten breit
  for (let i = 1; i < 6; i++) {
    const yy = y - 34 + i * 6, t = (yy - (y - 34)) / 36;
    g.fillRect(x + 40 - t * 56, yy, (w - 80) + t * 112, 1.4);
  }
  for (let xx = x + 10; xx < x + w - 6; xx += 12) g.fillRect(xx, y - 30, 1.2, 30);
  g.fillStyle = "rgba(0,0,0,.15)"; g.fillRect(x - 16, y, w + 32, 4);
  if (!ok) {
    // Loecher, eine blaue Plane und ein Geruest an der Vorderseite
    g.fillStyle = "#5a4a3c";
    for (const [lx, ly, lw] of [[330, y - 22, 26], [404, y - 14, 18], [462, y - 26, 14]]) g.fillRect(lx, ly, lw, 8);
    g.fillStyle = P.plane;
    g.beginPath(); g.moveTo(350, y - 34); g.lineTo(440, y - 34); g.lineTo(452, y + 2); g.lineTo(338, y + 2); g.closePath(); g.fill();
    g.fillStyle = "rgba(255,255,255,.18)"; g.fillRect(352, y - 30, 84, 3);
    geruest(g, x - 8, y + 2, w + 16, 76);
  } else if (laeuft(s, "turm")) {
    geruest(g, 520, 120, 70, 110);
  }
}

function geruest(g, x, y, w, h) {
  g.strokeStyle = P.geruest; g.lineWidth = 2.4;
  for (let xx = x; xx <= x + w + 1; xx += w / 4) { g.beginPath(); g.moveTo(xx, y); g.lineTo(xx, y + h); g.stroke(); }
  for (let yy = y + 4; yy < y + h; yy += 34) {
    g.fillStyle = "#a08a64"; g.fillRect(x - 4, yy, w + 8, 5);
    g.strokeStyle = "rgba(90,70,50,.6)"; g.lineWidth = 1;
    g.beginPath(); g.moveTo(x, yy + 5); g.lineTo(x + w / 4, yy + 34); g.stroke();
  }
}

/** Gibt an, ob ein Zimmer bewohnbar ist. Zimmer 1 ist es von Anfang an. */
function zimmerDa(s, id) {
  if (id === "zimmer1") return true;
  if (id === "zimmer2" || id === "zimmer3") return fertig(s, id);
  return null;   // kein Gaestezimmer
}

function fenster(g, s, f, abend, oben) {
  const fw = 30, fh = 40;
  const da = zimmerDa(s, f.id);
  const laeden = fertig(s, "laeden");
  const belegt = abend && (da === true) && (lichtAn(s, f.id));
  const kuecheLicht = abend && f.id === "kueche" && fertig(s, "kueche");
  // Fensterrahmen
  if (fertig(s, "fassade")) { g.fillStyle = P.rahmen; g.fillRect(f.x - 6, f.y - 6, fw + 12, fh + 12); }
  g.fillStyle = belegt || kuecheLicht ? P.licht : abend ? P.glasAbend : P.glas;
  g.fillRect(f.x, f.y, fw, fh);
  if (!abend) { g.fillStyle = "rgba(255,255,255,.35)"; g.beginPath(); g.moveTo(f.x, f.y + 16); g.lineTo(f.x + 16, f.y); g.lineTo(f.x + 24, f.y); g.lineTo(f.x, f.y + 26); g.fill(); }
  g.fillStyle = "rgba(60,40,30,.5)"; g.fillRect(f.x + fw / 2 - 0.7, f.y, 1.4, fh); g.fillRect(f.x, f.y + fh * 0.45, fw, 1.4);
  // Unbewohnbare Zimmer oben: Bretter vor dem Fenster
  if (oben && da === false) {
    g.fillStyle = "#8a6a48";
    g.save(); g.translate(f.x + fw / 2, f.y + fh / 2);
    g.rotate(-0.25); g.fillRect(-20, -12, 40, 6); g.rotate(0.5); g.fillRect(-20, 6, 40, 6);
    g.restore();
  } else if (da === true) {
    // Vorhaenge in bewohnbaren Zimmern
    g.fillStyle = belegt ? "rgba(255,240,200,.75)" : "rgba(246,240,228,.85)";
    g.fillRect(f.x + 1, f.y + 1, 6, fh - 2); g.fillRect(f.x + fw - 7, f.y + 1, 6, fh - 2);
  }
  // Fensterlaeden: neu und gruen, oder alt, verblichen und schief
  if (laeden) {
    for (const [lx, a] of [[f.x - 15, 1], [f.x + fw + 1, -1]]) {
      g.fillStyle = P.laden; g.fillRect(lx, f.y, 14, fh);
      g.fillStyle = P.ladenHell; for (let yy = f.y + 3; yy < f.y + fh - 2; yy += 4) g.fillRect(lx + 2, yy, 10, 1.6);
      void a;
    }
  } else {
    g.fillStyle = P.ladenAlt;
    g.save(); g.translate(f.x - 8, f.y + 4); g.rotate(-0.12); g.fillRect(-7, 0, 13, fh - 6); g.restore();
    if (f.x % 3) { g.save(); g.translate(f.x + fw + 8, f.y + 8); g.rotate(0.3); g.fillRect(-6, 0, 13, fh - 12); g.restore(); }
    g.fillStyle = "rgba(0,0,0,.12)"; g.fillRect(f.x - 14, f.y + 10, 13, 2);
  }
  // Blumenkasten vor gepflegten Fenstern im Obergeschoss
  if (oben && laeden && s.pflege >= 8) {
    g.fillStyle = P.holz; g.fillRect(f.x - 2, f.y + fh, fw + 4, 6);
    for (let i = 0; i < 6; i++) { g.fillStyle = P.bluete[i % 4]; kreis(g, f.x + 2 + i * 5.4, f.y + fh - 1, 2.4); }
  }
}

/** Abends brennt Licht, wo Gaeste sind. Der UI-Teil reicht die Zahl der
 *  belegten Zimmer ueber `s.lichter` herein (zimmer1, zimmer2, ...). */
function lichtAn(s, id) { return (s.lichter || []).includes(id); }

function tuer(g, s, abend) {
  const x = 380, y = 336, w = 30, h = 64;
  if (fertig(s, "fassade")) { g.fillStyle = P.rahmen; g.beginPath(); g.rect(x - 7, y - 4, w + 14, h + 4); g.arc(x + w / 2, y - 4, w / 2 + 7, Math.PI, 0); g.fill(); }
  g.fillStyle = "#6a4a30"; g.beginPath(); g.rect(x, y, w, h); g.arc(x + w / 2, y, w / 2, Math.PI, 0); g.fill();
  g.fillStyle = abend ? "rgba(255,217,138,.55)" : "rgba(255,255,255,.12)";
  g.beginPath(); g.arc(x + w / 2, y, w / 2 - 4, Math.PI, 0); g.fill();
  g.fillStyle = "#c9a24a"; kreis(g, x + w - 7, y + 34, 1.8);
  g.fillStyle = P.stein; g.fillRect(x - 12, y + h, w + 24, 6);
}

function turm(g, s, abend) {
  const x = 520, y = 130, w = 62, h = 270;
  const ok = fertig(s, "turm"), fassade = fertig(s, "fassade");
  g.fillStyle = fassade ? P.ockerSchatten : P.putzAlt; g.fillRect(x, y, w, h);
  if (fassade) { g.fillStyle = P.rahmen; g.fillRect(x, y + 180, w, 5); }
  // Dach des Turms: kleines Zeltdach, kaputt oder neu
  g.fillStyle = ok ? P.ziegel : "#8f7a66";
  g.beginPath(); g.moveTo(x - 8, y); g.lineTo(x + w / 2, y - 30); g.lineTo(x + w + 8, y); g.closePath(); g.fill();
  if (!ok) { g.fillStyle = "#5a4a3c"; g.fillRect(x + 14, y - 14, 14, 8); }
  // Loggia oben: Bogenfenster; neu mit Licht, alt mit Brettern
  for (const fx of [x + 9, x + 34]) {
    g.fillStyle = ok ? (abend && lichtAn(s, "turm") ? P.licht : abend ? P.glasAbend : P.glas) : "#5a4a3c";
    g.beginPath(); g.rect(fx, y + 26, 19, 30); g.arc(fx + 9.5, y + 26, 9.5, Math.PI, 0); g.fill();
    if (!ok) { g.fillStyle = "#8a6a48"; g.fillRect(fx - 2, y + 30, 23, 5); g.fillRect(fx - 2, y + 44, 23, 5); }
  }
  if (ok && fertig(s, "laeden")) { g.fillStyle = P.laden; g.fillRect(x + 4, y + 26, 4, 30); g.fillRect(x + w - 8, y + 26, 4, 30); }
}

// --- Garten, Terrasse, Weg ---------------------------------------------------------

function garten(g, s, r) {
  const ok = fertig(s, "garten");
  const x0 = 592, y0 = 330;
  if (!ok) {
    // Trockenes Stueck Erde, ein paar Steine
    g.fillStyle = P.erde; g.beginPath(); g.ellipse(x0 + 80, y0 + 70, 110, 44, 0, 0, 7); g.fill();
    g.fillStyle = "#a88a5c"; for (let i = 0; i < 10; i++) kreis(g, x0 + 10 + r() * 150, y0 + 50 + r() * 40, 2 + r() * 3);
    if (laeuft(s, "garten")) werkzeug(g, x0 + 60, y0 + 70);
    return;
  }
  // Beete mit Kraeutern
  g.fillStyle = "#8a6a48"; g.fillRect(x0 + 10, y0 + 60, 70, 34); g.fillRect(x0 + 96, y0 + 66, 70, 30);
  g.fillStyle = "#6a5038"; g.fillRect(x0 + 14, y0 + 64, 62, 26); g.fillRect(x0 + 100, y0 + 70, 62, 22);
  for (let i = 0; i < 14; i++) { g.fillStyle = i % 3 ? P.blattHell : "#8aa46a"; kreis(g, x0 + 20 + (i % 7) * 9, y0 + 70 + Math.floor(i / 7) * 10, 3.6); }
  for (let i = 0; i < 12; i++) { g.fillStyle = i % 4 ? "#7a9a5a" : "#b07ab0"; kreis(g, x0 + 106 + (i % 6) * 10, y0 + 76 + Math.floor(i / 6) * 9, 3.2); }
  // Zwei Zitronenbaeume, die mit jeder Woche wachsen
  const alter = Math.max(0, Math.min(6, s.woche - gartenWoche(s)));
  const k = 0.55 + alter * 0.09;
  for (const [x, y] of [[x0 + 30, y0 + 40], [x0 + 140, y0 + 44]]) zitronenbaum(g, x, y, k, alter);
}

function zitronenbaum(g, x, y, k, alter) {
  g.fillStyle = P.schatten; g.beginPath(); g.ellipse(x + 10 * k, y + 2, 22 * k, 5 * k, 0, 0, 7); g.fill();
  g.fillStyle = "#b5714a"; g.fillRect(x - 10, y - 6, 20, 10);           // Terrakottatopf
  g.fillStyle = P.stamm; g.fillRect(x - 1.5, y - 30 * k, 3, 26 * k);
  g.fillStyle = P.blatt; kreise(g, [[x, y - 36 * k, 15 * k], [x - 10 * k, y - 30 * k, 10 * k], [x + 10 * k, y - 31 * k, 10 * k]]);
  g.fillStyle = P.blattHell; kreis(g, x - 4 * k, y - 40 * k, 7 * k);
  g.fillStyle = P.zitrone;
  const n = Math.min(7, 1 + alter);
  for (let i = 0; i < n; i++) { const a = i * 2.4; kreis(g, x + Math.cos(a) * 10 * k, y - 34 * k + Math.sin(a) * 8 * k, 2.6); }
}

function werkzeug(g, x, y) {
  g.fillStyle = "#6a6a6a"; g.fillRect(x, y, 16, 8);
  g.strokeStyle = P.holz; g.lineWidth = 2; g.beginPath(); g.moveTo(x + 20, y + 8); g.lineTo(x + 34, y - 18); g.stroke();
}

function terrasse(g, s) {
  const ok = fertig(s, "terrasse");
  const x = 130, y = 404, w = 220, h = 52;
  // Plattenboden bzw. Schutt
  g.fillStyle = ok ? "#d9c7a6" : P.erde; g.fillRect(x, y, w, h);
  if (ok) {
    g.fillStyle = "rgba(0,0,0,.06)";
    for (let xx = x; xx < x + w; xx += 22) g.fillRect(xx, y, 1.2, h);
    for (let yy = y; yy < y + h; yy += 13) g.fillRect(x, yy, w, 1.2);
    // Pergola mit Wein
    g.fillStyle = P.holz;
    for (const px of [x + 10, x + 110, x + 205]) g.fillRect(px, y - 70, 6, 76);
    g.fillRect(x + 4, y - 74, w - 2, 6);
    g.fillStyle = P.wein;
    for (let i = 0; i < 22; i++) kreis(g, x + 10 + i * 10, y - 74 + Math.sin(i * 1.3) * 3, 7);
    g.fillStyle = "#6f9a4a";
    for (let i = 0; i < 14; i++) kreis(g, x + 16 + i * 15, y - 66 + Math.sin(i) * 3, 4);
    // Tische und Stuehle
    for (const tx of [x + 50, x + 150]) {
      g.fillStyle = "#f3eee3"; g.beginPath(); g.ellipse(tx, y + 22, 18, 7, 0, 0, 7); g.fill();
      g.fillStyle = "#8a6a48"; g.fillRect(tx - 1.5, y + 22, 3, 14);
      g.fillStyle = "#4f7f5b"; g.fillRect(tx - 30, y + 18, 8, 14); g.fillRect(tx + 22, y + 18, 8, 14);
    }
  } else {
    g.fillStyle = "#a88a5c";
    for (const [sx, sy, r] of [[x + 30, y + 20, 6], [x + 70, y + 32, 4], [x + 150, y + 18, 7], [x + 190, y + 36, 5]]) kreis(g, sx, sy, r);
    if (laeuft(s, "terrasse")) werkzeug(g, x + 100, y + 20);
  }
}

function weg(g, s) {
  // Kiesweg von unten zur Tuer
  g.fillStyle = "#e3d6bb";
  g.beginPath(); g.moveTo(370, 406); g.lineTo(420, 406); g.lineTo(470, H); g.lineTo(330, H); g.closePath(); g.fill();
  g.fillStyle = "rgba(120,96,60,.18)";
  const r = zufall(3);
  for (let i = 0; i < 60; i++) g.fillRect(340 + r() * 120, 410 + r() * 90, 2, 2);
  if (fertig(s, "laternen")) for (const [lx, ly] of [[345, 440], [455, 440], [338, 480], [462, 480]]) {
    g.fillStyle = "#3a3a3a"; g.fillRect(lx - 1.2, ly - 26, 2.4, 26);
    g.fillStyle = "#3a3a3a"; g.fillRect(lx - 4, ly - 34, 8, 9);
    g.fillStyle = "#f3e6cf"; g.fillRect(lx - 3, ly - 33, 6, 7);
  }
}

function pflege(g, s, r) {
  // Wenig Pflege: Unkraut an der Hauswand. Viel Pflege: Toepfe mit Bluehendem.
  const unkraut = Math.max(0, 14 - Math.round(s.pflege));
  g.fillStyle = P.unkraut;
  for (let i = 0; i < unkraut * 2; i++) {
    const x = 262 + r() * 340, y = 398 + r() * 6;
    g.fillRect(x, y, 1.6, -6 - r() * 6); g.fillRect(x + 3, y, 1.6, -4 - r() * 5);
  }
  const toepfe = Math.floor(s.pflege / 3);
  for (let i = 0; i < toepfe; i++) {
    const x = 276 + i * 46 + (i > 1 ? 40 : 0);
    g.fillStyle = "#b5714a"; g.fillRect(x, 390, 14, 10);
    g.fillStyle = P.blatt; kreis(g, x + 7, 386, 7);
    g.fillStyle = P.bluete[i % 4]; kreise(g, [[x + 3, 383, 2.4], [x + 9, 381, 2.4], [x + 7, 387, 2.2]]);
  }
}

// --- Laufzeit: Bewegtes und Figuren -------------------------------------------------

function figur(g, x, y, farbe, sitzt) {
  g.fillStyle = P.schatten; g.beginPath(); g.ellipse(x, y + 1, 6, 2, 0, 0, 7); g.fill();
  g.fillStyle = "#3a3330"; if (!sitzt) { g.fillRect(x - 3, y - 9, 2.4, 9); g.fillRect(x + 0.6, y - 9, 2.4, 9); }
  g.fillStyle = farbe; g.beginPath(); g.roundRect(x - 4.5, y - (sitzt ? 15 : 20), 9, 12, 3); g.fill();
  g.fillStyle = "#e8c49c"; kreis(g, x, y - (sitzt ? 19 : 24), 3.6);
}

function bewegtes(g, s, abend, t, gaeste) {
  // Wellen, die langsam auftauchen und wieder vergehen
  g.lineWidth = 1.4; g.lineCap = "round";
  for (let i = 0; i < 6; i++) {
    const p = (t * 0.08 + i * 0.37) % 1, a = Math.sin(p * Math.PI);
    g.strokeStyle = `rgba(255,255,255,${(abend ? 0.3 : 0.7) * a})`;
    welle(g, (i * 137 + p * 40) % W, 194 + (i % 3) * 9, 18);
  }
  // Rauch aus dem Schornstein, wenn die Kueche laeuft
  if (fertig(s, "kueche")) for (let i = 0; i < 5; i++) {
    const p = (t * 0.18 + i / 5) % 1;
    g.fillStyle = `rgba(240,236,228,${0.5 * (1 - p)})`;
    kreis(g, 478 + Math.sin(t + i) * 3 + p * 18, 182 - p * 50, 4 + p * 8);
  }
  // Laternen leuchten abends, mit leisem Flackern
  if (abend && fertig(s, "laternen")) for (const [lx, ly] of [[345, 440], [455, 440], [338, 480], [462, 480]]) {
    const f = 0.85 + Math.sin(t * 7 + lx) * 0.08;
    g.fillStyle = `rgba(255,210,120,${0.28 * f})`; kreis(g, lx, ly - 29, 16);
    g.fillStyle = `rgba(255,224,150,${f})`; g.fillRect(lx - 3, ly - 33, 6, 7);
  }
  // Signora Pia im Garten, mit Giesskanne
  if (s.hilfe) {
    const x = 690 + Math.sin(t * 0.4) * 30;
    figur(g, x, 452, "#4a4a6a", false);
    g.fillStyle = "#7a8a8a"; g.fillRect(x + 4, 438, 8, 6);
  }
  // Gaeste: auf der Terrasse sitzend, sonst vor dem Haus
  const n = Math.min(8, gaeste);
  for (let i = 0; i < n; i++) {
    const farbe = P.figur[i % P.figur.length];
    if (fertig(s, "terrasse")) {
      const tx = 130 + (i % 4 < 2 ? 50 : 150) + (i % 2 ? 24 : -24);
      figur(g, tx, 440 + Math.floor(i / 4) * 2, farbe, true);
    } else {
      figur(g, 250 + i * 18 + Math.sin(t * 0.5 + i) * 2, 470 + (i % 2) * 8, farbe, false);
    }
  }
}

/**
 * Zeichnet die Villa in g (Groesse breite x hoehe Geraetepixel).
 * opt: { abend, t, gaeste }   gaeste = Figuren, die man sieht
 */
export function villaZeichnen(g, breite, hoehe, s, opt = {}) {
  const abend = !!opt.abend, t = opt.t || 0;
  const key = schluessel(s, abend) + "|" + (s.lichter || []).join(",");
  if (!cache.has(key)) {
    if (cache.size > 6) cache.delete(cache.keys().next().value);
    cache.set(key, backen(s, abend));
  }
  // "cover" mit etwas Zoom auf die Villa: Sie ist die Hauptfigur, die
  // Landschaft ist Rahmen. Unten bleibt der Weg im Bild.
  const k = Math.max(breite / W, hoehe / H) * ZOOM;
  const mx = 440, unten = H;
  g.save();
  g.setTransform(k, 0, 0, k, breite / 2 - mx * k, hoehe - unten * k);
  g.globalAlpha = opt.deckkraft ?? 1;
  g.drawImage(cache.get(key), 0, 0, W, H);
  bewegtes(g, s, abend, t, opt.gaeste || 0);
  g.globalAlpha = 1;
  g.restore();
}

export const VILLA_GROESSE = { w: W, h: H };
