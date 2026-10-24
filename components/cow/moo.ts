import { lerp } from "./params";
import { useCow } from "./store";

let ctx: AudioContext | null = null;

export function moo() {
  ctx ??= new AudioContext();
  const t = ctx.currentTime;
  const { mooPitch, mooLength } = useCow.getState();
  const p = lerp(0.6, 1.6, mooPitch);
  // Stretches the whole envelope; 1 is the original moo.
  const l = lerp(0.6, 1.6, mooLength);

  const osc = ctx.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(105 * p, t);
  osc.frequency.linearRampToValueAtTime(145 * p, t + 0.25 * l);
  osc.frequency.exponentialRampToValueAtTime(90 * p, t + 1.1 * l);

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.Q.value = 5;
  filter.frequency.setValueAtTime(350 * p, t);
  filter.frequency.linearRampToValueAtTime(1100 * p, t + 0.3 * l);
  filter.frequency.linearRampToValueAtTime(450 * p, t + 1.1 * l);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.22, t + 0.1 * l);
  gain.gain.linearRampToValueAtTime(0.18, t + 0.8 * l);
  gain.gain.linearRampToValueAtTime(0, t + 1.2 * l);

  osc.connect(filter).connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 1.25 * l);
}
