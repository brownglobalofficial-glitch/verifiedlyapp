import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import VerifiedBadge from "@/components/VerifiedBadge";

const Pricing = () => {
  return (
    <section id="pricing" className="py-24 px-4">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">Simple pricing</h2>
          <p className="text-lg text-muted-foreground">Start free. Upgrade when you're ready.</p>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
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
              {["Custom profile page", "Social links & bio", "Sell digital products", "Basic analytics", "Marketplace access"].map(f => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-[hsl(var(--success))]" />
                  {f}
                </li>
              ))}
            </ul>
            <Link to="/signup">
              <Button variant="outline" className="w-full">Get Started</Button>
            </Link>
          </motion.div>

          {/* Pro */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="rounded-xl border-2 border-foreground p-8 relative hover:shadow-xl transition-shadow duration-300"
          >
            <div className="absolute -top-3 left-6 badge-pro px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
              <VerifiedBadge className="w-3 h-3" /> PRO
            </div>
            <h3 className="text-xl font-display font-semibold mb-2">Verifiedly Pro</h3>
            <p className="text-4xl font-display font-bold mb-1">$4.99<span className="text-lg text-muted-foreground font-normal">/mo</span></p>
            <p className="text-sm text-muted-foreground mb-6">5% platform fee on earnings</p>
            <ul className="space-y-3 mb-8">
              {[
                "Everything in Free",
                "Verification badge",
                "Lower 5% platform fee",
                "Boosted digital products",
                "Subscription tiers",
                "Sponsorship & affiliate access",
                "Advanced analytics",
                "Priority support",
              ].map(f => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-[hsl(var(--success))]" />
                  {f}
                </li>
              ))}
            </ul>
            <Link to="/signup">
              <Button className="w-full">Go Pro</Button>
            </Link>
          </motion.div>

          {/* Elite */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="rounded-xl border-2 border-foreground p-8 relative hover:shadow-xl transition-shadow duration-300 bg-foreground text-background"
          >
            <div className="absolute -top-3 left-6 bg-background text-foreground px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
              <Crown className="w-3 h-3" /> ELITE
            </div>
            <h3 className="text-xl font-display font-semibold mb-2">Verifiedly Elite</h3>
            <p className="text-4xl font-display font-bold mb-1">$19.99<span className="text-lg font-normal opacity-60">/mo</span></p>
            <p className="text-sm opacity-60 mb-6">0% platform fee on earnings</p>
            <ul className="space-y-3 mb-8">
              {[
                "Everything in Pro",
                "0% platform fees",
                "Featured creator placement",
                "Priority marketplace listings",
                "Custom profile themes",
                "Dedicated support",
                "Early access to new features",
                "Referral commission bonus",
              ].map(f => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4" />
                  {f}
                </li>
              ))}
            </ul>
            <Link to="/signup">
              <Button variant="outline" className="w-full border-background text-foreground bg-background hover:bg-background/90">Go Elite</Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
