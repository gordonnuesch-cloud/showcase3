// Ton aus Web Audio - keine Dateien. Leise und sparsam: ein Aufbauspiel
// will man lange hoeren koennen. Startet erst nach einer Nutzergeste.
// Atmosphaere: Meer immer, Zikaden tagsueber ab Juni (lauter zum August
// hin), abends Grillen. Alles sehr leise - es soll man erst merken, wenn
// es fehlt.

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
    this.atmoStarten();
  },

  an(v) {
    if (!this.ctx) return;
    if (this.ctx.state === "suspended") this.ctx.resume();
    this.master.gain.setTargetAtTime(v ? 0.6 : 0.0001, this.ctx.currentTime, 0.3);
  },

  rauschen(sekunden, braun) {
    const c = this.ctx, n = Math.floor(c.sampleRate * sekunden);
    const b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
    let x = 0;
    for (let i = 0; i < n; i++) { const w = Math.random() * 2 - 1; x = braun ? (x + 0.02 * w) / 1.02 : w; d[i] = braun ? x * 3.5 : w; }
    return b;
  },

  atmoStarten() {
    const c = this.ctx;
    // Meer: braunes Rauschen, Wellen als langsames An- und Abschwellen
    const meer = c.createBufferSource(); meer.buffer = this.rauschen(6, true); meer.loop = true;
    const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 520;
    this.meer = c.createGain(); this.meer.gain.value = 0.05;
    const welle = c.createOscillator(); welle.frequency.value = 0.09;
    const tiefe = c.createGain(); tiefe.gain.value = 0.03;
    welle.connect(tiefe); tiefe.connect(this.meer.gain);
    meer.connect(lp); lp.connect(this.meer); this.meer.connect(this.master);
    meer.start(); welle.start();
    // Zikaden: hohes Rauschen, schnell amplitudenmoduliert
    const zik = c.createBufferSource(); zik.buffer = this.rauschen(3, false); zik.loop = true;
    const bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 5600; bp.Q.value = 6;
    const am = c.createGain(); am.gain.value = 0.5;
    const takt = c.createOscillator(); takt.frequency.value = 38;
    const takttiefe = c.createGain(); takttiefe.gain.value = 0.5;
    takt.connect(takttiefe); takttiefe.connect(am.gain);
    this.zikaden = c.createGain(); this.zikaden.gain.value = 0;
    zik.connect(bp); bp.connect(am); am.connect(this.zikaden); this.zikaden.connect(this.master);
    zik.start(); takt.start();
    // Grillen: kurze Zirplaute in unregelmaessigen Abstaenden
    this.grillen = c.createGain(); this.grillen.gain.value = 0; this.grillen.connect(this.master);
    const zirp = () => {
      if (!this.ctx) return;
      const t = c.currentTime + 0.02;
      for (let i = 0; i < 3; i++) {
        const o = c.createOscillator(), g = c.createGain();
        o.frequency.value = 4300 + Math.random() * 300;
        g.gain.setValueAtTime(0.0001, t + i * 0.06);
        g.gain.exponentialRampToValueAtTime(0.04, t + i * 0.06 + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.06 + 0.04);
        o.connect(g); g.connect(this.grillen); o.start(t + i * 0.06); o.stop(t + i * 0.06 + 0.05);
      }
      setTimeout(zirp, 600 + Math.random() * 1400);
    };
    zirp();
  },

  /** Klangbild nach Woche und Tageszeit. */
  stimmung(woche, abend) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const sommer = Math.max(0, Math.min(1, (woche - 4) / 8));   // Zikaden ab Juni
    this.zikaden.gain.setTargetAtTime(abend ? 0 : 0.012 * sommer, t, 1.2);
    this.grillen.gain.setTargetAtTime(abend ? 0.5 : 0, t, 1.2);
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
