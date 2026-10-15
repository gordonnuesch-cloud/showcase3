// Wochenereignisse: veraendern die Rechnung, bestrafen nicht.
// Wirkungen gelten fuer die Woche, in der das Ereignis eintritt.
//   nachfrage  Faktor auf die Nachfrage     geld   einmalig
//   pflege     auf den Pflegezustand        tage   mehr/weniger Arbeitstage
//   projektPlus  laufendes Projekt dauert laenger
//   rabatt     naechstes begonnenes Projekt kostet weniger
//   extraNaechte  ab `abZimmern` offenen Zimmern
//   wahl       zwei Moeglichkeiten, beide mit sichtbaren Kosten

export const EREIGNISSE = [
  { id: "regen", titel: "Regen",
    text: "Drei Tage Regen. Wer gebucht hat, bleibt im Zimmer und liest. Neue Anfragen kommen kaum.",
    nachfrage: 0.7 },
  { id: "hochzeit", titel: "Hochzeit im Dorf",
    text: "Unten in San Martino wird geheiratet. Die Gäste brauchen Betten.",
    nachfrage: 1.4 },
  { id: "dachdecker", titel: "Der Handwerker",
    text: "Der Dachdecker kommt erst Dienstag. Was gerade läuft, dauert einen Tag länger.",
    projektPlus: 1 },
  { id: "oliven", titel: "Oliven",
    text: "Signor Bertone bringt einen Eimer Oliven aus seinem Hain. Das Frühstück wird diese Woche günstiger.",
    geld: 60, pflege: 1 },
  { id: "gruppe", titel: "Eine Wandergruppe",
    text: "Eine Wandergruppe aus Turin fragt nach zwei Zimmern für drei Nächte.",
    extraNaechte: 6, abZimmern: 2 },
  { id: "baumarkt", titel: "Der Baumarkt räumt",
    text: "Der Baumarkt in Sarzana räumt das Lager. Was diese Woche begonnen wird, kostet ein Viertel weniger.",
    rabatt: 0.25 },
  { id: "journalistin", titel: "Besuch aus Genua",
    text: "Eine Reisejournalistin übernachtet und macht Fotos vom Garten.",
    nachfrage: 1.3, pflege: 2 },
  { id: "rohr", titel: "Unter der Spüle",
    text: "Unter der Spüle tropft es.",
    wahl: [
      { label: "Klempner rufen", text: "Kommt morgen, kostet 180 €.", geld: -180 },
      { label: "Selbst machen", text: "Kostet zwei Arbeitstage.", tage: -2 }
    ] },
  { id: "hitze", titel: "Hitze",
    text: "Die Gäste wollen ans Meer, der Garten will Wasser.",
    nachfrage: 1.15, pflege: -2 },
  { id: "helfer", titel: "Ein Helfer",
    text: "Der Sohn der Nachbarin hat Semesterferien und hilft einen Tag.",
    tage: 1 },
  { id: "ruhig", titel: "Eine ruhige Woche",
    text: "Nichts Besonderes. Abends die Zikaden." },
  { id: "markt", titel: "Markttag",
    text: "Samstag ist Markt. Die Zitronen aus dem Garten gehen gut weg.",
    geld: 90, braucht: "garten" },
  { id: "fest", titel: "Sagra",
    text: "Das Dorf feiert die Sagra delle acciughe. Man hilft beim Aufbau und wird zum Essen eingeladen.",
    wahl: [
      { label: "Mithelfen", text: "Kostet einen Tag, die Leute reden danach gut über die Villa.", tage: -1, pflege: 3 },
      { label: "Absagen", text: "Kostet nichts.", }
    ] }
];
