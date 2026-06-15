import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Search, ShoppingBag, Users, Video, TrendingUp, SlidersHorizontal, X, Crown, Star, Flame } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import VerifiedBadge from "@/components/VerifiedBadge";
import Navbar from "@/components/landing/Navbar";
import { motion } from "framer-motion";
import { GridSkeleton } from "@/components/PageSkeleton";

const PRODUCT_CATEGORIES = [
  { value: "all", label: "All" },
  { value: "presets", label: "Presets" },
  { value: "templates", label: "Templates" },
  { value: "ebooks", label: "E-books" },
  { value: "courses", label: "Courses" },
  { value: "music", label: "Music" },
  { value: "art", label: "Art" },
  { value: "software", label: "Software" },
  { value: "gaming", label: "Gaming" },
  { value: "fitness", label: "Fitness" },
];

type Tab = "creators" | "products" | "subscriptions";
type SortOption = "newest" | "popular" | "price_low" | "price_high" | "name";

const Explore = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [creators, setCreators] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<Tab>("creators");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [creatorCategoryFilter, setCreatorCategoryFilter] = useState("all");
  const [sort, setSort] = useState<SortOption>("popular");
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<"all" | "free" | "under5" | "under25" | "over25">("all");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  const showTrending = !search && !verifiedOnly && priceRange === "all" &&
    categoryFilter === "all" && creatorCategoryFilter === "all";

  const trendingCreators = [...creators]
    .sort((a, b) => {
      const aVerified = (a.trust_score || 0) >= 80 && !a.trust_score_opt_out;
      const bVerified = (b.trust_score || 0) >= 80 && !b.trust_score_opt_out;
      if (aVerified !== bVerified) return aVerified ? -1 : 1;
      if (aVerified && bVerified) return (b.trust_score || 0) - (a.trust_score || 0);
      return (b.follower_count || 0) - (a.follower_count || 0);
    })
    .slice(0, 6);

  const featuredCreators = creators.filter(c => c.is_featured);

  const bestSellingProducts = [...products].slice(0, 6);
  useEffect(() => {
    const fetchData = async () => {
      const [{ data: prods }, { data: profs }, { data: subs }] = await Promise.all([
        supabase.from("products")
          .select("*, profiles(username, display_name, avatar_url, trust_score, trust_score_opt_out)")
          .eq("is_published", true).limit(100),
        supabase.from("profiles")
          .select("*")
          .limit(100),
        supabase.from("subscriptions")
          .select("*, profiles(username, display_name, avatar_url, category, trust_score, trust_score_opt_out)")
          .eq("is_active", true).limit(100),
      ]);
      setProducts(prods || []);
      setCreators(profs || []);
      setSubscriptions(subs || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const matchesPrice = (price: number) => {
    if (priceRange === "all") return true;
    if (priceRange === "free") return price === 0;
    if (priceRange === "under5") return price > 0 && price < 5;
    if (priceRange === "under25") return price >= 5 && price < 25;
    if (priceRange === "over25") return price >= 25;
    return true;
  };

  const filteredProducts = products
    .filter(p => {
      const matchesSearch = p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase());
      const matchesCat = categoryFilter === "all" || p.category === categoryFilter;
      const matchesP = matchesPrice(p.price);
      const isProfileVerified = (p.profiles?.trust_score || 0) >= 80 && !p.profiles?.trust_score_opt_out;
      const matchesVerified = !verifiedOnly || isProfileVerified;
      return matchesSearch && matchesCat && matchesP && matchesVerified;
    })
    .sort((a, b) => {
      if (sort === "price_low") return a.price - b.price;
      if (sort === "price_high") return b.price - a.price;
      if (sort === "name") return (a.name || "").localeCompare(b.name || "");
      if (sort === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return 0; // popular = default order
    });

  const filteredCreators = creators
    .filter(c => {
      const matchesSearch = c.display_name?.toLowerCase().includes(search.toLowerCase()) ||
        c.username?.toLowerCase().includes(search.toLowerCase()) ||
        c.bio?.toLowerCase().includes(search.toLowerCase());
      const matchesCat = creatorCategoryFilter === "all" || c.category === creatorCategoryFilter;
      const isCreatorVerified = (c.trust_score || 0) >= 80 && !c.trust_score_opt_out;
      const matchesVerified = !verifiedOnly || isCreatorVerified;
      return matchesSearch && matchesCat && matchesVerified;
    })
    .sort((a, b) => {
      if (sort === "popular") {
        const aVerified = (a.trust_score || 0) >= 80 && !a.trust_score_opt_out;
        const bVerified = (b.trust_score || 0) >= 80 && !b.trust_score_opt_out;
        if (aVerified !== bVerified) return aVerified ? -1 : 1;
        if (aVerified && bVerified) return (b.trust_score || 0) - (a.trust_score || 0);
        return (b.follower_count || 0) - (a.follower_count || 0);
      }
      if (sort === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sort === "name") return (a.display_name || "").localeCompare(b.display_name || "");
      return 0;
    });

  const filteredSubscriptions = subscriptions
    .filter(s => {
      const matchesSearch = s.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.description?.toLowerCase().includes(search.toLowerCase()) ||
        s.profiles?.display_name?.toLowerCase().includes(search.toLowerCase());
      const matchesP = matchesPrice(s.price);
      const isSubProfileVerified = (s.profiles?.trust_score || 0) >= 80 && !s.profiles?.trust_score_opt_out;
      const matchesVerified = !verifiedOnly || isSubProfileVerified;
      return matchesSearch && matchesP && matchesVerified;
    })
    .sort((a, b) => {
      if (sort === "price_low") return a.price - b.price;
      if (sort === "price_high") return b.price - a.price;
      if (sort === "name") return (a.name || "").localeCompare(b.name || "");
      if (sort === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return 0;
    });

  const activeFilters = [
    priceRange !== "all" ? "price" : null,
    verifiedOnly ? "verified" : null,
    (tab === "products" && categoryFilter !== "all") ? "category" : null,
    (tab === "creators" && creatorCategoryFilter !== "all") ? "category" : null,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setCategoryFilter("all");
    setCreatorCategoryFilter("all");
    setPriceRange("all");
    setVerifiedOnly(false);
    setSearch("");
  };

  const tabs: { key: Tab; label: string; icon: React.ElementType; count: number }[] = [
    { key: "creators", label: "Profiles", icon: Users, count: filteredCreators.length },
    { key: "products", label: "Products", icon: ShoppingBag, count: filteredProducts.length },
    { key: "subscriptions", label: "Subscriptions", icon: Video, count: filteredSubscriptions.length },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto pt-24 pb-12 px-4 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">Explore</h1>
          <p className="text-muted-foreground">Discover people, digital products, and subscription content</p>
        </div>

        {/* Search + Filter Bar */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={
                tab === "creators" ? "Search profiles by name, username, or bio..." :
                tab === "products" ? "Search products by name or description..." :
                "Search subscriptions..."
              }
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
            {search && (
              <button onClick={() => setSearch("")} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>
          <Button
            variant={showFilters ? "default" : "outline"}
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            aria-label={showFilters ? "Hide filters" : "Show filters"}
            aria-expanded={showFilters}
            className="shrink-0 relative"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {activeFilters > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
                {activeFilters}
              </span>
            )}
          </Button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-4 rounded-xl border border-border bg-secondary/50"
          >
            <div className="flex flex-wrap gap-4 items-end">
              <div className="min-w-[140px]">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Sort by</label>
                <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popular">Most Popular</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                    {tab !== "creators" && <SelectItem value="price_low">Price: Low → High</SelectItem>}
                    {tab !== "creators" && <SelectItem value="price_high">Price: High → Low</SelectItem>}
                    <SelectItem value="name">Name A–Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {tab !== "creators" && (
                <div className="min-w-[140px]">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Price range</label>
                  <Select value={priceRange} onValueChange={(v: any) => setPriceRange(v)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any price</SelectItem>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="under5">Under $5</SelectItem>
                      <SelectItem value="under25">$5 – $25</SelectItem>
                      <SelectItem value="over25">$25+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setVerifiedOnly(!verifiedOnly)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    verifiedOnly ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <VerifiedBadge className="w-3.5 h-3.5" /> Verified only
                </button>
              </div>

              {activeFilters > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs gap-1">
                  <X className="w-3 h-3" /> Clear all
                </Button>
              )}
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-border">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{t.label}</span>
              <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">{t.count}</span>
            </button>
          ))}
        </div>

        {/* Category chips */}
        {tab === "products" && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-none">
            {PRODUCT_CATEGORIES.map(c => (
              <button
                key={c.value}
                onClick={() => setCategoryFilter(c.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                  categoryFilter === c.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}

        {/* Trending & Featured Sections */}
        {showTrending && tab === "creators" && (trendingCreators.length > 0 || featuredCreators.length > 0) && (
          <div className="space-y-8 mb-8">
            {/* Featured Creators */}
            {featuredCreators.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-display font-bold">Featured</h2>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                  {featuredCreators.map((creator) => (
                    <Link key={creator.id} to={`/${creator.username}`} className="shrink-0 w-36">
                      <Card className="p-4 card-hover text-center h-full border-primary/20 bg-primary/5">
                        <Crown className="w-4 h-4 text-primary mx-auto mb-2" />
                        <Avatar className="w-14 h-14 mx-auto mb-2">
                          {creator.avatar_url ? <AvatarImage src={creator.avatar_url} alt={creator.display_name} /> : null}
                          <AvatarFallback className="text-lg font-display font-bold">
                            {creator.display_name?.[0]?.toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <p className="font-semibold text-xs flex items-center justify-center gap-1 truncate">
                          {creator.display_name}
                          {(creator.is_verified || creator.is_pro || creator.is_elite) && <VerifiedBadge className="w-3 h-3" />}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">@{creator.username}</p>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Trending Creators */}
            {trendingCreators.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Flame className="w-5 h-5 text-destructive" />
                  <h2 className="text-lg font-display font-bold">Trending</h2>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                  {trendingCreators.map((creator, i) => (
                    <Link key={creator.id} to={`/${creator.username}`} className="shrink-0 w-36">
                      <Card className="p-4 card-hover text-center h-full relative">
                        <span className="absolute top-2 left-2 text-xs font-bold text-muted-foreground">#{i + 1}</span>
                        <Avatar className="w-14 h-14 mx-auto mb-2">
                          {creator.avatar_url ? <AvatarImage src={creator.avatar_url} alt={creator.display_name} /> : null}
                          <AvatarFallback className="text-lg font-display font-bold">
                            {creator.display_name?.[0]?.toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <p className="font-semibold text-xs flex items-center justify-center gap-1 truncate">
                          {creator.display_name}
                          {(creator.is_verified || creator.is_pro || creator.is_elite) && <VerifiedBadge className="w-3 h-3" />}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{creator.follower_count || 0} followers</p>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {showTrending && tab === "products" && bestSellingProducts.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-display font-bold">Popular Products</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              {bestSellingProducts.map((product) => (
                <Link key={product.id} to={product.profiles ? `/${product.profiles.username}` : "#"} className="shrink-0 w-44">
                  <Card className="card-hover overflow-hidden h-full">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-24 object-cover" />
                    ) : (
                      <div className="w-full h-24 bg-muted flex items-center justify-center">
                        <ShoppingBag className="w-6 h-6 text-muted-foreground/40" />
                      </div>
                    )}
                    <div className="p-2.5">
                      <p className="font-semibold text-xs line-clamp-1">{product.name}</p>
                      <p className="font-display font-bold text-sm mt-1">
                        {product.price === 0 ? "Free" : `$${product.price}`}
                      </p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {loading && <GridSkeleton count={8} />}
        {!loading && tab === "creators" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredCreators.map((creator, i) => (
              <motion.div key={creator.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                <Link to={`/${creator.username}`}>
                  <Card className="p-4 card-hover text-center h-full">
                    <Avatar className="w-16 h-16 mx-auto mb-3">
                      {creator.avatar_url ? <AvatarImage src={creator.avatar_url} alt={creator.display_name} /> : null}
                      <AvatarFallback className="text-xl font-display font-bold">
                        {creator.display_name?.[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <p className="font-semibold text-sm flex items-center justify-center gap-1">
                      {creator.display_name}
                      {(creator.is_verified || creator.is_pro || creator.is_elite) && <VerifiedBadge className="w-3.5 h-3.5" />}
                    </p>
                    <p className="text-xs text-muted-foreground">@{creator.username}</p>
                    {creator.category && (
                      <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground capitalize">
                        {creator.category}
                      </span>
                    )}
                    {(creator.follower_count || 0) > 0 && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                        <Users className="w-3 h-3" /> {creator.follower_count}
                      </p>
                    )}
                  </Card>
                </Link>
              </motion.div>
            ))}
            {filteredCreators.length === 0 && (
              <div className="col-span-full text-center py-16">
                <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-muted-foreground font-medium">No creators found</p>
                <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or search term</p>
              </div>
            )}
          </div>
        )}

        {!loading && tab === "products" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product, i) => (
              <motion.div key={product.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                <Link to={product.profiles ? `/${product.profiles.username}` : "#"}>
                  <Card className="card-hover overflow-hidden h-full">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-32 sm:h-36 object-cover" />
                    ) : (
                      <div className="w-full h-32 sm:h-36 bg-muted flex items-center justify-center">
                        <ShoppingBag className="w-8 h-8 text-muted-foreground/40" />
                      </div>
                    )}
                    <div className="p-3">
                      <p className="font-semibold text-sm line-clamp-1">{product.name}</p>
                      {product.category && <p className="text-xs text-muted-foreground capitalize">{product.category}</p>}
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-display font-bold">
                          {product.price === 0 ? "Free" : `$${product.price}`}
                        </span>
                        {product.profiles && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1 truncate ml-2">
                            {product.profiles.display_name}
                            {(product.profiles.is_verified || product.profiles.is_pro || product.profiles.is_elite) && (
                              <VerifiedBadge className="w-3 h-3 shrink-0" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-full text-center py-16">
                <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-muted-foreground font-medium">No products found</p>
                <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or search term</p>
              </div>
            )}
          </div>
        )}

        {!loading && tab === "subscriptions" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSubscriptions.map((sub, i) => (
              <motion.div key={sub.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                <Link to={sub.profiles ? `/${sub.profiles.username}` : "#"}>
                  <Card className="p-5 card-hover h-full">
                    <div className="flex items-start justify-between mb-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-display font-semibold text-lg">{sub.name}</p>
                        {sub.profiles && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                            by {sub.profiles.display_name}
                            {(sub.profiles.is_verified || sub.profiles.is_pro || sub.profiles.is_elite) && (
                              <VerifiedBadge className="w-3.5 h-3.5" />
                            )}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p className="font-display font-bold text-xl">${sub.price}</p>
                        <p className="text-xs text-muted-foreground">/month</p>
                      </div>
                    </div>
                    {sub.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{sub.description}</p>
                    )}
                    {sub.features && sub.features.length > 0 && (
                      <ul className="space-y-1">
                        {sub.features.slice(0, 4).map((f: string, idx: number) => (
                          <li key={idx} className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-primary shrink-0" /> {f}
                          </li>
                        ))}
                        {sub.features.length > 4 && (
                          <li className="text-xs text-muted-foreground">+{sub.features.length - 4} more</li>
                        )}
                      </ul>
                    )}
                    {sub.profiles?.category && (
                      <span className="inline-block mt-3 px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground capitalize">
                        {sub.profiles.category}
                      </span>
                    )}
                  </Card>
                </Link>
              </motion.div>
            ))}
            {filteredSubscriptions.length === 0 && (
              <div className="col-span-full text-center py-16">
                <Video className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-muted-foreground font-medium">No subscriptions found</p>
                <p className="text-sm text-muted-foreground mt-1">Creators can set up subscription tiers from their dashboard</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Explore;
