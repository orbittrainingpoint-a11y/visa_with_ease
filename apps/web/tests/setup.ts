import '@testing-library/jest-dom/vitest';

// jsdom doesn't implement matchMedia — Blog.tsx registers a GSAP
// ScrollTrigger plugin at module load time, which calls it unconditionally.
// This is the standard stub for that gap, not specific to this app.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false
  }) as unknown as MediaQueryList;
}
