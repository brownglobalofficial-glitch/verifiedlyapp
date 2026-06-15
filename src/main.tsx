import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";

// Auto-cleanup of any stale service workers / caches so users always get
// the freshest build without manually clearing cookies/cache.
if (typeof window !== "undefined") {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations?.().then((regs) => {
      regs.forEach((r) => r.unregister());
    }).catch(() => {});
  }
  if ("caches" in window) {
    caches.keys().then((keys) => keys.forEach((k) => caches.delete(k))).catch(() => {});
  }

  // Detect new builds: when the user returns to the tab, fetch index.html and
  // reload if its content hash differs from the one we loaded with.
  const initialHtmlHash = (async () => {
    try {
      const r = await fetch(window.location.origin + "/?__cb=" + Date.now(), { cache: "no-store" });
      return await r.text();
    } catch { return ""; }
  })();
  document.addEventListener("visibilitychange", async () => {
    if (document.visibilityState !== "visible") return;
    try {
      const r = await fetch(window.location.origin + "/?__cb=" + Date.now(), { cache: "no-store" });
      const fresh = await r.text();
      const initial = await initialHtmlHash;
      // Compare the hashed asset script tag — Vite rewrites it per build.
      const tag = (s: string) => s.match(/\/assets\/[^"']+\.js/g)?.[0] || "";
      if (initial && tag(initial) && tag(fresh) && tag(initial) !== tag(fresh)) {
        window.location.reload();
      }
    } catch {}
  });
}

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
