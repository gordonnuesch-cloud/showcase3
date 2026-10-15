# Arbeitsanweisung für Claude Code

Dieses Projekt ist ein spielbarer Aufbau-Prototyp: eine Saison lang eine
kleine Villa in Ligurien wieder in Gang bringen. Es ist der dritte Showcase
dafür, dass ein Spiel ohne Entwicklungsbudget und ohne eingekaufte Assets
entstehen kann – diesmal in einem freundlichen Genre (Cosy Romance).

## Die eine Regel

**Nichts wird eingebunden, was nicht aus Code entsteht.** Keine Bilddateien,
keine Audiodateien, keine Spritesheets, keine Schriftdateien außer den zwei
Google-Fonts im `<link>`. Die Villa ist gezeichnetes Canvas, Ton ist Web Audio.

Kein Buchtitel, kein Autorenname, kein Verlagsname auf der Seite.

## Vor jedem Commit

```
npm run balance
```

Simuliert tausend Saisons je Strategie mit genau der Spiellogik aus
`src/modell.js` und gibt die Verteilung der Ausgänge aus. Ziel: Keine
Strategie gewinnt immer, keine verliert immer, Durchklicken (nur „Woche
beginnen“) landet im Mittelfeld. Das Werkzeug bricht mit Fehler ab, wenn
eine dieser Bedingungen verletzt ist.

```
npm run rauchtest
```

Spielt den Build im Browser mit Kunstuhr, prüft jede Station und legt Bilder
nach `rauchtest/` ab (Übersicht: `rauchtest/00-uebersicht.png`). Ansehen,
nicht nur laufen lassen.

## Aufbau

```
index.html          Markup
src/
  data/             Projekte, Ereignisse, Texte, Ausgänge – reine Daten
  modell.js         die ganze Spiellogik, ohne DOM; auch tools/ rechnet damit
  audio.js          Web-Audio-Klänge
  villa.js          die Villa in Canvas, Zustand rein aus dem Modell
  ui.js             Planen, Abrechnung, Bilanz (DOM)
  main.js           Einstieg, verdrahtet alles
tools/
  balance.mjs       Balance-Simulation
  rauchtest.mjs     Browser-Rauchtest
  zu-artifact.mjs   Build für die Veröffentlichung als Artifact
```

**Importrichtung:** `data` → `modell` → `audio` → `villa` → `ui` → `main`.
`modell` und `villa` kennen kein DOM außer dem Canvas, das man ihnen gibt.

## Spielwerte ändern

Fast alles ist Daten (`src/data/`). Nach jeder Änderung an Zahlen:
`npm run balance` und die Verteilung ansehen.

## Ton und Sprache

Deutsch. Freundlich, nicht süßlich. Keine Ausrufezeichen, keine Emojis.
Wochentexte kurz und konkret („Der Dachdecker kommt erst Dienstag“).
Italienische Begriffe sparsam und richtig.

## Veröffentlichen

```
npm run build && npm run artifact
```

`artifact.html` veröffentlichen, nicht `dist/index.html`.
