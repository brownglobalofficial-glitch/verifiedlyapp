import { BadgeCheck, Check, ShieldCheck, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const plans = [
  {
    name: "Verifiedly Profile",
    price: "$0",
    cadence: "forever",
    icon: UserRound,
    description: "Create and share one professional identity profile.",
    features: [
      "Unique verifiedly.app handle",
      "Name, photo and professional title",
      "Work and education",
      "Contact details, website and social links",
      "Profile sharing, QR and Continue with Verifiedly",
    ],
    cta: "Create free profile",
    note: "No payment card required",
    href: "/signup",
    featured: false,
  },
  {
    name: "Identity Verification",
    price: "$9.99",
    cadence: "one time",
    icon: ShieldCheck,
    description: "Verify your identity through Stripe Identity and earn the Identity Verified badge after successful verification.",
    features: [
      "One-time checkout — no Verifiedly subscription",
      "Secure Stripe Identity verification",
      "Identity Verified badge after successful verification",
      "Verification status stays with your Verifiedly profile",
      "Your work and education remain separate profile claims",
    ],
    cta: "Get Identity Verified",
    note: "$9.99 one time · badge is issued only after successful verification",
    href: "/signup?returnTo=%2Fdashboard%2Fverification",
    featured: true,
  },
];

const Pricing = () => (
  <section className="overflow-x-hidden px-3 py-12 sm:px-4 sm:py-20">
    <div className="mx-auto w-full max-w-5xl">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Simple pricing</p>
        <h2 className="mt-3 break-words text-3xl font-display font-bold tracking-tight sm:text-4xl">Free profile. Verify once for $9.99.</h2>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">Verifiedly does not require a subscription to create or keep your professional identity profile.</p>
      </div>

      <div className="mx-auto mt-10 grid min-w-0 max-w-4xl gap-4 md:grid-cols-2">
        {plans.map((plan) => (
          <Card key={plan.name} className={`flex min-w-0 rounded-3xl p-5 shadow-sm sm:p-7 ${plan.featured ? "border-2 border-foreground" : "border-foreground/10"}`}>
            <div className="flex min-w-0 w-full flex-col">
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-foreground text-background"><plan.icon className="h-5 w-5" /></div>
                {plan.featured && <span className="shrink-0 rounded-full bg-foreground px-3 py-1 text-[10px] font-semibold text-background">One-time</span>}
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
        <div className="flex min-w-0 items-start gap-3 rounded-2xl border bg-muted/25 p-4 text-xs leading-relaxed text-muted-foreground"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-foreground" /><p>Stripe Identity performs the supported identity check. Verifiedly receives the result and does not ordinarily store copies of the ID or selfie used in the Stripe flow.</p></div>
        <div className="flex min-w-0 items-start gap-3 rounded-2xl border bg-muted/25 p-4 text-xs leading-relaxed text-muted-foreground"><BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-foreground" /><p>The Identity Verified badge confirms identity only. It does not verify employment, education, organization authority, licensing or every profile claim.</p></div>
      </div>

      <p className="mt-5 text-center text-xs text-muted-foreground">Verifiedly is operated by BrownGlobal Holdings LLC.</p>
    </div>
  </section>
);

export default Pricing;
