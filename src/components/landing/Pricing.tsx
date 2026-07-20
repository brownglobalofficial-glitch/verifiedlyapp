import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
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
            Free account. One-time fee to verify your identity. Optional Pro subscription if you monetize.
          </p>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-5 sm:gap-6 max-w-5xl mx-auto">
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
            <p className="text-sm text-muted-foreground mb-6">10% platform fee on earnings</p>
            <ul className="space-y-3 mb-8">
              {["Public profile + link-in-bio", "Sell digital products & accept tips", "Sign in with Verifiedly (OAuth)", "Basic analytics"].map(f => (
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

          {/* Verify */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="rounded-xl border-2 border-foreground p-8 relative hover:shadow-xl transition-shadow duration-300"
          >
            <div className="absolute -top-3 left-6 bg-foreground text-background px-3 py-1 rounded-full text-xs font-semibold">
              MOST POPULAR
            </div>
            <h3 className="text-xl font-display font-semibold mb-2">Identity Verification</h3>
            <p className="text-4xl font-display font-bold mb-1">$4.99<span className="text-lg text-muted-foreground font-normal"> once</span></p>
            <p className="text-sm text-muted-foreground mb-6">Blue checkmark, forever. Free with Pro.</p>
            <ul className="space-y-3 mb-8">
              {[
                "Government ID + selfie check",
                "Verified blue checkmark on your profile",
                "Real name on profile (optional)",
                "Age verification for partner apps",
                "Powered by Stripe Identity",
              ].map(f => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-[hsl(var(--success))]" />
                  {f}
                </li>
              ))}
            </ul>
            <Link to="/signup">
              <Button className="w-full">Get verified</Button>
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
              PRO
            </div>
            <h3 className="text-xl font-display font-semibold mb-2">Verifiedly Pro</h3>
            <p className="text-4xl font-display font-bold mb-1">$9.99<span className="text-lg opacity-60 font-normal">/mo</span></p>
            <p className="text-sm opacity-60 mb-6">3% platform fee (down from 10%) + free ID verification</p>
            <ul className="space-y-3 mb-8">
              {[
                "Everything in Free",
                "3% platform fee on every sale",
                "Free identity verification ($4.99 value)",
                "Paid subscription tiers + exclusive content",
                "Advanced analytics",
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

        {/* Fee comparison table */}
        <p className="text-center text-xs text-muted-foreground mt-10 max-w-2xl mx-auto">
          The verified badge is only granted through Stripe Identity — never for a Pro subscription.
          Payments processed by Stripe. Standard Stripe processing fees (~2.9% + 30¢) apply on sales.
          Identity verification fee is non-refundable once the ID scan runs.
        </p>
      </div>
    </section>
  );
};

export default Pricing;
