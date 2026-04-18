import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface Props {
  message?: string;
}

/**
 * Shown above publish/sell flows when the creator hasn't connected Stripe yet.
 * Links to /dashboard/settings where they can finish payouts setup.
 */
const StripeRequiredBanner = ({ message }: Props) => (
  <Card className="p-4 mb-6 border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800">
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <AlertCircle className="w-5 h-5 text-orange-500 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-semibold">Connect Stripe to start earning</p>
          <p className="text-xs text-muted-foreground">
            {message ?? "You need to finish payouts setup before you can publish or sell."}
          </p>
        </div>
      </div>
      <Link to="/dashboard/settings" className="shrink-0">
        <Button size="sm">Finish setup</Button>
      </Link>
    </div>
  </Card>
);

export default StripeRequiredBanner;
