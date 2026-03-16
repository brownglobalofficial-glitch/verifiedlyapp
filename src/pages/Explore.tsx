import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BadgeCheck, Search, ShoppingBag } from "lucide-react";
import Navbar from "@/components/landing/Navbar";

const Explore = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [creators, setCreators] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"products" | "creators">("products");

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: prods }, { data: profs }] = await Promise.all([
        supabase.from("products").select("*, profiles(username, display_name, is_pro)").eq("is_published", true).limit(50),
        supabase.from("profiles").select("*").limit(50),
      ]);
      setProducts(prods || []);
      setCreators(profs || []);
    };
    fetchData();
  }, []);

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  );
  const filteredCreators = creators.filter(c =>
    c.display_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.username?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto pt-24 pb-12 px-4 max-w-5xl">
        <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">Explore</h1>
        <p className="text-muted-foreground mb-6">Discover creators and digital products</p>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>

        <div className="flex gap-2 mb-6">
          <button onClick={() => setTab("products")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "products" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
            Products
          </button>
          <button onClick={() => setTab("creators")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "creators" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
            Creators
          </button>
        </div>

        {tab === "products" ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map(product => (
              <Card key={product.id} className="p-4 card-hover">
                <ShoppingBag className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="font-semibold text-sm">{product.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{product.description?.slice(0, 50)}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="font-display font-bold">${product.price}</span>
                  {product.profiles && (
                    <Link to={`/${product.profiles.username}`} className="text-xs text-muted-foreground hover:underline">
                      by {product.profiles.display_name}
                      {product.profiles.is_pro && <BadgeCheck className="w-3 h-3 inline ml-1 text-pro" />}
                    </Link>
                  )}
                </div>
              </Card>
            ))}
            {filteredProducts.length === 0 && <p className="col-span-full text-center text-muted-foreground py-12">No products found</p>}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredCreators.map(creator => (
              <Link key={creator.id} to={`/${creator.username}`}>
                <Card className="p-4 card-hover text-center">
                  <div className="w-16 h-16 rounded-full bg-secondary border border-border mx-auto mb-3 flex items-center justify-center text-xl font-display font-bold">
                    {creator.display_name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <p className="font-semibold text-sm flex items-center justify-center gap-1">
                    {creator.display_name}
                    {creator.is_pro && <BadgeCheck className="w-3 h-3 text-pro" />}
                  </p>
                  <p className="text-xs text-muted-foreground">@{creator.username}</p>
                </Card>
              </Link>
            ))}
            {filteredCreators.length === 0 && <p className="col-span-full text-center text-muted-foreground py-12">No creators found</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default Explore;
