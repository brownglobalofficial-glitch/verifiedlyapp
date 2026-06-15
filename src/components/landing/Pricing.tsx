import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { Link } from "react-router-dom";
import VerifiedBadge from "@/components/VerifiedBadge";

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
            Start free. Go Pro to drop the platform fee to zero. The verified badge is always earned — never paid for.
          </p>
        </motion.div>
        <div className="grid md:grid-cols-2 gap-5 sm:gap-6 max-w-3xl mx-auto">
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
              {["Public profile + link-in-bio", "Sell digital products & accept tips", "Earn the verified badge", "Basic analytics"].map(f => (
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
            <div className="absolute -top-3 left-6 bg-background text-foreground px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
              <VerifiedBadge className="w-3 h-3" /> PRO
            </div>
            <h3 className="text-xl font-display font-semibold mb-2">Verifiedly Pro</h3>
            <p className="text-4xl font-display font-bold mb-1">$9<span className="text-lg opacity-60 font-normal">/mo</span></p>
            <p className="text-sm opacity-60 mb-6">0% platform fee — keep 100% of your earnings</p>
            <ul className="space-y-3 mb-8">
              {[
                "Everything in Free",
                "0% platform fee on every sale",
                "Paid subscription tiers + exclusive content",
                "Advanced analytics",
                "Priority verification reviews",
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
          Payments processed by Stripe. Standard Stripe processing fees (~2.9% + 30¢) apply on all plans and are separate from Verifiedly's platform fee.
        </p>
      </div>
    </section>
  );
};

export default Pricing;
