// The WebGL canvas doesn't preserve its drawing buffer, so it can only be read
// in the same frame it was drawn. Requests queue here and Scene flushes them
// right after the frame renders.
type Reader = (canvas: HTMLCanvasElement) => void;

const pending: Reader[] = [];

export function requestSnapshot(read: Reader) {
  pending.push(read);
}

export function flushSnapshots(canvas: HTMLCanvasElement) {
  for (const read of pending.splice(0)) read(canvas);
}
