import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BadgeCheck, BookOpen, FileText, FolderLock } from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { ProfileSection, ProfileSectionKind } from "@/lib/profile-sections";

const sectionTitle = (section: ProfileSection) => section.kind === "education"
  ? section.data.program || section.data.school || "Education"
  : section.data.name || "Credential";

const sectionIssuer = (section: ProfileSection) => section.kind === "education"
  ? section.data.school || ""
  : section.data.issuer || "";

const Credentials = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sections, setSections] = useState<ProfileSection[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login?next=/dashboard/credentials");
      return;
    }

    const { data, error } = await supabase
      .from("profile_sections")
      .select("id, user_id, kind, position, data, is_public, created_at, updated_at")
      .eq("user_id", session.user.id)
      .in("kind", ["education", "credential"])
      .order("position", { ascending: true });

    if (error) {
      toast({ title: "Credentials unavailable", description: error.message, variant: "destructive" });
    }

    setSections(((data || []) as Array<Omit<ProfileSection, "kind" | "data"> & { kind: string; data: unknown }>).map((section) => ({
      ...section,
      kind: section.kind as ProfileSectionKind,
      data: (section.data || {}) as Record<string, string>,
    })));
    setLoading(false);
  }, [navigate, toast]);

  useEffect(() => { void load(); }, [load]);

  return (
    <DashboardShell title="Credentials">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Part of your official profile</p>
            <h1 className="mt-2 font-display text-3xl font-bold">Education and credentials</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Add degrees, licenses, certifications, awards, and other professional credentials to your profile. These details are provided by you; Verifiedly's badge confirms your identity, not every profile entry.
            </p>
          </div>
          <Button asChild className="rounded-full"><Link to="/dashboard">Edit profile</Link></Button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Card className="rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted"><BookOpen className="h-4 w-4" /></div>
              <div>
                <p className="text-sm font-semibold">Education</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Schools, programs, degrees, and study dates you choose to display.</p>
              </div>
            </div>
          </Card>
          <Card className="rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted"><BadgeCheck className="h-4 w-4" /></div>
              <div>
                <p className="text-sm font-semibold">Professional credentials</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Licenses, certifications, awards, and memberships that help explain your experience.</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-7">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Your profile entries</h2>
            <span className="text-xs text-muted-foreground">{sections.length} entries</span>
          </div>

          {loading ? (
            <Card className="rounded-3xl p-8 text-center text-sm text-muted-foreground">Loading credentials…</Card>
          ) : !sections.length ? (
            <Card className="rounded-3xl border-dashed p-10 text-center">
              <BadgeCheck className="mx-auto h-7 w-7 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium">Add your first education or credential entry</p>
              <p className="mt-1 text-xs text-muted-foreground">You can add it from the profile editor and choose whether it appears publicly.</p>
              <Button asChild className="mt-5 rounded-full"><Link to="/dashboard">Add profile entry</Link></Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {sections.map((section) => (
                <Card key={section.id} className="rounded-2xl p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                      {section.kind === "education" ? <BookOpen className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{sectionTitle(section)}</h3>
                        <Badge variant="secondary" className="rounded-full text-[10px]">{section.kind === "education" ? "Education" : "Credential"}</Badge>
                        {!section.is_public && <Badge variant="outline" className="rounded-full text-[10px]">Private</Badge>}
                      </div>
                      {sectionIssuer(section) && <p className="mt-1 text-xs text-muted-foreground">{sectionIssuer(section)}</p>}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Card className="mt-6 rounded-2xl bg-muted/40 p-4">
          <div className="flex items-start gap-3">
            <FolderLock className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="text-sm font-medium">Supporting files are optional and private</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">You may keep a diploma, certificate, license, or award file in your private supporting-files area. Uploading a file does not make the profile entry verified.</p>
              <Button asChild variant="link" className="mt-1 h-auto p-0 text-xs"><Link to="/dashboard/documents">Manage supporting files</Link></Button>
            </div>
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
};

export default Credentials;
