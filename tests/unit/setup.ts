import "@testing-library/jest-dom";

// Minimal matchMedia / ResizeObserver shims for jsdom (hooks under test use them).
if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver =
  (globalThis as unknown as { ResizeObserver?: unknown }).ResizeObserver ??
  ResizeObserverStub;

if (!("requestAnimationFrame" in globalThis)) {
  (globalThis as unknown as { requestAnimationFrame: (cb: FrameRequestCallback) => number }).requestAnimationFrame =
    (cb) => setTimeout(() => cb(Date.now()), 16) as unknown as number;
}

// Silence noisy WebGL/canvas warnings from jsdom in unit tests.
const origError = console.error;
console.error = (...args: unknown[]) => {
  const first = String(args[0] ?? "");
  if (first.includes("not implemented") || first.includes("WebGL")) return;
  origError(...(args as []));
};
