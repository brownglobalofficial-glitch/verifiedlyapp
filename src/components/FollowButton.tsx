import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Heart, HeartOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FollowButtonProps {
  creatorId: string;
  className?: string;
}

const FollowButton = ({ creatorId, className }: FollowButtonProps) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUserId(session.user.id);
        checkFollowing(session.user.id);
      }
    });
  }, [creatorId]);

  const checkFollowing = async (uid: string) => {
    const { data } = await supabase
      .from("followers")
      .select("id")
      .eq("follower_id", uid)
      .eq("creator_id", creatorId)
      .maybeSingle();
    setIsFollowing(!!data);
  };

  const handleToggle = async () => {
    if (!userId) {
      toast({
        title: "Create a free fan account",
        description: "Sign up in seconds to follow this creator.",
      });
      navigate(`/signup?type=fan&returnTo=${encodeURIComponent(location.pathname)}`);
      return;
    }
    if (userId === creatorId) return;
    
    setLoading(true);
    if (isFollowing) {
      await supabase.from("followers").delete().eq("follower_id", userId).eq("creator_id", creatorId);
      setIsFollowing(false);
    } else {
      await supabase.from("followers").insert({ follower_id: userId, creator_id: creatorId });
      setIsFollowing(true);
    }
    setLoading(false);
  };

  if (userId === creatorId) return null;

  return (
    <Button
      variant={isFollowing ? "outline" : "default"}
      size="sm"
      onClick={handleToggle}
      disabled={loading}
      className={`gap-1.5 ${className || ""}`}
    >
      {isFollowing ? <HeartOff className="w-3.5 h-3.5" /> : <Heart className="w-3.5 h-3.5" />}
      {isFollowing ? "Following" : "Follow"}
    </Button>
  );
};

export default FollowButton;
