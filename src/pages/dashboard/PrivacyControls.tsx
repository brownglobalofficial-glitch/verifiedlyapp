import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, AlertTriangle, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Flags = {
  trust_score_public: boolean;
  verified_socials_public: boolean;
  signal_breakdown_public: boolean;
  payout_status_public: boolean;
  trust_score_opt_out: boolean;
};

const DEFAULTS: Flags = {
  trust_score_public: true,
  verified_socials_public: true,
  signal_breakdown_public: true,
  payout_status_public: true,
  trust_score_opt_out: false,
};

const PrivacyControls = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [flags, setFlags] = useState<Flags>(DEFAULTS);
  const [socials, setSocials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { navigate("/login"); return; }
      const uid = session.user.id;
      setUserId(uid);
      const [{ data: p }, { data: vs }] = await Promise.all([
        supabase.from("profiles").select("trust_score_public,verified_socials_public,signal_breakdown_public,payout_status_public,trust_score_opt_out").eq("id", uid).maybeSingle() as any,
        (supabase.from("verified_socials" as any).select("*").eq("user_id", uid) as any),
      ]);
      if (p) setFlags({ ...DEFAULTS, ...(p as any) });
      setSocials(vs || []);
      setLoading(false);
    });
  }, [navigate]);

  const save = async (next: Partial<Flags>) => {
    if (!userId) return;
    const merged = { ...flags, ...next };
    setFlags(merged);
    const { error } = await supabase.from("profiles").update(next as any).eq("id", userId);
    if (error) {
      toast({ title: "Couldn't save", description: error.message, variant: "destructive" });
    }
  };

  const removeSocial = async (id: string) => {
    if (!userId) return;
    await (supabase.from("verified_socials" as any) as any).delete().eq("id", id);
    await (supabase.rpc as any)("recompute_trust_score", { _user_id: userId });
    setSocials(socials.filter(s => s.id !== id));
    toast({ title: "Removed", description: "Trust score recalculated." });
  };

  const optOut = async () => {
    if (!userId) return;
    await save({ trust_score_opt_out: true });
    await (supabase.rpc as any)("recompute_trust_score", { _user_id: userId });
    toast({ title: "Opted out", description: "Your Trust Score is hidden and set to 0." });
  };

  const optIn = async () => {
    if (!userId) return;
    await save({ trust_score_opt_out: false });
    await (supabase.rpc as any)("recompute_trust_score", { _user_id: userId });
    toast({ title: "Opted in", description: "Trust Score recalculated from your signals." });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Loading…</div>;

  const Row = ({ k, title, desc }: { k: keyof Flags; title: string; desc: string }) => (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <Switch
        checked={!!flags[k]}
        onCheckedChange={(v) => save({ [k]: v } as any)}
        disabled={flags.trust_score_opt_out}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to dashboard
        </Link>

        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight mb-2">Privacy controls</h1>
          <p className="text-sm text-muted-foreground">
            You own your verification data. Control exactly what appears on your public profile and
            verification page.
          </p>
        </div>

        <Card className="p-6 mb-6">
          <h2 className="font-display font-semibold mb-2">Public visibility</h2>
          <div className="divide-y divide-border">
            <Row k="trust_score_public" title="Show Trust Score on my profile" desc="The score pill next to your name on /username." />
            <Row k="signal_breakdown_public" title="Show signal breakdown" desc="The list of which signals you've completed on /verify/username." />
            <Row k="verified_socials_public" title="Show verified socials list" desc="The list of social handles you've verified." />
            <Row k="payout_status_public" title="Show payout-active indicator" desc="Lets visitors see whether Stripe payouts are enabled." />
          </div>
        </Card>

        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-display font-semibold">Verified socials</h2>
              <p className="text-xs text-muted-foreground">Remove a social anytime — your score will recalculate.</p>
            </div>
          </div>
          {socials.length === 0 ? (
            <p className="text-sm text-muted-foreground">No socials connected. Add some in <Link to="/dashboard/verification" className="underline">Verification</Link>.</p>
          ) : (
            <ul className="space-y-2">
              {socials.map(s => (
                <li key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                  <div>
                    <p className="text-sm font-medium capitalize">{s.platform} <span className="text-xs text-muted-foreground">· {s.verification_status}</span></p>
                    <p className="text-xs text-muted-foreground">@{s.handle}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeSocial(s.id)} aria-label="Remove">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-6 border-dashed">
          <div className="flex items-start gap-3 mb-3">
            <AlertTriangle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <h2 className="font-display font-semibold">Opt out of Trust Score entirely</h2>
              <p className="text-xs text-muted-foreground">
                Sets your score to 0, hides the badge from your profile and verification page.
                Your account and earnings stay fully active.
              </p>
            </div>
          </div>
          {flags.trust_score_opt_out ? (
            <Button variant="outline" onClick={optIn}>Opt back in to Trust Score</Button>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline">Opt out of Trust Score</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Opt out of Trust Score?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Your public verification page will say you've opted out. Fans, brands, and
                    partners won't see a trust pill on your profile. You can opt back in anytime.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={optOut}>Opt out</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </Card>
      </div>
    </div>
  );
};

export default PrivacyControls;