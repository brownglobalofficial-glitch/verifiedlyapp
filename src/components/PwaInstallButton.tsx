import { useEffect, useMemo, useState } from "react";
import { Download, RefreshCw } from "lucide-react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const PwaInstallButton = () => {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [help, setHelp] = useState(false);
  const [updateReady, setUpdateReady] = useState(false);

  const platform = useMemo(() => {
    const ua = navigator.userAgent;
    const isiPadOS = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
    return {
      ios: /iPad|iPhone|iPod/i.test(ua) || isiPadOS,
      samsung: /SamsungBrowser/i.test(ua),
      android: /Android/i.test(ua),
    };
  }, []);

  useEffect(() => {
    setInstalled(
      window.matchMedia("(display-mode: standalone)").matches ||
        Boolean((navigator as Navigator & { standalone?: boolean }).standalone),
    );

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
      setHelp(false);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { updateViaCache: "none" })
        .then((registration) => {
          if (registration.waiting) setUpdateReady(true);
          registration.addEventListener("updatefound", () => {
            const worker = registration.installing;
            worker?.addEventListener("statechange", () => {
              if (worker.state === "installed" && navigator.serviceWorker.controller) setUpdateReady(true);
            });
          });
        })
        .catch(() => undefined);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed && !updateReady) return null;

  const canOfferInstall = Boolean(promptEvent) || platform.ios || platform.android;
  if (!canOfferInstall && !updateReady) return null;

  async function install() {
    if (promptEvent) {
      await promptEvent.prompt();
      const result = await promptEvent.userChoice;
      if (result.outcome === "accepted") setInstalled(true);
      setPromptEvent(null);
      return;
    }
    setHelp(true);
  }

  const helpText = platform.ios
    ? "Open Verifiedly in Safari, tap Share, then choose Add to Home Screen."
    : platform.samsung
      ? "Open the Samsung Internet menu, choose Add page to, then select Home screen."
      : "Open your browser menu and choose Install app or Add to Home screen.";

  return (
    <>
      <button
        type="button"
        onClick={updateReady ? () => window.location.reload() : install}
        className="fixed right-4 top-4 z-[100] inline-flex items-center gap-2 rounded-full border bg-background/95 px-4 py-2 text-sm font-medium shadow-lg backdrop-blur hover:bg-muted"
      >
        {updateReady ? <RefreshCw className="h-4 w-4" /> : <Download className="h-4 w-4" />}
        {updateReady ? "Update Verifiedly" : "Install Verifiedly"}
      </button>
      {help && (
        <div className="fixed inset-0 z-[110] grid place-items-center bg-black/55 p-4" onClick={() => setHelp(false)}>
          <div className="w-full max-w-sm rounded-3xl bg-background p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <h2 className="font-display text-2xl font-bold">Install Verifiedly</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{helpText}</p>
            <button type="button" className="mt-5 w-full rounded-xl bg-foreground px-4 py-3 text-sm font-medium text-background" onClick={() => setHelp(false)}>Got it</button>
          </div>
        </div>
      )}
    </>
  );
};

export default PwaInstallButton;
