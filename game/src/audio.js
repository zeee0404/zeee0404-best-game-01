// Tiny synthesized sound effects with the Web Audio API — no audio files, so the game
// stays fully self-contained. Sounds start only after the first user gesture, and the
// whole module stays silent in screenshot mode.

export function createAudio() {
  let ctx = null;
  let muted = false;

  const ensure = () => {
    if (!ctx) {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (Ctor) ctx = new Ctor();
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  };

  const tone = (freqFrom, freqTo, seconds, type, volume, delay = 0) => {
    if (muted) return;
    const ac = ensure();
    if (!ac) return;
    const start = ac.currentTime + delay;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqFrom, start);
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, freqTo), start + seconds);
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
    osc.connect(gain).connect(ac.destination);
    osc.start(start);
    osc.stop(start + seconds + 0.02);
  };

  return {
    unlock: ensure,
    toggleMute() {
      muted = !muted;
      return muted;
    },
    get muted() {
      return muted;
    },
    collect(combo) {
      const step = Math.min(combo, 12);
      tone(520 + step * 40, 880 + step * 60, 0.12, 'sine', 0.16);
    },
    stun() {
      tone(900, 160, 0.18, 'square', 0.1);
    },
    hurt() {
      tone(220, 60, 0.3, 'sawtooth', 0.18);
    },
    dash() {
      tone(300, 720, 0.1, 'triangle', 0.07);
    },
    waveClear() {
      tone(523, 523, 0.12, 'sine', 0.14);
      tone(659, 659, 0.12, 'sine', 0.14, 0.1);
      tone(784, 784, 0.2, 'sine', 0.14, 0.2);
    },
    win() {
      [523, 659, 784, 1046].forEach((f, i) => tone(f, f, 0.22, 'sine', 0.15, i * 0.13));
    },
    lose() {
      [392, 330, 262, 196].forEach((f, i) => tone(f, f * 0.94, 0.24, 'triangle', 0.15, i * 0.14));
    },
  };
}
