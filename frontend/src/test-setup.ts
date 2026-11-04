import { setLanguage } from "./lib/i18n";
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";
afterEach(() => {
  cleanup();
  setLanguage("en");
  vi.restoreAllMocks();
  localStorage.clear();
});
// JSDOM does not implement the browser's native dialog behavior. Real focus trapping
// and responsive layout require the manual browser checks documented in the README.
HTMLDialogElement.prototype.showModal = function () {
  this.setAttribute("open", "");
};
HTMLDialogElement.prototype.close = function () {
  this.removeAttribute("open");
};
