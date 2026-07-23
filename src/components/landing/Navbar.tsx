import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/verifiedly-v-mark.png";

const Navbar = () => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto flex items-center justify-between h-14 sm:h-16 px-3 sm:px-4 gap-2">
        <Link to="/" className="flex items-center gap-2 shrink-0" aria-label="Verifiedly home">
          <img src={logo} alt="Verifiedly" className="h-7 w-7 object-contain" />
          <span className="font-display text-sm font-bold tracking-tight sm:text-base">Verifiedly</span>
        </Link>
        <div className="hidden md:flex items-center gap-8 font-body text-sm">
          <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
          <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {user ? (
            <Link to="/dashboard">
              <Button size="sm" className="h-8 px-3 text-xs sm:text-sm sm:h-9 sm:px-4">Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link to="/login" className="hidden xs:inline-flex sm:inline-flex">
                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs sm:text-sm sm:h-9 sm:px-3">Log in</Button>
              </Link>
              <Link to="/signup">
                <Button size="sm" className="h-8 px-3 text-xs sm:text-sm sm:h-9 sm:px-4">Create profile</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
