import { motion } from "framer-motion";
import { BadgeCheck, BriefcaseBusiness, FileLock2, KeyRound, Share2, UserRound } from "lucide-react";

const features = [
  {
    icon: UserRound,
    title: "Official Profile",
    description: "A focused public identity page for an individual or organization—without posts or clutter.",
  },
  {
    icon: BriefcaseBusiness,
    title: "Structured Experience",
    description: "Present work, education, credentials, licenses, awards, and accomplishments in a consistent format.",
  },
  {
    icon: BadgeCheck,
    title: "Identity Verification",
    description: "Eligible adults can complete a separate Stripe-hosted ID and selfie check for a clearly labeled badge.",
  },
  {
    icon: FileLock2,
    title: "Private Documents",
    description: "Keep permitted professional credentials separate from the public profile in private storage.",
  },
  {
    icon: Share2,
    title: "Controlled Sharing",
    description: "Create expiring, revocable links for an individual professional credential when needed.",
  },
  {
    icon: KeyRound,
    title: "Sign in with Verifiedly",
    description: "Approved apps can request consented profile and identity-status data through OAuth 2.0.",
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
            A clearer way to establish who you are
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
            Built for individuals, athletes, businesses, clubs, and teams that need a professional profile they can share.
          </p>
        </motion.div>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
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
