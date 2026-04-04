let audioCtx: AudioContext | null = null;

function getCtx() {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = "square",
  volume = 0.08,
  fadeOut = true
) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = volume;
  if (fadeOut) {
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  }
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

export function playClick() {
  playTone(800, 0.05, "square", 0.06);
}

export function playStartMenu() {
  const ctx = getCtx();
  const now = ctx.currentTime;
  [480, 600, 720].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.value = 0.06;
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08 + i * 0.04);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + i * 0.04);
    osc.stop(now + 0.12 + i * 0.04);
  });
}

export function playWindowOpen() {
  const ctx = getCtx();
  const now = ctx.currentTime;
  [400, 500].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.value = 0.05;
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1 + i * 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + i * 0.05);
    osc.stop(now + 0.15 + i * 0.05);
  });
}

export function playWindowClose() {
  const ctx = getCtx();
  const now = ctx.currentTime;
  [500, 350].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.value = 0.05;
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08 + i * 0.04);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + i * 0.04);
    osc.stop(now + 0.12 + i * 0.04);
  });
}

export function playMinimize() {
  playTone(600, 0.06, "sine", 0.04);
  setTimeout(() => playTone(400, 0.06, "sine", 0.04), 50);
}

export function playShutdown() {
  const ctx = getCtx();
  const now = ctx.currentTime;
  const notes = [520, 480, 400, 340];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.value = 0.07;
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4 + i * 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + i * 0.25);
    osc.stop(now + 0.5 + i * 0.25);
  });
}

export function playError() {
  playTone(300, 0.15, "square", 0.06);
  setTimeout(() => playTone(250, 0.2, "square", 0.06), 150);
}
