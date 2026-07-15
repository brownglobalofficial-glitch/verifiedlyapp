import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import VerifiedBadge from "@/components/VerifiedBadge";

const Hero = () => {
  return (
    <section className="pt-24 sm:pt-32 pb-16 sm:pb-20 px-4 overflow-hidden">
      <div className="container mx-auto text-center max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-secondary mb-8"
          >
            <VerifiedBadge className="w-4 h-4" />
            <span className="text-sm font-medium text-muted-foreground">Real ID verified · powered by Stripe Identity</span>
          </motion.div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-display font-bold tracking-tight leading-[1.15] mb-6">
            Prove you're real.
            <br />
            <motion.span
              className="text-gradient inline-block pb-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              Once. Everywhere.
            </motion.span>
          </h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 font-body"
          >
            Verify your identity once with your government ID. Get a checkmark that works
            on your profile, your links, and any app that supports Sign in with Verifiedly.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/signup">
              <Button size="lg" className="text-base px-8 h-12 gap-2">
                Get verified <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <a href="#pricing">
              <Button variant="outline" size="lg" className="text-base px-8 h-12">
                See pricing
              </Button>
            </a>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-6 text-sm text-muted-foreground"
          >
            Free account · $5.99 one-time to verify · No subscription required
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.5, type: "spring", bounce: 0.3 }}
          className="mt-16 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background z-10 pointer-events-none" />
          <div className="bg-secondary rounded-2xl border border-border p-6 sm:p-8 md:p-12">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 text-center">
              {[
                { value: "$5.99", label: "One-time to verify" },
                { value: "Gov ID", label: "Real identity check" },
                { value: "<2 min", label: "To complete scan" },
                { value: "Stripe", label: "Identity + payouts" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 + i * 0.15 }}
                >
                  <p className="text-2xl sm:text-3xl md:text-4xl font-display font-bold tracking-tight">{stat.value}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
