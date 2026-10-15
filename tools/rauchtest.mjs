// Rauchtest: startet den Build in einem echten Browser mit Kunstuhr,
// prueft die Stationen und legt Bilder nach rauchtest/ ab.
// Aufruf: npm run build && node tools/rauchtest.mjs

import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFileSync, mkdirSync, rmSync, readdirSync } from "node:fs";

const ORDNER = "rauchtest";
rmSync(ORDNER, { recursive: true, force: true });
mkdirSync(ORDNER);

const html = readFileSync("dist/index.html");
const server = createServer((_, res) => {
  res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  res.end(html);
}).listen(0);
const adresse = `http://127.0.0.1:${server.address().port}/?rauchtest`;

const browser = await chromium.launch();
const fehler = [], befunde = [];
const pruefe = (ok, text) => { if (!ok) befunde.push(text); };

async function seiteOeffnen(optionen) {
  const kontext = await browser.newContext(optionen);
  const seite = await kontext.newPage();
  seite.on("console", (m) => {
    if (m.type() === "error" && !/fonts\.(googleapis|gstatic)|ERR_INTERNET_DISCONNECTED|ERR_NAME_NOT_RESOLVED/.test(m.text())) fehler.push(m.text());
  });
  seite.on("pageerror", (e) => fehler.push("pageerror: " + e.message));
  await seite.clock.install();
  await seite.goto(adresse);
  await seite.clock.runFor(600);
  return seite;
}
const bild = (seite, name) => seite.screenshot({ path: `${ORDNER}/${name}.png` });

// --- Desktop ---------------------------------------------------------------
const s = await seiteOeffnen({ viewport: { width: 1100, height: 760 } });
pruefe(await s.evaluate(() => document.documentElement.dataset.bereit === "1"), "Seite startet nicht");
await bild(s, "01-start");

// --- Villa-Galerie: alle Ausbaustufen ------------------------------------------
const gal = await browser.newPage({ viewport: { width: 1500, height: 1500 } });
gal.on("pageerror", (e) => fehler.push("galerie: " + e.message));
await gal.goto(adresse.replace("?rauchtest", "?galerie"));
await gal.waitForTimeout(500);
await gal.screenshot({ path: `${ORDNER}/50-galerie.png`, fullPage: true });

// --- Telefon ---------------------------------------------------------------
const t = await seiteOeffnen({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await bild(t, "90-telefon");

// --- Übersicht -------------------------------------------------------------
const namen = readdirSync(ORDNER).filter((n) => n.endsWith(".png")).sort();
const blatt = await browser.newPage({ viewport: { width: 1600, height: 400 } });
await blatt.setContent(`<body style="margin:0;background:#222;font:12px sans-serif;color:#ddd;
  display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:6px">` +
  namen.map((n) => `<figure style="margin:0"><img style="width:100%;display:block"
    src="data:image/png;base64,${readFileSync(`${ORDNER}/${n}`).toString("base64")}">
    <figcaption>${n}</figcaption></figure>`).join("") + "</body>");
await blatt.screenshot({ path: `${ORDNER}/00-uebersicht.png`, fullPage: true });

await browser.close();
server.close();

console.log(`Bilder: ${ORDNER}/ — Übersicht in 00-uebersicht.png`);
if (befunde.length) { console.error("\nAblauf hakt:"); befunde.forEach((b) => console.error("  " + b)); }
if (fehler.length) { console.error("\nKonsolenfehler:"); fehler.forEach((f) => console.error("  " + f)); }
if (befunde.length || fehler.length) process.exit(1);
console.log("Ablauf vollständig, keine Konsolenfehler.");
