import { motion } from "framer-motion";
import { Link2, DollarSign, ShoppingBag, Users, BadgeCheck, Megaphone } from "lucide-react";

const features = [
  {
    icon: Link2,
    title: "Link in Bio",
    description: "Your custom profile page with all your social links, bio, and content in one place.",
  },
  {
    icon: DollarSign,
    title: "Tips & Donations",
    description: "Let fans support you directly with tips via Stripe. Get paid instantly to your bank account.",
  },
  {
    icon: Users,
    title: "Subscriptions",
    description: "Create recurring subscription tiers for exclusive content and perks.",
  },
  {
    icon: ShoppingBag,
    title: "Digital Products",
    description: "Sell e-books, presets, templates, courses, and more on your profile.",
  },
  {
    icon: Megaphone,
    title: "Sponsorships & Affiliates",
    description: "Get matched with brand deals and earn affiliate commissions.",
  },
  {
    icon: BadgeCheck,
    title: "Verifiedly Pro",
    description: "Get verified, lower fees, and boost your digital products on the platform.",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const Features = () => {
  return (
    <section id="features" className="py-24 px-4 bg-secondary">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
            Everything you need to earn
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            One platform, every revenue stream. Built specifically for creators.
          </p>
        </motion.div>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className="bg-background rounded-xl border border-border p-6 card-hover group"
            >
              <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-display font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
