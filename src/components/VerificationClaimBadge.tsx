import { BadgeCheck, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const BusinessVerificationBadge = ({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) => (
  <span
    className={cn(
      "inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700",
      className,
    )}
    title="The organization's registration record was independently checked. This is not an endorsement."
  >
    <Building2 className="h-3 w-3" />
    {compact ? "Business verified" : "Business registration verified"}
  </span>
);
export const CredentialVerificationBadge = ({
  provider,
  compact = false,
  className,
}: {
  provider?: string | null;
  compact?: boolean;
  className?: string;
}) => (
  <span
    className={cn(
      "inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700",
      className,
    )}
    title={provider ? `Credential checked through ${provider}` : "Credential independently checked"}
  >
    <BadgeCheck className="h-3 w-3" />
    {compact ? "Verified" : provider ? `Verified by ${provider}` : "Credential verified"}
  </span>
);
