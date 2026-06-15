import { ReactNode, useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import DashboardSidebar from "./DashboardSidebar";
import TrustScore from "@/components/TrustScore";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

export default function DashboardShell({ children, title }: { children: ReactNode; title?: string }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState<string | undefined>();
  const [score, setScore] = useState(0);
  const [isElite, setIsElite] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate("/login"); return; }
      supabase.from("profiles").select("username, trust_score, is_elite").eq("id", session.user.id).maybeSingle()
        .then(({ data }) => {
          if (data) {
            setUsername(data.username || undefined);
            setScore(data.trust_score || 0);
            setIsElite(!!data.is_elite);
          }
        });
    });
  }, [navigate]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar username={username} />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b border-border flex items-center justify-between px-4 sticky top-0 bg-background/80 backdrop-blur-md z-30">
            <div className="flex items-center gap-2 min-w-0">
              <SidebarTrigger />
              {title && <h1 className="font-display font-semibold text-sm md:text-base truncate">{title}</h1>}
            </div>
            <div className="flex items-center gap-2">
              <Link to="/dashboard/verification" aria-label="Trust score">
                <TrustScore score={score} isElite={isElite} size="sm" />
              </Link>
              {username && (
                <a href={`/${username}`} target="_blank" rel="noreferrer">
                  <Button variant="outline" size="sm" className="gap-1">
                    <ExternalLink className="w-3 h-3" /> <span className="hidden sm:inline">Preview</span>
                  </Button>
                </a>
              )}
            </div>
          </header>
          <main className="flex-1 overflow-x-hidden">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}