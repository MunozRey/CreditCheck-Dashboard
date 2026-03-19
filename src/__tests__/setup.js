import "@testing-library/jest-dom";

// ── jsdom does not implement localStorage by default in some envs ──
// themes.js calls applyTheme("light") at module load, which touches
// document.createElement and localStorage. We stub them so the import
// does not throw in the test environment.
if (typeof window !== "undefined") {
  // Provide a no-op localStorage if missing
  if (!window.localStorage) {
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
        clear: () => {},
      },
    });
  }
}
