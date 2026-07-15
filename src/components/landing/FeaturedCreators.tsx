import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import VerifiedBadge from "@/components/VerifiedBadge";
import { motion } from "framer-motion";

const FeaturedCreators = () => {
  const [creators, setCreators] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("*")
      .eq("is_featured", true)
      .limit(8)
      .then(({ data }) => setCreators(data || []));
  }, []);

  if (creators.length === 0) return null;

  return (
    <section className="py-20 px-4 bg-secondary">
      <div className="container mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">Featured Creators</h2>
          <p className="text-lg text-muted-foreground">Discover top creators on Verifiedly</p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {creators.map((creator, i) => (
            <motion.div
              key={creator.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <Link to={`/${creator.username}`}>
                <Card className="p-5 card-hover text-center">
                  <Avatar className="w-16 h-16 mx-auto mb-3">
                    {creator.avatar_url ? <AvatarImage src={creator.avatar_url} alt={creator.display_name} /> : null}
                    <AvatarFallback className="text-xl font-display font-bold">
                      {creator.display_name?.[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <p className="font-semibold text-sm flex items-center justify-center gap-1">
                    {creator.display_name}
                    {creator.id_verified && <VerifiedBadge className="w-4 h-4" />}
                  </p>
                  <p className="text-xs text-muted-foreground">@{creator.username}</p>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default FeaturedCreators;
