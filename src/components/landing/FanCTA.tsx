import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingBag, Star, Video } from "lucide-react";

const FanCTA = () => {
  return (
    <section className="py-20 px-4 bg-secondary">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            For Fans & Customers
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
            Support your favourite creators
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Create a free fan account to follow creators, athletes, and businesses.
            Buy exclusive digital products, subscribe for premium content, 
            and tip profiles you love — all in one place.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-10">
          {[
            { icon: Heart, title: "Follow Pages", desc: "Follow your favourite profiles and get notified about new drops" },
            { icon: ShoppingBag, title: "Buy Products", desc: "Purchase exclusive digital products, downloads, courses, and more" },
            { icon: Star, title: "Subscribe", desc: "Get behind-the-scenes content, perks, and exclusive access" },
            { icon: Video, title: "Watch Content", desc: "Enjoy subscriber-only videos, live streams, and posts" },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center p-4 sm:p-6"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                <item.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-base sm:text-lg mb-2">{item.title}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <Link to="/signup">
            <Button size="lg" variant="outline" className="text-base px-8 h-12">
              Sign up as a Fan — it's free
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default FanCTA;
