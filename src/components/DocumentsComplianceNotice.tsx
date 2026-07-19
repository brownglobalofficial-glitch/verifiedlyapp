import { ShieldCheck } from "lucide-react";
import { DOCUMENTS_COMPLIANCE_TEXT } from "@/lib/legal";
import { cn } from "@/lib/utils";

interface DocumentsComplianceNoticeProps {
  className?: string;
}

const DocumentsComplianceNotice = ({ className }: DocumentsComplianceNoticeProps) => (
  <div
    className={cn(
      "flex items-start gap-3 rounded-2xl bg-muted/50 p-4 text-xs leading-relaxed text-muted-foreground",
      className,
    )}
    role="note"
    aria-label="Verifiedly Documents upload restrictions"
  >
    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-foreground" aria-hidden="true" />
    <p>{DOCUMENTS_COMPLIANCE_TEXT}</p>
  </div>
);

export default DocumentsComplianceNotice;
