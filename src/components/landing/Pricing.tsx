import { BadgeCheck, Check, CreditCard, Sparkles, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const plans = [
  {
    name: "Verifiedly Free",
    price: "$0",
    cadence: "forever",
    icon: UserRound,
    description: "Create your official profile and use Verifiedly to sign in to connected websites.",
    features: ["Individual or organization profile", "Work, education, credentials and accomplishments", "Unique verifiedly.app handle", "Continue with Verifiedly sign-in"],
    cta: "Create free profile",
    note: "No card required",
    href: "/signup",
    featured: false,
  },
  {
    name: "Verifiedly Pro",
    price: "$4.99",
    cadence: "per month",
    icon: Sparkles,
    description: "Advanced profile tools with identity-verification eligibility for supported adults.",
    features: ["Stripe Identity verification included", "Verification check after successful approval", "Profile and sharing analytics", "Tap Card member price: $19.99"],
    cta: "Start Verifiedly Pro",
    note: "Or $49.99 per year",
    href: "/signup?returnTo=%2Fdashboard%2Fpro",
    featured: true,
  },
  {
    name: "Verifiedly Tap",
    price: "$29.99",
    cadence: "one time",
    icon: CreditCard,
    description: "A personalized, non-payment PVC NFC card that opens your Verifiedly profile.",
    features: ["Locked Verifiedly front-and-back design", "Your name, professional title and handle", "Unique NFC and QR profile link", "$19.99 with active Verifiedly Pro"],
    cta: "Create Tap Card",
    note: "Initial U.S. fulfillment",
    href: "/dashboard/tap-card",
    featured: false,
  },
];

const Pricing = () => (
  <section className="px-4 py-14 sm:py-20">
    <div className="mx-auto max-w-6xl">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Simple pricing</p>
        <h2 className="mt-3 text-3xl font-display font-bold tracking-tight sm:text-4xl">Create for free. Upgrade when you need more trust and sharing tools.</h2>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">There is no separate $9.99 identity fee. Eligible adults with active Pro may complete Stripe Identity verification, and the verification check appears only after a successful result.</p>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.name} className={`flex rounded-3xl p-6 shadow-sm ${plan.featured ? "border-2 border-foreground" : "border-foreground/10"}`}>
            <div className="flex w-full flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-foreground text-background"><plan.icon className="h-5 w-5" /></div>
                {plan.featured && <span className="rounded-full bg-foreground px-3 py-1 text-[10px] font-semibold text-background">Most popular</span>}
              </div>
              <h3 className="mt-5 font-display text-xl font-bold">{plan.name}</h3>
              <p className="mt-3 text-4xl font-display font-bold">{plan.price}<span className="ml-1 text-sm font-normal text-muted-foreground">{plan.cadence}</span></p>
              <p className="mt-4 min-h-16 text-sm leading-relaxed text-muted-foreground">{plan.description}</p>
              <ul className="mt-5 flex-1 space-y-3 text-sm">
                {plan.features.map((feature) => <li key={feature} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0" /> {feature}</li>)}
              </ul>
              <Button asChild variant={plan.featured ? "default" : "outline"} className="mt-7 h-11 rounded-xl"><Link to={plan.href}>{plan.cta}</Link></Button>
              <p className="mt-3 text-center text-[11px] text-muted-foreground">{plan.note}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="mx-auto mt-8 flex max-w-3xl items-start gap-3 rounded-2xl border bg-muted/25 p-4 text-xs leading-relaxed text-muted-foreground">
        <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
        <p>Pro does not sell a badge. It provides access to the verification flow and other subscription features. The verification check is granted only after Stripe Identity successfully verifies the eligible adult account holder.</p>
      </div>
    </div>
  </section>
);

export default Pricing;
