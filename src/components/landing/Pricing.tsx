import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { BadgeCheck, Check } from "lucide-react";
import { Link } from "react-router-dom";

const Pricing = () => {
  return (
    <section id="pricing" className="py-24 px-4">
      <div className="container mx-auto max-w-5xl">
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
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-xl border border-border p-8 hover:shadow-lg transition-shadow duration-300"
          >
            <h3 className="text-xl font-display font-semibold mb-2">Free</h3>
            <p className="text-4xl font-display font-bold mb-1">$0<span className="text-lg text-muted-foreground font-normal">/mo</span></p>
            <p className="text-sm text-muted-foreground mb-6">10% platform fee on earnings</p>
            <ul className="space-y-3 mb-8">
              {["Custom profile page", "Social links & bio", "Accept tips", "Sell digital products", "Basic analytics"].map(f => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-success" />
                  {f}
                </li>
              ))}
            </ul>
            <Link to="/signup">
              <Button variant="outline" className="w-full">Get Started</Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="rounded-xl border-2 border-foreground p-8 relative hover:shadow-xl transition-shadow duration-300"
          >
            <div className="absolute -top-3 left-6 badge-pro px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
              <BadgeCheck className="w-3 h-3" /> PRO
            </div>
            <h3 className="text-xl font-display font-semibold mb-2">Verifiedly Pro</h3>
            <p className="text-4xl font-display font-bold mb-1">$9.99<span className="text-lg text-muted-foreground font-normal">/mo</span></p>
            <p className="text-sm text-muted-foreground mb-6">5% platform fee on earnings</p>
            <ul className="space-y-3 mb-8">
              {[
                "Everything in Free",
                "Verification badge ✓",
                "Lower 5% platform fee",
                "Boosted digital products",
                "Priority support",
                "Subscription tiers",
                "Affiliate & sponsorship access",
                "Advanced analytics",
              ].map(f => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-success" />
                  {f}
                </li>
              ))}
            </ul>
            <Link to="/signup">
              <Button className="w-full">Go Pro</Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
