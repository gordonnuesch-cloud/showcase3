// Die Saison: Kalender, Nachfrage, Startwerte, Ausgaenge. Reine Daten.

export const WOCHEN = [
  "27. April – 3. Mai", "4. – 10. Mai", "11. – 17. Mai", "18. – 24. Mai",
  "25. – 31. Mai", "1. – 7. Juni", "8. – 14. Juni", "15. – 21. Juni",
  "22. – 28. Juni", "29. Juni – 5. Juli", "6. – 12. Juli", "13. – 19. Juli",
  "20. – 26. Juli", "27. Juli – 2. August", "3. – 9. August", "10. – 16. August"
];

/** Nachfrage je Woche, 0..1. Steigt bis Ferragosto. */
export const NACHFRAGE = [0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.78, 0.85, 0.9, 0.95, 1, 1, 1, 1];

export const START = { geld: 1800, pflege: 4, zimmer: 1 };

export const REGELN = {
  tage: 6,                 // Arbeitstage pro Woche
  fixkosten: 160,          // pro Woche: Strom, Wasser, Versicherung
  proNacht: 12,            // Waesche, Fruehstueck
  dispo: -800,             // darunter muss verkauft werden
  charmeBasis: 10,
  pflegeMax: 15,
  pflegeProTag: 2,
  pflegeVerfall: 2,        // pro Woche
  abnutzungJeNaechte: 10,  // je so viele Naechte: -1 Pflege
  preisBasis: 38, preisJeCharme: 1.25, preisFruehstueck: 15,
  auslastungTeiler: 50,    // Auslastung = Nachfrage * Charme / Teiler
  hilfeKosten: 120, hilfeTage: 2,
  charmeWert: 60           // so viel ist ein Punkt Charme in der Bilanz wert
};

/** Schwellen der Ausgaenge. Wert = Geld + charmeWert * Charme. */
export const SCHWELLEN = {
  ausgebucht: { charme: 68, geld: 3500 },
  gutGebucht: 7000,
  traegtSich: 5000
};

/** Ausgaenge, vom schlechtesten zum besten. */
export const AUSGAENGE = [
  { titel: "Die Villa wird verkauft.",
    text: "Das Geld hat nicht gereicht. Ein Makler aus Mailand kommt am Montag mit einem Angebot, das niemand gut findet." },
  { titel: "Ein zweiter Sommer, wenn die Bank mitspielt.",
    text: "Die Villa steht noch, die Rechnung geht knapp nicht auf. Im Winter wird gerechnet." },
  { titel: "Die Villa trägt sich.",
    text: "Kein großer Gewinn, aber auch kein Loch. Die Villa bezahlt ihre eigenen Ziegel." },
  { titel: "Gut gebucht.",
    text: "Für Juni gibt es schon Anfragen. Wer im Sommer da war, hat es weitererzählt." },
  { titel: "Ausgebucht für nächstes Jahr.",
    text: "Im September ist der nächste Sommer vergeben. Die Zitronen werden schon wieder gelb." }
];
