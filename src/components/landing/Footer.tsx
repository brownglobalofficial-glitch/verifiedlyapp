import { Link } from "react-router-dom";
import logo from "@/assets/verifiedly-logo.webp";

const Footer = () => {
  return (
    <footer className="border-t border-border py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Verifiedly" className="h-6" />
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <Link to="/explore" className="hover:text-foreground transition-colors">Explore</Link>
            <Link to="/marketplace" className="hover:text-foreground transition-colors">Marketplace</Link>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 Verifiedly. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
