import { Button } from "@/components/ui/button";
import { Mail, ExternalLink } from "lucide-react";

interface EmailConfirmationBannerProps {
  email?: string;
}

const EmailConfirmationBanner = ({ email }: EmailConfirmationBannerProps) => {
  const getEmailUrl = (email?: string) => {
    if (!email) return null;
    const domain = email.split("@")[1]?.toLowerCase();
    const providers: Record<string, string> = {
      "gmail.com": "https://mail.google.com",
      "yahoo.com": "https://mail.yahoo.com",
      "outlook.com": "https://outlook.live.com",
      "hotmail.com": "https://outlook.live.com",
      "icloud.com": "https://www.icloud.com/mail",
      "protonmail.com": "https://mail.proton.me",
      "proton.me": "https://mail.proton.me",
    };
    return providers[domain] || null;
  };

  const emailUrl = getEmailUrl(email);

  return (
    <div className="bg-secondary rounded-xl p-6 text-center space-y-4">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
        <Mail className="w-8 h-8 text-primary" />
      </div>
      <div>
        <h2 className="text-xl font-display font-bold">Check your email</h2>
        <p className="text-sm text-muted-foreground mt-2">
          We sent a confirmation link to{" "}
          {email ? <span className="font-medium text-foreground">{email}</span> : "your email"}.
          Click it to verify your account and you'll be signed in automatically.
        </p>
      </div>
      {emailUrl && (
        <a href={emailUrl} target="_blank" rel="noopener noreferrer">
          <Button className="gap-2">
            <ExternalLink className="w-4 h-4" /> Go to Email
          </Button>
        </a>
      )}
    </div>
  );
};

export default EmailConfirmationBanner;
