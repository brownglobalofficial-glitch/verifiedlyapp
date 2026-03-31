import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Heart, ShoppingBag, LogOut, Users, Download } from "lucide-react";
import VerifiedBadge from "@/components/VerifiedBadge";
import logo from "@/assets/verifiedly-logo.webp";
import type { User } from "@supabase/supabase-js";

const FanDashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [following, setFollowing] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate("/login"); return; }
      setUser(session.user);
      fetchFollowing(session.user.id);
    });
  }, [navigate]);

  const fetchFollowing = async (userId: string) => {
    const { data } = await supabase
      .from("followers")
      .select("creator_id, created_at")
      .eq("follower_id", userId);
    
    if (data && data.length > 0) {
      const creatorIds = data.map(f => f.creator_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", creatorIds);
      setFollowing(profiles || []);
    }
    setLoading(false);
  };

  const handleUnfollow = async (creatorId: string) => {
    if (!user) return;
    await supabase.from("followers").delete().eq("follower_id", user.id).eq("creator_id", creatorId);
    setFollowing(following.filter(f => f.id !== creatorId));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border h-16 flex items-center px-4">
        <div className="container mx-auto flex items-center justify-between">
          <Link to="/"><img src={logo} alt="Verifiedly" className="h-7" /></Link>
          <div className="flex items-center gap-3">
            <Link to="/explore">
              <Button variant="ghost" size="sm">Explore</Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleLogout}><LogOut className="w-4 h-4" /></Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto py-8 px-4 max-w-3xl">
        <h1 className="text-3xl font-display font-bold mb-2">My Dashboard</h1>
        <p className="text-muted-foreground mb-8">Track your purchases, subscriptions, and followed creators</p>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="p-4 text-center">
            <Users className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
            <p className="text-2xl font-display font-bold">{following.length}</p>
            <p className="text-xs text-muted-foreground">Following</p>
          </Card>
          <Card className="p-4 text-center">
            <ShoppingBag className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
            <p className="text-2xl font-display font-bold">0</p>
            <p className="text-xs text-muted-foreground">Purchases</p>
          </Card>
          <Card className="p-4 text-center">
            <Download className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
            <p className="text-2xl font-display font-bold">0</p>
            <p className="text-xs text-muted-foreground">Downloads</p>
          </Card>
        </div>

        <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
          <Heart className="w-5 h-5" /> Following
        </h2>
        {following.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">You're not following anyone yet.</p>
            <Link to="/explore"><Button>Explore Creators</Button></Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {following.map(creator => (
              <Card key={creator.id} className="p-4 flex items-center gap-4">
                <Link to={`/${creator.username}`}>
                  <Avatar className="w-12 h-12">
                    {creator.avatar_url ? <AvatarImage src={creator.avatar_url} /> : null}
                    <AvatarFallback className="font-display font-bold">
                      {creator.display_name?.[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/${creator.username}`}>
                    <p className="font-semibold text-sm flex items-center gap-1">
                      {creator.display_name}
                      {(creator.is_verified || creator.is_pro || creator.is_elite) && <VerifiedBadge className="w-3.5 h-3.5" />}
                    </p>
                    <p className="text-xs text-muted-foreground">@{creator.username}</p>
                  </Link>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleUnfollow(creator.id)}>
                  Unfollow
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FanDashboard;
