// Ton aus Web Audio - keine Dateien. Leise und sparsam: ein Aufbauspiel
// will man lange hoeren koennen. Startet erst nach einer Nutzergeste.
// (Die Atmosphaere kommt in einem eigenen Schritt dazu.)

export const Ton = {
  ctx: null, master: null,

  start() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain(); this.master.gain.value = 0.6;
    const komp = this.ctx.createDynamicsCompressor();
    this.master.connect(komp); komp.connect(this.ctx.destination);
  },

  ton(hz, t, dauer, laut = 0.08, typ = "sine") {
    if (!this.ctx) return;
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = typ; o.frequency.value = hz;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(laut, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dauer);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dauer + 0.05);
  },

  klick() { if (this.ctx) this.ton(880, this.ctx.currentTime, 0.05, 0.03, "triangle"); },

  /** Ende der Woche: zwei weiche Toene, aufwaerts bei Gewinn, abwaerts bei Verlust. */
  wocheVorbei(b) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + 0.05, plus = b.geld >= b.geldVorher;
    this.ton(plus ? 523 : 494, t, 0.6, 0.06, "triangle");
    this.ton(plus ? 659 : 392, t + 0.14, 0.8, 0.05, "triangle");
    if (b.fertig) [784, 988, 1175].forEach((hz, i) => this.ton(hz, t + 0.4 + i * 0.1, 1.2, 0.05));
  },

  bilanz(index) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + 0.1;
    const akkord = index >= 3 ? [523, 659, 784, 1046] : index >= 2 ? [523, 659, 784] : [440, 523, 659];
    akkord.forEach((hz, i) => this.ton(hz, t + i * 0.12, 2, 0.05, "triangle"));
  }
};
