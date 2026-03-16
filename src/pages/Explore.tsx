import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { BadgeCheck, Search, ShoppingBag, Image } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import { motion } from "framer-motion";

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "presets", label: "Presets" },
  { value: "templates", label: "Templates" },
  { value: "ebooks", label: "E-books" },
  { value: "courses", label: "Courses" },
  { value: "music", label: "Music" },
  { value: "art", label: "Art" },
  { value: "software", label: "Software" },
];

const Explore = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [creators, setCreators] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"creators" | "products">("products");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: prods }, { data: profs }] = await Promise.all([
        supabase.from("products").select("*, profiles(username, display_name, is_pro, avatar_url)").eq("is_published", true).limit(50),
        supabase.from("profiles").select("*").limit(50),
      ]);
      setProducts(prods || []);
      setCreators(profs || []);
    };
    fetchData();
  }, []);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === "all" || p.category === categoryFilter;
    return matchesSearch && matchesCat;
  });
  const filteredCreators = creators.filter(c =>
    c.display_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.username?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto pt-24 pb-12 px-4 max-w-5xl">
        <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">Explore</h1>
        <p className="text-muted-foreground mb-6">Discover creators and their digital products</p>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search creators or products..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>

        <div className="flex gap-2 mb-4">
          <button onClick={() => setTab("creators")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "creators" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
            Creators
          </button>
          <button onClick={() => setTab("products")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "products" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
            Products
          </button>
        </div>

        {tab === "products" && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
            {CATEGORIES.map(c => (
              <button
                key={c.value}
                onClick={() => setCategoryFilter(c.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${categoryFilter === c.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}

        {tab === "creators" ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredCreators.map((creator, i) => (
              <motion.div key={creator.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Link to={`/${creator.username}`}>
                  <Card className="p-4 card-hover text-center">
                    <Avatar className="w-16 h-16 mx-auto mb-3">
                      {creator.avatar_url ? <AvatarImage src={creator.avatar_url} alt={creator.display_name} /> : null}
                      <AvatarFallback className="text-xl font-display font-bold">
                        {creator.display_name?.[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <p className="font-semibold text-sm flex items-center justify-center gap-1">
                      {creator.display_name}
                      {creator.is_pro && <BadgeCheck className="w-3 h-3 text-pro" />}
                    </p>
                    <p className="text-xs text-muted-foreground">@{creator.username}</p>
                    {creator.bio && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{creator.bio}</p>}
                  </Card>
                </Link>
              </motion.div>
            ))}
            {filteredCreators.length === 0 && <p className="col-span-full text-center text-muted-foreground py-12">No creators found</p>}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product, i) => (
              <motion.div key={product.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Link to={product.profiles ? `/${product.profiles.username}` : "#"}>
                  <Card className="card-hover overflow-hidden">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-32 object-cover" />
                    ) : (
                      <div className="w-full h-32 bg-muted flex items-center justify-center">
                        <ShoppingBag className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="p-3">
                      <p className="font-semibold text-sm">{product.name}</p>
                      {product.category && <p className="text-xs text-muted-foreground capitalize">{product.category}</p>}
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-display font-bold">${product.price}</span>
                        {product.profiles && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            {product.profiles.display_name}
                            {product.profiles.is_pro && <BadgeCheck className="w-3 h-3 text-pro" />}
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
            {filteredProducts.length === 0 && <p className="col-span-full text-center text-muted-foreground py-12">No products found</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default Explore;
