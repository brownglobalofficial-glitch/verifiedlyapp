import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, BadgeCheck } from "lucide-react";

const Hero = () => {
  return (
    <section className="pt-32 pb-20 px-4">
      <div className="container mx-auto text-center max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-secondary mb-8">
            <BadgeCheck className="w-4 h-4 text-pro" />
            <span className="text-sm font-medium text-muted-foreground">The creator monetization platform</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight leading-[1.1] mb-6">
            Monetize your
            <br />
            <span className="text-gradient">creativity.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 font-body">
            One link. All your content. Tips, subscriptions, digital products, 
            affiliates & sponsorships — all in one beautiful profile.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/signup">
              <Button size="lg" className="text-base px-8 h-12 gap-2">
                Start for free <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <a href="#features">
              <Button variant="outline" size="lg" className="text-base px-8 h-12">
                See how it works
              </Button>
            </a>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            Built for creators in Belize 🇧🇿 and worldwide 🌍
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-16 relative"
        >
          <div className="bg-secondary rounded-2xl border border-border p-8 md:p-12">
            <div className="grid grid-cols-3 gap-8 text-center">
              <div>
                <p className="text-3xl md:text-4xl font-display font-bold">10%</p>
                <p className="text-sm text-muted-foreground mt-1">Platform fee</p>
              </div>
              <div>
                <p className="text-3xl md:text-4xl font-display font-bold">0</p>
                <p className="text-sm text-muted-foreground mt-1">Monthly cost to start</p>
              </div>
              <div>
                <p className="text-3xl md:text-4xl font-display font-bold">∞</p>
                <p className="text-sm text-muted-foreground mt-1">Earning potential</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
