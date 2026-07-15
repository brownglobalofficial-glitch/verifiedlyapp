import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Check, X, ShieldCheck } from "lucide-react";

const rows: { feature: string; verifiedly: string | boolean; linktree: string | boolean }[] = [
  { feature: "Government-ID verified profiles", verifiedly: true, linktree: false },
  { feature: "Blue verification badge (Stripe Identity)", verifiedly: "$4.99 one-time", linktree: false },
  { feature: "Platform fee on paid products", verifiedly: "3% on Pro (10% on Free)", linktree: "Varies" },
  { feature: "Tips, digital products & memberships", verifiedly: true, linktree: "Limited" },
  { feature: "Sign in with Verifiedly (OAuth for other apps)", verifiedly: true, linktree: false },
  { feature: "Free plan", verifiedly: "Yes — 10% fee", linktree: "Yes" },
  { feature: "Pro plan pricing", verifiedly: "$9.99 / month", linktree: "$5–$24 / month" },
  { feature: "Custom domain", verifiedly: true, linktree: "Paid tiers only" },
];

const Cell = ({ value }: { value: string | boolean }) => {
  if (value === true) return <Check className="w-5 h-5 text-foreground" aria-label="Included" />;
  if (value === false) return <X className="w-5 h-5 text-muted-foreground" aria-label="Not included" />;
  return <span className="text-sm text-foreground">{value}</span>;
};

const ComparisonLinktree = () => (
  <div className="min-h-screen bg-background py-12 px-4">
    <Helmet>
      <title>Verifiedly vs Linktree — Best Link in Bio Tools Compared</title>
      <meta name="description" content="Compare Verifiedly and Linktree side by side: government-ID verification, platform fees, memberships, and which link in bio tool is right for professional creators." />
      <link rel="canonical" href="https://verifiedly.app/comparison/verifiedly-vs-linktree" />
      <meta property="og:title" content="Verifiedly vs Linktree — Link in Bio Tools Compared" />
      <meta property="og:description" content="Government-ID verified profiles, lower platform fees, and built-in monetization — how Verifiedly stacks up against Linktree." />
      <meta property="og:url" content="https://verifiedly.app/comparison/verifiedly-vs-linktree" />
      <script type="application/ld+json">{JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "Verifiedly vs Linktree — Best Link in Bio Tools Compared",
        "author": { "@type": "Organization", "name": "BrownGlobal Holdings LLC" },
        "publisher": { "@type": "Organization", "name": "Verifiedly" },
      })}</script>
    </Helmet>

    <main className="max-w-3xl mx-auto">
      <Link to="/" className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block">← Back to home</Link>
      <h1 className="text-3xl sm:text-4xl font-display font-black tracking-tight text-foreground mb-3">
        Verifiedly vs Linktree
      </h1>
      <p className="text-muted-foreground mb-10 text-base leading-relaxed">
        Both are link in bio tools — but they solve different problems. Linktree gives anyone
        a shareable page of links. Verifiedly gives you a <strong className="text-foreground">government-ID verified profile</strong>{" "}
        so followers, brands, and other apps know you are the real person behind the link.
      </p>

      <div className="border border-border rounded-2xl overflow-hidden mb-10">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="text-left font-semibold p-4">Feature</th>
              <th className="text-left font-semibold p-4">Verifiedly</th>
              <th className="text-left font-semibold p-4">Linktree</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.feature} className="border-t border-border">
                <td className="p-4 text-foreground">{r.feature}</td>
                <td className="p-4"><Cell value={r.verifiedly} /></td>
                <td className="p-4"><Cell value={r.linktree} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="text-2xl font-display font-bold mb-3">Why professional creators pick Verifiedly</h2>
      <p className="text-muted-foreground leading-relaxed mb-4">
        The blue check on Verifiedly isn't cosmetic — it's a real ID + selfie check run through
        Stripe Identity. That means audiences and brands can trust the person on the other end of the profile,
        and other apps can plug into "Sign in with Verifiedly" to skip building their own verification stack.
      </p>
      <h2 className="text-2xl font-display font-bold mb-3">When Linktree is fine</h2>
      <p className="text-muted-foreground leading-relaxed mb-8">
        If you just need a simple list of links and don't sell anything, Linktree's free tier is enough.
        Once you're selling, running memberships, or want to prove you're real, Verifiedly's 3% Pro fee and
        built-in identity check pay for themselves quickly.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link to="/signup" className="flex-1">
          <Button className="w-full gap-2"><ShieldCheck className="w-4 h-4" /> Create your verified profile</Button>
        </Link>
        <Link to="/pro" className="flex-1">
          <Button variant="outline" className="w-full">See Verifiedly Pro</Button>
        </Link>
      </div>
    </main>
  </div>
);

export default ComparisonLinktree;