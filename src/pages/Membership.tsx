import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import VerifiedBadge from "@/components/VerifiedBadge";
import MembershipTiers, { Tier, Perk } from "@/components/MembershipTiers";

const Membership = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [profile, setProfile] = useState<any>(null);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [perks, setPerks] = useState<Record<string, Perk[]>>({});
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadingTierId, setLoadingTierId] = useState<string | null>(null);

  useEffect(() => {
    if (!username) return;
    (async () => {
      const { data: prof } = await supabase
        .from("profiles").select("*").eq("username", username.toLowerCase()).maybeSingle();
      if (!prof) { setNotFound(true); setLoading(false); return; }
      const { data: hasPayments } = await (supabase.rpc as any)("creator_has_payments", { _creator_id: prof.id });
      setProfile({ ...prof, has_payments: !!hasPayments });

      const { data: subs } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("creator_id", prof.id)
        .eq("is_active", true)
        .order("price", { ascending: true });
      setTiers(subs || []);

      if (subs && subs.length > 0) {
        const ids = subs.map(s => s.id);
        const [{ data: allPerks }, { data: events }] = await Promise.all([
          supabase.from("subscription_perks").select("*").in("subscription_id", ids).order("sort_order", { ascending: true }),
          supabase.from("subscriber_events").select("subscription_id, event_type").in("subscription_id", ids),
        ]);
        const grouped: Record<string, Perk[]> = {};
        (allPerks || []).forEach((p: any) => {
          if (!grouped[p.subscription_id]) grouped[p.subscription_id] = [];
          grouped[p.subscription_id].push(p);
        });
        setPerks(grouped);

        const counts: Record<string, number> = {};
        (events || []).forEach((e: any) => {
          if (!e.subscription_id) return;
          counts[e.subscription_id] = (counts[e.subscription_id] || 0) + (e.event_type === "subscribe" ? 1 : -1);
        });
        Object.keys(counts).forEach(k => { if (counts[k] < 0) counts[k] = 0; });
        setMemberCounts(counts);
      }
      setLoading(false);
    })();
  }, [username]);

  const handleSubscribe = async (tier: Tier, interval: "month" | "year") => {
    if (!profile?.has_payments) {
      toast({ title: "Not available", description: "This creator hasn't set up payments yet.", variant: "destructive" });
      return;
    }
    setLoadingTierId(tier.id);
    try {
      const { data, error } = await supabase.functions.invoke("create-subscription-checkout", {
        body: { subscriptionId: tier.id, creatorId: profile.id, interval },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to start subscription", variant: "destructive" });
    }
    setLoadingTierId(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="max-w-5xl mx-auto px-4">
          <Skeleton className="w-40 h-5 mb-8" />
          <div className="text-center space-y-3">
            <Skeleton className="w-20 h-20 rounded-full mx-auto" />
            <Skeleton className="w-48 h-6 mx-auto" />
            <Skeleton className="w-72 h-4 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
            <Skeleton className="h-80 rounded-2xl" />
            <Skeleton className="h-80 rounded-2xl" />
            <Skeleton className="h-80 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <h1 className="text-2xl font-display font-bold">Creator not found</h1>
        <Link to="/"><Button variant="outline">Go home</Button></Link>
      </div>
    );
  }

  const isVerified = profile?.is_verified || profile?.is_pro || profile?.is_elite;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <Link
          to={`/${username}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back to profile
        </Link>

        <div className="text-center mb-10">
          <Avatar className="w-20 h-20 mx-auto mb-4 ring-4 ring-background shadow-md">
            {profile?.avatar_url ? <AvatarImage src={profile.avatar_url} alt={profile.display_name} /> : null}
            <AvatarFallback className="text-2xl font-display font-bold bg-muted">
              {(profile?.display_name || username)?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <h1 className="text-3xl md:text-4xl font-display font-bold flex items-center justify-center gap-2">
            Become a member
            <Sparkles className="w-6 h-6 text-primary" />
          </h1>
          <p className="text-muted-foreground mt-2 flex items-center justify-center gap-1.5">
            Support <span className="font-semibold text-foreground inline-flex items-center gap-1">
              {profile?.display_name || username}
              {isVerified && <VerifiedBadge className="w-4 h-4" />}
            </span>
            and unlock exclusive perks
          </p>
        </div>

        {tiers.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">This creator hasn't set up memberships yet.</p>
            <Link to={`/${username}`}>
              <Button variant="outline" className="mt-4">Back to profile</Button>
            </Link>
          </div>
        ) : (
          <MembershipTiers
            tiers={tiers}
            perks={perks}
            memberCounts={memberCounts}
            onSubscribe={handleSubscribe}
            loadingTierId={loadingTierId}
            variant="full"
          />
        )}

        <p className="text-center text-xs text-muted-foreground mt-12">
          Cancel anytime. Annual plan saves you 2 months. Powered by{" "}
          <Link to="/" className="hover:text-foreground transition-colors">Verifiedly</Link>.
        </p>
        <p className="text-center text-xs text-muted-foreground mt-3">
          By subscribing you agree to our{" "}
          <Link to="/terms" className="underline hover:text-foreground">Terms</Link>{" "}
          and{" "}
          <Link to="/refunds" className="underline hover:text-foreground">Refund Policy</Link>.
          The creator is the merchant of record for memberships.
        </p>
      </div>
    </div>
  );
};

export default Membership;
