import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import LandingPricing from "@/components/landing/Pricing";
import logo from "@/assets/verifiedly-logo.webp";

const Pricing = () => (
  <div className="min-h-screen bg-background">
    <Helmet>
      <title>Pricing · Verifiedly</title>
      <meta name="description" content="Create and share a Verifiedly official profile for free. Optional Stripe Identity verification is $12.99 per attempt." />
      <link rel="canonical" href="https://verifiedly.app/pricing" />
      <meta property="og:title" content="Pricing · Verifiedly" />
      <meta property="og:description" content="Free official profiles with an optional $12.99 identity check." />
      <meta property="og:url" content="https://verifiedly.app/pricing" />
    </Helmet>
    <nav className="border-b border-border h-16 flex items-center px-4">
      <div className="container mx-auto flex items-center gap-3">
        <Link to="/"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button></Link>
        <img src={logo} alt="Verifiedly Logo" className="h-7" />
        <span className="font-display font-semibold">Pricing</span>
      </div>
    </nav>
    <main>
      <LandingPricing />
    </main>
  </div>
);

export default Pricing;
