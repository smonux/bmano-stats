/** A single deadline and cancellation path, shared by interaction, hiding, and unmount. */
export function startReviewCountdown(tick: (seconds: number) => void, complete: () => void) {
  const deadline = performance.now() + 5000;
  let active = true;
  const cancel = () => {
    active = false;
    clearInterval(timer);
  };
  const timer = setInterval(() => {
    if (!active) return;
    const seconds = Math.max(0, Math.ceil((deadline - performance.now()) / 1000));
    tick(seconds);
    if (seconds === 0) {
      cancel();
      complete();
    }
  }, 100);
  tick(5);
  return cancel;
}
