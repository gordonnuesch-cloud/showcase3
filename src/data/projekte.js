// Renovierungsprojekte. Geld wird beim Start faellig, die Tage verteilt man
// ueber die Wochen. `braucht` nennt ein Projekt, das vorher fertig sein muss.

export const PROJEKTE = [
  { id: "laternen", name: "Laternen am Weg", geld: 150, tage: 1, charme: 4,
    text: "Abends sieht man, wo es langgeht." },
  { id: "garten", name: "Garten anlegen", geld: 200, tage: 2, charme: 5,
    text: "Beete, Kräuter, zwei junge Zitronenbäume." },
  { id: "laeden", name: "Fensterläden", geld: 250, tage: 2, charme: 5,
    text: "Neue persiane in Grün statt der losen alten." },
  { id: "dach", name: "Dach decken", geld: 1000, tage: 3, charme: 6,
    text: "Ohne Dach kein oberes Stockwerk. Schaltet Zimmer und Hilfe frei." },
  { id: "zimmer2", name: "Zimmer 2 herrichten", geld: 450, tage: 3, charme: 3, zimmer: 1, braucht: "dach",
    text: "Das Zimmer mit Blick aufs Meer." },
  { id: "zimmer3", name: "Zimmer 3 herrichten", geld: 800, tage: 3, charme: 3, zimmer: 1, braucht: "dach",
    text: "Das Eckzimmer über dem Garten." },
  { id: "fassade", name: "Fassade kalken", geld: 700, tage: 3, charme: 9,
    text: "Warmes Ocker statt abgeblättertem Putz." },
  { id: "terrasse", name: "Terrasse mit Pergola", geld: 900, tage: 3, charme: 10,
    text: "Ein Platz für den Abend, Wein über dem Kopf." },
  { id: "kueche", name: "Frühstücksküche", geld: 1000, tage: 3, charme: 4, fruehstueck: true,
    text: "Frühstück im Haus: jede Nacht bringt mehr." },
  { id: "turm", name: "Turmzimmer", geld: 1500, tage: 4, charme: 8, zimmer: 1, braucht: "dach",
    text: "Das schönste Zimmer, und das teuerste." }
];

// Hilfe ist kein Projekt, sondern eine Entscheidung neben dem Projekt:
// Signora Pia kommt ab der Woche nach der Einstellung, jede Woche.
export const HILFE = {
  name: "Signora Pia", text: "Kommt jede Woche aus dem Dorf: putzt, kocht, hält den Garten."
};
