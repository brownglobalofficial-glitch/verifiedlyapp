import { Link } from "react-router-dom";
import logo from "@/assets/verifiedly-logo.webp";

const Footer = () => {
  return (
    <footer className="border-t border-border py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col items-center gap-6 text-center md:flex-row md:items-start md:justify-between md:text-left">
          <div className="flex flex-col items-center gap-3 md:items-start">
            <img src={logo} alt="Verifiedly logo" className="h-6" />
            <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
              Verifiedly is operated by BrownGlobal Holdings LLC.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link to="/refunds" className="hover:text-foreground transition-colors">Refunds</Link>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 BrownGlobal Holdings LLC. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;