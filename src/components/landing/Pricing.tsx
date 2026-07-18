import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

const Pricing = () => {
  return (
    <section id="pricing" className="py-16 sm:py-24 px-4">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-16"
        >
          <span className="inline-block px-3 py-1 rounded-full border border-border text-xs font-medium text-muted-foreground mb-4">Pricing</span>
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-4 tracking-tight">Simple, honest pricing</h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Two plans. One optional identity check. No hidden surprises.
          </p>
        </motion.div>
        <div className="grid md:grid-cols-2 gap-5 sm:gap-6 max-w-4xl mx-auto">
          {/* Free */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-xl border border-border p-8 hover:shadow-lg transition-shadow duration-300"
          >
            <h3 className="text-xl font-display font-semibold mb-2">Free</h3>
            <p className="text-4xl font-display font-bold mb-1">$0<span className="text-lg text-muted-foreground font-normal">/mo</span></p>
            <p className="text-sm text-muted-foreground mb-6">Public verified profile + link-in-bio</p>
            <ul className="space-y-3 mb-8">
              {["Identity-first public profile", "Link-in-bio + custom sections", "Sign in with Verifiedly (OAuth)", "Basic profile analytics"].map(f => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-[hsl(var(--success))]" />
                  {f}
                </li>
              ))}
            </ul>
            <Link to="/signup">
              <Button variant="outline" className="w-full">Start free</Button>
            </Link>
          </motion.div>

          {/* Pro */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="rounded-xl border-2 border-foreground p-8 relative hover:shadow-xl transition-shadow duration-300 bg-foreground text-background"
          >
            <div className="absolute -top-3 left-6 bg-background text-foreground px-3 py-1 rounded-full text-xs font-semibold">
              MOST COMPLETE
            </div>
            <h3 className="text-xl font-display font-semibold mb-2">Verifiedly Pro</h3>
            <p className="text-4xl font-display font-bold mb-1">$4.99<span className="text-lg opacity-60 font-normal">/mo</span></p>
            <p className="text-sm opacity-60 mb-6">Document vault, custom domain, more</p>
            <ul className="space-y-3 mb-8">
              {[
                "Everything in Free",
                "Private document vault (diplomas, licenses, certs)",
                "Custom domain on your profile",
                "Advanced profile analytics",
                "Priority support",
              ].map(f => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4" />
                  {f}
                </li>
              ))}
            </ul>
            <Link to="/signup">
              <Button variant="outline" className="w-full border-background text-foreground bg-background hover:bg-background/90">Go Pro</Button>
            </Link>
          </motion.div>
        </div>

        {/* Identity verification add-on */}
        <div className="mt-10 max-w-4xl mx-auto rounded-xl border border-border bg-secondary/40 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="font-display font-semibold text-sm">Identity Verification · $12.99 per attempt</p>
            <p className="text-xs text-muted-foreground mt-1">
              One government-ID + selfie check via Stripe Identity. The fee purchases a verification attempt — not a guaranteed badge.
            </p>
          </div>
          <Link to="/signup"><Button size="sm" variant="outline">Verify identity</Button></Link>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6 max-w-2xl mx-auto">
          The badge is granted only when a Stripe Identity check succeeds, and remains while the account
          stays eligible and in good standing (re-verification may be required). Pro does not grant a badge.
        </p>
      </div>
    </section>
  );
};

export default Pricing;
