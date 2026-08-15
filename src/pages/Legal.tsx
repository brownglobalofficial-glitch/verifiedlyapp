import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import logo from "@/assets/verifiedly-logo.webp";
import { Card } from "@/components/ui/card";

const Legal = () => (
  <div className="min-h-screen bg-background">
    <Helmet>
      <title>About & Legal — Verifiedly by BrownGlobal Holdings LLC</title>
      <meta
        name="description"
        content="Verifiedly is owned and operated by BrownGlobal Holdings LLC. Company details, what identity verification means, billing descriptors and legal contacts."
      />
      <link rel="canonical" href="https://verifiedly.app/legal" />
      <meta property="og:title" content="About & Legal — Verifiedly" />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://verifiedly.app/legal" />
      <meta name="twitter:card" content="summary" />
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Verifiedly",
          url: "https://verifiedly.app",
          legalName: "BrownGlobal Holdings LLC",
          parentOrganization: { "@type": "Organization", name: "BrownGlobal Holdings LLC" },
          email: "support@verifiedly.app",
        })}
      </script>
    </Helmet>
    <header className="sticky top-0 z-40 flex h-14 items-center border-b border-border bg-background/80 px-4 backdrop-blur">
      <div className="container mx-auto flex max-w-3xl items-center justify-between">
        <Link to="/" className="flex items-center gap-2"><img src={logo} alt="Verifiedly" className="h-6" /></Link>
        <Link to="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3 w-3" /> Home</Link>
      </div>
    </header>
    <main className="container mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-4xl font-display font-bold tracking-tight">About Verifiedly</h1>
      <p className="mt-4 text-base leading-7 text-muted-foreground">
        Verifiedly is owned and operated by BrownGlobal Holdings LLC. Verifiedly gives people and organizations one
        verified identity profile they can share anywhere, and lets approved websites offer “Continue with Verifiedly”
        sign-in.
      </p>
      <Card className="mt-8 p-6">
        <h2 className="font-display font-semibold">Company</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
            <dt className="text-muted-foreground">Product</dt><dd>Verifiedly</dd>
          </div>
          <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
            <dt className="text-muted-foreground">Owner and operator</dt><dd>BrownGlobal Holdings LLC</dd>
          </div>
          <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
            <dt className="text-muted-foreground">Billing descriptor</dt><dd>VERIFIEDLY (BrownGlobal Holdings LLC)</dd>
          </div>
          <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
            <dt className="text-muted-foreground">Support and legal contact</dt>
            <dd><a className="underline" href="mailto:support@verifiedly.app">support@verifiedly.app</a></dd>
          </div>
        </dl>
      </Card>
      <Card className="mt-6 p-6">
        <h2 className="font-display font-semibold">What the verified badge means</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          The blue badge is earned only by completing a government-ID and selfie identity check through our identity
          verification provider. It is never granted by a subscription. Verifiedly confirms that an identity document
          matched the person who completed the check; it is not a background check, endorsement, credit decision or
          safety rating.
        </p>
      </Card>
      <Card className="mt-6 p-6">
        <h2 className="font-display font-semibold">Payments and billing</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          All charges — the annual Verifiedly Membership and identity verification — are processed by Stripe and
          billed by BrownGlobal Holdings LLC. The same wording appears at checkout, on receipts and in transactional
          email footers.
        </p>
      </Card>
      <Card className="mt-6 p-6">
        <h2 className="font-display font-semibold">Policies</h2>
        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          <Link className="underline" to="/terms">Terms of Service</Link>
          <Link className="underline" to="/privacy">Privacy Policy</Link>
          <Link className="underline" to="/refunds">Refunds</Link>
          <Link className="underline" to="/developers">Developers</Link>
        </div>
      </Card>
      <p className="mt-8 text-xs leading-5 text-muted-foreground">
        © 2026 BrownGlobal Holdings LLC. Verifiedly is owned and operated by BrownGlobal Holdings LLC. All rights reserved.
      </p>
    </main>
  </div>
);

export default Legal;