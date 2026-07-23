import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import LandingPricing from "@/components/landing/Pricing";
import logo from "@/assets/verifiedly-v-mark.png";

const Pricing = () => (
  <div className="min-h-screen bg-background">
    <Helmet>
      <title>Pricing · Verifiedly</title>
      <meta name="description" content="Create a free Verifiedly profile, upgrade to Pro, or order a Verifiedly Tap Card." />
      <link rel="canonical" href="https://verifiedly.app/pricing" />
      <meta property="og:title" content="Pricing · Verifiedly" />
      <meta property="og:description" content="Free official profiles, Verifiedly Pro, and personalized Verifiedly Tap Cards." />
      <meta property="og:url" content="https://verifiedly.app/pricing" />
    </Helmet>
    <nav className="border-b border-border h-16 flex items-center px-4">
      <div className="container mx-auto flex items-center gap-3">
        <Link to="/"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button></Link>
        <img src={logo} alt="Verifiedly" className="h-7 w-7 object-contain" />
        <span className="font-display font-semibold">Pricing</span>
      </div>
    </nav>
    <main>
      <LandingPricing />
    </main>
  </div>
);

export default Pricing;
