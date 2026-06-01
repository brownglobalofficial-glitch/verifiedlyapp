import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/verifiedly-logo.webp";

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
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src={logo} alt="Verifiedly logo" className="h-6 sm:h-8 w-auto" />
        </Link>
        <div className="hidden md:flex items-center gap-8 font-body text-sm">
          <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
          <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
          <Link to="/explore" className="text-muted-foreground hover:text-foreground transition-colors">Explore</Link>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Mobile-only Explore link so the page is reachable on phones */}
          <Link
            to="/explore"
            className="md:hidden text-sm text-muted-foreground hover:text-foreground transition-colors px-1"
          >
            Explore
          </Link>
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
                <Button size="sm" className="h-8 px-3 text-xs sm:text-sm sm:h-9 sm:px-4">Get Started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
