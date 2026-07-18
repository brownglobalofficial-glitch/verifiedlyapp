import { Check, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Pricing = () => (
  <section className="px-4 py-16 sm:py-24">
    <div className="mx-auto max-w-xl text-center">
      <h2 className="text-3xl font-display font-bold tracking-tight">Create your profile</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        There is currently no profile subscription or verification price to choose.
      </p>
      <div className="mt-8 rounded-2xl border p-6 text-left shadow-sm">
        <ul className="space-y-3 text-sm">
          {["Personal or organization profile", "Structured work, education, credentials, and projects", "Contact, social profiles, and important links"].map((feature) => (
            <li key={feature} className="flex items-center gap-2"><Check className="h-4 w-4" /> {feature}</li>
          ))}
        </ul>
        <Button asChild className="mt-6 w-full"><Link to="/signup">Create profile</Link></Button>
      </div>
      <div className="mt-5 flex items-start gap-3 rounded-xl bg-muted/50 p-4 text-left text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        <p>Verification enrollment is paused while Verifiedly finalizes the provider, privacy flow, badge meaning, and any future pricing.</p>
      </div>
    </div>
  </section>
);

export default Pricing;
