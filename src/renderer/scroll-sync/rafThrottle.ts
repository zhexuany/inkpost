/**
 * requestAnimationFrame-based throttle.
 * Calls fn at most once per animation frame, using the latest arguments.
 */
export function rafThrottle<T extends (...args: any[]) => void>(fn: T): T {
  let rafId: number | null = null;
  let lastArgs: Parameters<T> | null = null;

  const throttled = function (...args: Parameters<T>) {
    lastArgs = args;
    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        rafId = null;
        if (lastArgs) {
          fn(...lastArgs);
          lastArgs = null;
        }
      });
    }
  };

  return throttled as unknown as T;
}
