/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { rafThrottle } from '../rafThrottle';

let rafCallbacks: Array<FrameRequestCallback> = [];

beforeEach(() => {
  rafCallbacks = [];
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation(
    (cb: FrameRequestCallback): number => {
      rafCallbacks.push(cb);
      return rafCallbacks.length;
    },
  );
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id: number): void => {
    rafCallbacks[id - 1] = () => {};
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

function flushRaf(count = 1) {
  for (let i = 0; i < count; i++) {
    const callbacks = [...rafCallbacks];
    rafCallbacks = [];
    callbacks.forEach((cb) => cb(performance.now()));
  }
}

describe('rafThrottle', () => {
  it('calls fn once per animation frame', () => {
    const fn = vi.fn();
    const throttled = rafThrottle(fn);

    throttled(1);
    throttled(2);
    throttled(3);

    expect(fn).not.toHaveBeenCalled();

    flushRaf();

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(3);
  });

  it('does not call fn if never invoked', () => {
    const fn = vi.fn();
    rafThrottle(fn);

    flushRaf();
    expect(fn).not.toHaveBeenCalled();
  });

  it('calls fn again after the next rAF when re-invoked', () => {
    const fn = vi.fn();
    const throttled = rafThrottle(fn);

    throttled(1);
    flushRaf();
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(1);

    throttled(2);
    flushRaf();
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith(2);
  });

  it('coalesces multiple calls within one frame', () => {
    const fn = vi.fn();
    const throttled = rafThrottle(fn);

    throttled(1);
    throttled(2);
    flushRaf();
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(2);

    throttled(3);
    throttled(4);
    throttled(5);
    flushRaf();
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith(5);
  });

  it('passes multiple arguments', () => {
    const fn = vi.fn();
    const throttled = rafThrottle(fn);

    throttled('a', 1, true);
    flushRaf();
    expect(fn).toHaveBeenCalledWith('a', 1, true);
  });
});
