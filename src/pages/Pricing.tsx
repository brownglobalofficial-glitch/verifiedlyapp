import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import LandingPricing from "@/components/landing/Pricing";
import logo from "@/assets/verifiedly-v-mark.png";

const Pricing = () => (
  <div className="min-h-screen bg-background">
    <Helmet>
      <title>Identity Verification · Verifiedly</title>
      <meta name="description" content="Create a free Verifiedly professional profile and optionally complete one-time $9.99 Stripe Identity verification for the Identity Verified badge after successful verification." />
      <link rel="canonical" href="https://verifiedly.app/pricing" />
      <meta property="og:title" content="Verifiedly — Free Profile + $9.99 Identity Verification" />
      <meta property="og:description" content="Create your professional identity for free. Verify your identity once for $9.99 through Stripe Identity." />
      <meta property="og:url" content="https://verifiedly.app/pricing" />
    </Helmet>
    <nav className="border-b border-border h-16 flex items-center px-4">
      <div className="container mx-auto flex items-center gap-3">
        <Link to="/"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button></Link>
        <img src={logo} alt="Verifiedly" className="h-7 w-7 object-contain" />
        <span className="font-display font-semibold">Verification</span>
      </div>
    </nav>
    <main><LandingPricing /></main>
  </div>
);

export default Pricing;
