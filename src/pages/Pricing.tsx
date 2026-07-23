import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import LandingPricing from "@/components/landing/Pricing";
import logo from "@/assets/verifiedly-logo.webp";

const Pricing = () => (
  <div className="min-h-screen bg-background">
    <Helmet>
      <title>Free profiles, Verifiedly Pro, and Tap Cards · Verifiedly</title>
      <meta name="description" content="Create a free official profile, use Continue with Verifiedly, and explore Pro identity-verification eligibility, support, analytics, and NFC Tap Card benefits." />
      <link rel="canonical" href="https://verifiedly.app/pricing" />
      <meta property="og:title" content="Free profiles, Verifiedly Pro, and Tap Cards" />
      <meta property="og:description" content="Official profiles and connected-app sign-in stay free. Pro adds trust, support, analytics, and Tap Card benefits." />
      <meta property="og:url" content="https://verifiedly.app/pricing" />
    </Helmet>
    <nav className="border-b border-border h-16 flex items-center px-4">
      <div className="container mx-auto flex items-center gap-3">
        <Link to="/"><Button variant="ghost" size="sm" aria-label="Back to Verifiedly"><ArrowLeft className="w-4 h-4" /></Button></Link>
        <img src={logo} alt="Verifiedly" className="h-7" />
        <span className="font-display font-semibold">Pricing</span>
      </div>
    </nav>
    <main>
      <LandingPricing />
    </main>
  </div>
);

export default Pricing;
