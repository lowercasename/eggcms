// src/admin/test/setup.ts
import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Mock the api module
vi.mock("../lib/api", () => ({
  api: {
    getMedia: vi.fn().mockResolvedValue({ data: [] }),
    uploadMedia: vi.fn().mockResolvedValue({ data: { path: "/uploads/test.jpg" } }),
    getSchemas: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

// The remaining setup is jsdom-only. Server-side tests opt out via
// `// @vitest-environment node` and don't need (or have) these globals.
if (typeof window !== "undefined" && typeof Range !== "undefined") {
  // Polyfill getClientRects for ProseMirror in jsdom — ProseMirror calls
  // getClientRects during focus/scroll operations which jsdom doesn't support.
  if (!Range.prototype.getClientRects) {
    Range.prototype.getClientRects = () => ({
      length: 0,
      item: () => null,
      [Symbol.iterator]: function* () {},
    });
  }
  if (!Range.prototype.getBoundingClientRect) {
    Range.prototype.getBoundingClientRect = () => ({
      x: 0, y: 0, width: 0, height: 0,
      top: 0, right: 0, bottom: 0, left: 0,
      toJSON: () => {},
    });
  }
  if (!HTMLElement.prototype.getClientRects) {
    HTMLElement.prototype.getClientRects = () => ({
      length: 0,
      item: () => null,
      [Symbol.iterator]: function* () {},
    });
  }

  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
}
