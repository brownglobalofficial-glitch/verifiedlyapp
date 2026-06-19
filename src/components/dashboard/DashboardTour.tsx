import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, ArrowRight, Sparkles, Link as LinkIcon, DollarSign, ShoppingBag } from "lucide-react";

const STORAGE_KEY = "verifiedly_dashboard_tour_v1";

const STEPS = [
  {
    icon: Sparkles,
    title: "Welcome to your dashboard",
    body: "This is home base. Your profile, payouts, status posts and purchases all live here. Takes ~30 seconds — or skip anytime.",
  },
  {
    icon: LinkIcon,
    title: "Make your profile yours",
    body: "Add a bio, links and theme under About / Links / Theme. Share verifiedly.app/your-username anywhere.",
  },
  {
    icon: DollarSign,
    title: "Get paid",
    body: "Open Monetization to enable tips, sell digital products, or launch subscription tiers with private perks like a Discord invite.",
  },
  {
    icon: ShoppingBag,
    title: "Find your purchases",
    body: "Anything you buy or subscribe to shows up under My purchases — with download links and active perks unlocked automatically.",
  },
];

export default function DashboardTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setOpen(true);
    } catch { /* ignore */ }
  }, []);

  const dismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch { /* ignore */ }
    setOpen(false);
  };

  if (!open) return null;
  const S = STEPS[step];
  const Icon = S.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 pointer-events-none">
      <Card className="pointer-events-auto w-full max-w-md p-4 shadow-2xl border-2 border-foreground/10 bg-background">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-foreground text-background flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="font-display font-semibold text-sm">{S.title}</p>
              <button
                onClick={dismiss}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Skip tour"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{S.body}</p>
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-1">
                {STEPS.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      i === step ? "w-5 bg-foreground" : "w-1.5 bg-muted"
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={dismiss} className="h-7 text-xs">
                  Skip
                </Button>
                <Button
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => (isLast ? dismiss() : setStep(step + 1))}
                >
                  {isLast ? "Got it" : "Next"} <ArrowRight className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}