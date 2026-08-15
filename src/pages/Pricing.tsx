import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import LandingPricing from "@/components/landing/Pricing";
import logo from "@/assets/verifiedly-v-mark.png";

const Pricing = () => (
  <div className="min-h-screen bg-background">
    <Helmet>
      <title>Membership · Verifiedly</title>
      <meta name="description" content="Create a free official profile, or join Verifiedly Membership for $50 per year for eligible-adult Stripe Identity verification and the verified badge after approval." />
      <link rel="canonical" href="https://verifiedly.app/pricing" />
      <meta property="og:title" content="Verifiedly Membership — $50 per year" />
      <meta property="og:description" content="Free official profiles and one annual Verifiedly Membership with identity verification access and the verified badge after approval." />
      <meta property="og:url" content="https://verifiedly.app/pricing" />
    </Helmet>
    <nav className="border-b border-border h-16 flex items-center px-4">
      <div className="container mx-auto flex items-center gap-3">
        <Link to="/"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button></Link>
        <img src={logo} alt="Verifiedly" className="h-7 w-7 object-contain" />
        <span className="font-display font-semibold">Membership</span>
      </div>
    </nav>
    <main><LandingPricing /></main>
  </div>
);

export default Pricing;
