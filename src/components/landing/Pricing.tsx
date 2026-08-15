import { BadgeCheck, Check, Crown, ShieldCheck, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const plans = [
  {
    name: "Verifiedly Free",
    price: "$0",
    cadence: "forever",
    icon: UserRound,
    description: "Create and share one official profile for a person or organization.",
    features: [
      "Unique verifiedly.app handle",
      "Photo, banner and profile themes",
      "Title, location, socials and contact details",
      "Work and education sections",
      "Link sharing, QR, save-contact card and Verifiedly sign-in",
    ],
    cta: "Create free profile",
    note: "No payment card required",
    href: "/signup",
    featured: false,
  },
  {
    name: "Verifiedly Membership",
    price: "$50",
    cadence: "per year",
    icon: Crown,
    description: "The annual identity membership for people and organizations that need a verified official profile.",
    features: [
      "Stripe Identity verification access for eligible adults",
      "Identity Verified badge after successful verification",
      "Organization verification for business profiles",
      "Profile view analytics as available",
      "Priority account support",
    ],
    cta: "Join Membership",
    note: "$50 today · renews annually at $50 until canceled",
    href: "/signup?returnTo=%2Fdashboard%2Fmembership",
    featured: true,
  },
];

const Pricing = () => (
  <section className="overflow-x-hidden px-3 py-12 sm:px-4 sm:py-20">
    <div className="mx-auto w-full max-w-5xl">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Simple pricing</p>
        <h2 className="mt-3 break-words text-3xl font-display font-bold tracking-tight sm:text-4xl">Free to create. $50 a year to be verified.</h2>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">The badge is never guaranteed. It appears only after a successful Stripe Identity check.</p>
      </div>

      <div className="mx-auto mt-10 grid min-w-0 max-w-4xl gap-4 md:grid-cols-2">
        {plans.map((plan) => (
          <Card key={plan.name} className={`flex min-w-0 rounded-3xl p-5 shadow-sm sm:p-7 ${plan.featured ? "border-2 border-foreground" : "border-foreground/10"}`}>
            <div className="flex min-w-0 w-full flex-col">
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-foreground text-background"><plan.icon className="h-5 w-5" /></div>
                {plan.featured && <span className="shrink-0 rounded-full bg-foreground px-3 py-1 text-[10px] font-semibold text-background">Annual Membership</span>}
              </div>
              <h3 className="mt-5 break-words font-display text-xl font-bold">{plan.name}</h3>
              <p className="mt-3 flex flex-wrap items-baseline gap-1 break-words text-4xl font-display font-bold">{plan.price}<span className="text-sm font-normal text-muted-foreground">{plan.cadence}</span></p>
              <p className="mt-4 min-h-16 break-words text-sm leading-relaxed text-muted-foreground">{plan.description}</p>
              <ul className="mt-5 flex-1 space-y-3 text-sm">
                {plan.features.map((feature) => <li key={feature} className="flex min-w-0 items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0" /><span className="break-words">{feature}</span></li>)}
              </ul>
              <Button asChild variant={plan.featured ? "default" : "outline"} className="mt-7 min-h-11 w-full whitespace-normal rounded-xl px-3 py-2 text-center"><Link to={plan.href}>{plan.cta}</Link></Button>
              <p className="mt-3 break-words text-center text-[11px] leading-relaxed text-muted-foreground">{plan.note}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="mx-auto mt-8 grid max-w-4xl gap-3 sm:grid-cols-2">
        <div className="flex min-w-0 items-start gap-3 rounded-2xl border bg-muted/25 p-4 text-xs leading-relaxed text-muted-foreground"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-foreground" /><p>Stripe Identity verification is available to eligible adult members. Failed or incomplete verification does not qualify for the Identity Verified badge.</p></div>
        <div className="flex min-w-0 items-start gap-3 rounded-2xl border bg-muted/25 p-4 text-xs leading-relaxed text-muted-foreground"><BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-foreground" /><p>The badge confirms the supported identity check. It does not verify work, education, organization authority, licensing or every profile claim.</p></div>
      </div>

      <p className="mt-5 text-center text-xs text-muted-foreground">Verifiedly is operated by BrownGlobal Holdings LLC.</p>
    </div>
  </section>
);

export default Pricing;
