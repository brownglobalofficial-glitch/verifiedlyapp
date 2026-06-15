import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Crown, X } from "lucide-react";
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
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-4 tracking-tight">Keep more of what you earn</h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Free forever. The verified badge is always earned — never paid for. Upgrade only to drop your platform fee.
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
              {["Custom profile page", "Social links & bio", "Sell digital products & tips", "Earn the verified badge", "Basic analytics"].map(f => (
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
                "Lower 5% platform fee",
                "Subscription tiers",
                "Exclusive content for subscribers",
                "Advanced analytics",
                "Priority verification re-checks",
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

        {/* Fee comparison table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-16 max-w-5xl mx-auto"
        >
          <div className="text-center mb-8">
            <h3 className="text-2xl md:text-3xl font-display font-bold mb-2">Compare plans</h3>
            <p className="text-sm text-muted-foreground">See exactly what changes when you upgrade.</p>
          </div>
          <div className="rounded-2xl border border-border overflow-hidden bg-background">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary border-b border-border">
                    <th className="text-left font-display font-semibold p-4 w-2/5">Feature</th>
                    <th className="text-center font-display font-semibold p-4">Free</th>
                    <th className="text-center font-display font-semibold p-4">
                      <span className="inline-flex items-center gap-1">Pro <VerifiedBadge className="w-3.5 h-3.5" /></span>
                    </th>
                    <th className="text-center font-display font-semibold p-4">
                      <span className="inline-flex items-center gap-1">Elite <Crown className="w-3.5 h-3.5" /></span>
                    </th>
                  </tr>
                </thead>
                <tbody className="[&>tr]:border-b [&>tr]:border-border [&>tr:last-child]:border-0">
                  <tr>
                    <td className="p-4 font-medium">Monthly price</td>
                    <td className="p-4 text-center">$0</td>
                    <td className="p-4 text-center">$4.99</td>
                    <td className="p-4 text-center">$19.99</td>
                  </tr>
                  <tr className="bg-secondary/40">
                    <td className="p-4 font-medium">Platform fee on earnings</td>
                    <td className="p-4 text-center font-semibold">10%</td>
                    <td className="p-4 text-center font-semibold">5%</td>
                    <td className="p-4 text-center font-semibold">0%</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-muted-foreground">You keep on a $100 sale</td>
                    <td className="p-4 text-center text-muted-foreground">$90.00</td>
                    <td className="p-4 text-center text-muted-foreground">$95.00</td>
                    <td className="p-4 text-center text-muted-foreground">$100.00</td>
                  </tr>
                  {[
                    { f: "Custom profile & link-in-bio", free: true, pro: true, elite: true },
                    { f: "Sell digital products", free: true, pro: true, elite: true },
                    { f: "Tips & donations", free: true, pro: true, elite: true },
                    { f: "Verified badge (Trust Score ≥ 80)", free: true, pro: true, elite: true },
                    { f: "Subscription tiers & exclusive content", free: false, pro: true, elite: true },
                    { f: "Advanced analytics", free: false, pro: true, elite: true },
                    { f: "Priority verification re-checks", free: false, pro: true, elite: true },
                    { f: "Featured creator placement", free: false, pro: false, elite: true },
                    { f: "Custom profile themes", free: false, pro: false, elite: true },
                    { f: "Dedicated support", free: false, pro: false, elite: true },
                  ].map((row, i) => (
                    <tr key={row.f} className={i % 2 === 0 ? "" : "bg-secondary/40"}>
                      <td className="p-4">{row.f}</td>
                      <td className="p-4 text-center">{row.free ? <Check className="w-4 h-4 inline text-foreground" /> : <X className="w-4 h-4 inline text-muted-foreground/40" />}</td>
                      <td className="p-4 text-center">{row.pro ? <Check className="w-4 h-4 inline text-foreground" /> : <X className="w-4 h-4 inline text-muted-foreground/40" />}</td>
                      <td className="p-4 text-center">{row.elite ? <Check className="w-4 h-4 inline text-foreground" /> : <X className="w-4 h-4 inline text-muted-foreground/40" />}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-secondary border-t border-border">
                    <td className="p-4"></td>
                    <td className="p-4 text-center">
                      <Link to="/signup"><Button variant="outline" size="sm" className="w-full">Start free</Button></Link>
                    </td>
                    <td className="p-4 text-center">
                      <Link to="/signup"><Button size="sm" className="w-full">Go Pro</Button></Link>
                    </td>
                    <td className="p-4 text-center">
                      <Link to="/signup"><Button size="sm" className="w-full bg-foreground text-background hover:bg-foreground/90">Go Elite</Button></Link>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-4">
            Payments processed securely via Stripe. Standard Stripe processing fees apply on all plans.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default Pricing;
