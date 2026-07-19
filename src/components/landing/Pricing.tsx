import { Check, FolderLock, ShieldCheck, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import DocumentsComplianceNotice from "@/components/DocumentsComplianceNotice";

const plans = [
  {
    name: "Public profile",
    price: "$0",
    cadence: "forever",
    icon: UserRound,
    description: "Create one clear place for who you are, what you do, and where people can find you.",
    features: ["Personal or organization profile", "Work, education, and credentials", "Official website and social profiles", "Clean verifiedly.app handle"],
    cta: "Create profile",
    note: "No platform subscription",
  },
  {
    name: "Verifiedly Identity",
    price: "$9.99",
    cadence: "one time",
    icon: ShieldCheck,
    description: "Verify the identity of the account holder through a Stripe-hosted ID and selfie check.",
    features: ["Government ID authenticity check", "Selfie matched to the ID", "One retry when available", "Identity badge after approval"],
    cta: "Create profile to verify",
    note: "Available to adults 18+",
  },
  {
    name: "Verifiedly Documents",
    price: "$4.99",
    cadence: "per month",
    icon: FolderLock,
    description: "Keep professional credentials private and share them through controlled, expiring links.",
    features: ["Private PDF and image storage", "10 MB per credential", "Password-optional 24-hour links", "Revoke links anytime"],
    cta: "Create profile for Documents",
    note: "$39/year when billed annually",
  },
];

const Pricing = () => (
  <section className="px-4 py-14 sm:py-20">
    <div className="mx-auto max-w-6xl">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Simple pricing</p>
        <h2 className="mt-3 text-3xl font-display font-bold tracking-tight sm:text-4xl">Your profile is free. Pay only for what needs protection.</h2>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">Identity and private document storage are separate products. Buying either one does not verify every claim on a profile.</p>
      </div>

      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        {plans.map((plan, index) => (
          <Card key={plan.name} className={`flex rounded-3xl p-6 shadow-sm ${index === 1 ? "border-foreground" : "border-foreground/10"}`}>
            <div className="flex w-full flex-col">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-foreground text-background"><plan.icon className="h-5 w-5" /></div>
              <h3 className="mt-5 font-display text-xl font-bold">{plan.name}</h3>
              <p className="mt-3 text-4xl font-display font-bold">{plan.price}<span className="ml-1 text-sm font-normal text-muted-foreground">{plan.cadence}</span></p>
              <p className="mt-4 min-h-16 text-sm leading-relaxed text-muted-foreground">{plan.description}</p>
              <ul className="mt-5 flex-1 space-y-3 text-sm">
                {plan.features.map((feature) => <li key={feature} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0" /> {feature}</li>)}
              </ul>
              <Button asChild variant={index === 1 ? "default" : "outline"} className="mt-7 h-11 rounded-xl"><Link to="/signup">{plan.cta}</Link></Button>
              <p className="mt-3 text-center text-[11px] text-muted-foreground">{plan.note}</p>
            </div>
          </Card>
        ))}
      </div>

      <DocumentsComplianceNotice className="mx-auto mt-6 max-w-3xl text-left" />
    </div>
  </section>
);

export default Pricing;
