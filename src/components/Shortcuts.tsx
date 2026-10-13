"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Tally-style keys:
 * - Alt+C opens the "create" screen of the current list
 * - Esc goes back to the previous screen
 * - Ctrl+A (or Ctrl+Enter) saves the form marked data-main-form
 */
export function Shortcuts({ createHref, backHref }: { createHref?: string; backHref?: string }) {
  const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.altKey && !e.ctrlKey && e.key.toLowerCase() === "c" && createHref) {
        e.preventDefault();
        router.push(createHref);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === "a" || e.key === "Enter")) {
        const form = document.querySelector<HTMLFormElement>("form[data-main-form]");
        if (form) {
          e.preventDefault();
          form.requestSubmit();
        }
        return;
      }
      if (e.key === "Escape" && backHref) {
        // Leave an open dropdown alone; only go back from the page itself.
        if ((e.target as HTMLElement)?.tagName === "SELECT") return;
        e.preventDefault();
        router.push(backHref);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, createHref, backHref]);

  return null;
}
