import { Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  PROFILE_SECTION_DEFINITIONS,
  PROFILE_SECTION_KINDS,
  type ProfileSection,
  type ProfileSectionKind,
} from "@/lib/profile-sections";

interface ProfileSectionsEditorProps {
  sections: ProfileSection[];
  onAdd: (kind: ProfileSectionKind) => void;
  onChange: (id: string, key: string, value: string) => void;
  onRemove: (section: ProfileSection) => void;
  onVisibilityChange: (section: ProfileSection, isPublic: boolean) => void;
}

const inputClass = "h-9 rounded-none border-0 border-b bg-transparent px-0 text-sm shadow-none focus-visible:ring-0 focus-visible:border-foreground";
const textareaClass = "min-h-20 resize-y rounded-lg border bg-transparent px-3 py-2 text-sm shadow-none focus-visible:ring-1";

const ProfileSectionsEditor = ({
  sections,
  onAdd,
  onChange,
  onRemove,
  onVisibilityChange,
}: ProfileSectionsEditorProps) => (
  <div className="divide-y divide-border">
    {PROFILE_SECTION_KINDS.map((kind) => {
      const definition = PROFILE_SECTION_DEFINITIONS[kind];
      const entries = sections.filter((section) => section.kind === kind);

      return (
        <section key={kind} className="py-6 first:pt-0 last:pb-0">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-display font-semibold">{definition.label}</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">{definition.description}</p>
            </div>
            {kind !== "about" && (
              <Button type="button" variant="ghost" size="sm" className="h-8 gap-1.5 px-2 text-xs" onClick={() => onAdd(kind)}>
                <Plus className="h-3.5 w-3.5" /> Add another
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {entries.map((section, entryIndex) => (
              <div key={section.id} className="relative rounded-xl border border-border/80 bg-background p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    {kind === "about" ? "Profile summary" : `${definition.label} ${entryIndex + 1}`}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onVisibilityChange(section, !section.is_public)}
                      className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-[11px] text-muted-foreground transition hover:bg-muted hover:text-foreground"
                      aria-label={section.is_public ? `Hide ${definition.label}` : `Show ${definition.label}`}
                    >
                      {section.is_public ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      {section.is_public ? "Visible" : "Hidden"}
                    </button>
                    {kind !== "about" && (
                      <button
                        type="button"
                        onClick={() => onRemove(section)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                        aria-label={`Remove ${definition.label}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
                  {definition.fields.map((field) => {
                    const value = section.data?.[field.key] || "";
                    const fullWidth = field.type === "textarea" || field.key === "url";
                    const id = `${section.id}-${field.key}`;

                    return (
                      <label key={field.key} htmlFor={id} className={fullWidth ? "sm:col-span-2" : undefined}>
                        <span className="sr-only">{field.label}</span>
                        {field.type === "textarea" ? (
                          <Textarea
                            id={id}
                            value={value}
                            onChange={(event) => onChange(section.id, field.key, event.target.value)}
                            placeholder={field.placeholder}
                            maxLength={600}
                            className={textareaClass}
                          />
                        ) : (
                          <Input
                            id={id}
                            type={field.type === "url" ? "url" : "text"}
                            value={value}
                            onChange={(event) => onChange(section.id, field.key, event.target.value)}
                            placeholder={field.placeholder}
                            maxLength={field.type === "url" ? 500 : 160}
                            className={inputClass}
                          />
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      );
    })}
  </div>
);

export default ProfileSectionsEditor;
