import { BadgeCheck, Check, CreditCard, ShieldCheck, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const plans = [
  {
    name: "Verifiedly Free",
    price: "$0",
    cadence: "forever",
    icon: UserRound,
    description: "Create an official profile and use one Verifiedly account across approved connected apps.",
    features: [
      "Quick personal or organization profile",
      "Work, education, credentials, and accomplishments",
      "Unique verifiedly.app handle and QR code",
      "Continue with Verifiedly OAuth/OpenID Connect",
    ],
    cta: "Create free profile",
    href: "/signup",
    note: "Identity is not automatically verified.",
  },
  {
    name: "Pro Monthly",
    price: "$5.99",
    cadence: "per month",
    icon: ShieldCheck,
    description: "Add trust, support, analytics, advanced profile tools, and better Tap Card pricing.",
    features: [
      "Adult identity-verification eligibility",
      "Identity Verified badge after successful review",
      "Priority support",
      "Profile and Tap Card analytics",
      "Discounted PVC and metal Tap Cards",
    ],
    cta: "Choose monthly Pro",
    href: "/signup?next=/dashboard/pro",
    note: "Payment does not guarantee a badge.",
  },
  {
    name: "Pro Annual",
    price: "$49.99",
    cadence: "per year",
    icon: BadgeCheck,
    description: "Everything in Pro, billed yearly, with one standard PVC Tap Card credit.",
    features: [
      "All monthly Pro features",
      "One PVC Tap Card credit per initial annual enrollment",
      "Standard U.S. shipping charged when claimed",
      "Optional metal upgrade for an additional charge",
      "Manage billing through Stripe",
    ],
    cta: "Choose annual Pro",
    href: "/signup?next=/dashboard/pro",
    note: "The included card is a non-payment profile card.",
  },
  {
    name: "Verifiedly Tap Cards",
    price: "$24.99",
    cadence: "planned from",
    icon: CreditCard,
    description: "Personalized NFC and QR cards that open the owner's live Verifiedly profile.",
    features: [
      "PVC NFC card planned from $24.99 for Free users",
      "PVC card planned at $14.99 for active Pro users",
      "Premium metal option after sample approval",
      "Lost-card disabling and aggregate tap counts",
      "Not a payment card or government ID",
    ],
    cta: "View Tap Cards",
    href: "/signup?next=/dashboard/cards",
    note: "Paid ordering opens only after supplier testing and approval.",
  },
];

const Pricing = () => (
  <section className="px-4 py-14 sm:py-20">
    <div className="mx-auto max-w-6xl">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Simple pricing</p>
        <h2 className="mt-3 text-3xl font-display font-bold tracking-tight sm:text-4xl">Your official profile and secure sign-in stay free.</h2>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">Pro adds identity-verification eligibility, support, analytics, and Tap Card benefits. Identity verification is powered by Stripe and a badge appears only after the check succeeds.</p>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan, index) => (
          <Card key={plan.name} className={`flex rounded-3xl p-6 shadow-sm ${index === 2 ? "border-2 border-foreground" : "border-foreground/10"}`}>
            <div className="flex w-full flex-col">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-foreground text-background"><plan.icon className="h-5 w-5" /></div>
              <h3 className="mt-5 font-display text-xl font-bold">{plan.name}</h3>
              <p className="mt-3 text-4xl font-display font-bold">{plan.price}<span className="ml-1 text-sm font-normal text-muted-foreground">{plan.cadence}</span></p>
              <p className="mt-4 min-h-20 text-sm leading-relaxed text-muted-foreground">{plan.description}</p>
              <ul className="mt-5 flex-1 space-y-3 text-sm">
                {plan.features.map((feature) => <li key={feature} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0" /> {feature}</li>)}
              </ul>
              <Button asChild variant={index === 2 ? "default" : "outline"} className="mt-7 h-11 rounded-xl"><Link to={plan.href}>{plan.cta}</Link></Button>
              <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground">{plan.note}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="mx-auto mt-7 max-w-3xl rounded-2xl border border-dashed p-5 text-xs leading-relaxed text-muted-foreground">
        Verifiedly Pro is a profile, trust, support, analytics, and sharing plan—not a purchase of a guaranteed verification badge. Identity verification is limited to eligible adults. Physical Tap Cards share a live public profile and do not store money, government-ID data, or private credentials.
      </div>
    </div>
  </section>
);

export default Pricing;
