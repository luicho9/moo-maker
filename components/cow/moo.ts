let ctx: AudioContext | null = null;

export function moo() {
  ctx ??= new AudioContext();
  const t = ctx.currentTime;

  const osc = ctx.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(105, t);
  osc.frequency.linearRampToValueAtTime(145, t + 0.25);
  osc.frequency.exponentialRampToValueAtTime(90, t + 1.1);

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.Q.value = 5;
  filter.frequency.setValueAtTime(350, t);
  filter.frequency.linearRampToValueAtTime(1100, t + 0.3);
  filter.frequency.linearRampToValueAtTime(450, t + 1.1);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.22, t + 0.1);
  gain.gain.linearRampToValueAtTime(0.18, t + 0.8);
  gain.gain.linearRampToValueAtTime(0, t + 1.2);

  osc.connect(filter).connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 1.25);
}
