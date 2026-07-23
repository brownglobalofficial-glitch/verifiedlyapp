import { BadgeCheck, Check, CreditCard, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const plans = [
  {
    name: "Public profile",
    price: "$0",
    cadence: "forever",
    icon: UserRound,
    description: "One clean place for who you are, your work, and your links.",
    features: ["Individual or organization profile", "Work, education, and credentials", "Clean verifiedly.app handle", "Sign in with Verifiedly for other apps"],
    cta: "Create profile",
    note: "Free forever",
    href: "/signup",
  },
  {
    name: "Identity check",
    price: "$9.99",
    cadence: "one time",
    icon: ShieldCheck,
    description: "Government ID and selfie verification via Stripe Identity. Earns the verified badge.",
    features: ["Government ID authenticity check", "Selfie matched to the ID", "Verified badge on your profile", "Free with Verifiedly Pro"],
    cta: "Get verified",
    note: "Available to adults 18+",
    href: "/signup",
  },
  {
    name: "Verifiedly Pro",
    price: "$9.99",
    cadence: "per month",
    icon: Sparkles,
    description: "Free identity check included, plus 20% off the Verifiedly Tap card and priority support.",
    features: ["Verified badge included", "20% off Verifiedly Tap ($12)", "Priority verification support", "Cancel anytime"],
    cta: "Start Pro monthly",
    note: "Or $99/yr — includes a free Tap card",
    href: "/signup?plan=pro",
  },
  {
    name: "Verifiedly Tap",
    price: "$19",
    cadence: "one time",
    icon: CreditCard,
    description: "An NFC card that shares your Verifiedly profile with a tap. Perfect for handing out.",
    features: ["NFC-enabled PVC card", "Shows your handle and title", "$12 with Verifiedly Pro", "Free with the annual Pro plan"],
    cta: "Order Tap card",
    note: "Ships from the U.S.",
    href: "/dashboard/tap-card",
  },
];

const Pricing = () => (
  <section className="px-4 py-14 sm:py-20">
    <div className="mx-auto max-w-6xl">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Simple pricing</p>
        <h2 className="mt-3 text-3xl font-display font-bold tracking-tight sm:text-4xl">Your profile is free. Verification and the Tap card are optional.</h2>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">The verified badge is earned only through a Stripe Identity check. Pro includes that check for free.</p>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan, index) => (
          <Card key={plan.name} className={`flex rounded-3xl p-6 shadow-sm ${index === 2 ? "border-foreground" : "border-foreground/10"}`}>
            <div className="flex w-full flex-col">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-foreground text-background"><plan.icon className="h-5 w-5" /></div>
              <h3 className="mt-5 font-display text-xl font-bold">{plan.name}</h3>
              <p className="mt-3 text-4xl font-display font-bold">{plan.price}<span className="ml-1 text-sm font-normal text-muted-foreground">{plan.cadence}</span></p>
              <p className="mt-4 min-h-16 text-sm leading-relaxed text-muted-foreground">{plan.description}</p>
              <ul className="mt-5 flex-1 space-y-3 text-sm">
                {plan.features.map((feature) => <li key={feature} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0" /> {feature}</li>)}
              </ul>
              <Button asChild variant={index === 2 ? "default" : "outline"} className="mt-7 h-11 rounded-xl"><Link to={plan.href}>{plan.cta}</Link></Button>
              <p className="mt-3 text-center text-[11px] text-muted-foreground">{plan.note}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  </section>
);

export default Pricing;
