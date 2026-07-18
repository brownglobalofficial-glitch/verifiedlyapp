import { useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  PROFILE_SECTION_DEFINITIONS,
  PROFILE_SECTION_KINDS,
  type ProfileSection,
  type ProfileSectionKind,
} from "@/lib/profile-sections";

interface ProfileSectionsEditorProps {
  sections: ProfileSection[];
  busyId: string | null;
  onAdd: (kind: ProfileSectionKind) => Promise<void>;
  onChange: (id: string, key: string, value: string) => void;
  onSave: (section: ProfileSection) => Promise<void>;
  onRemove: (section: ProfileSection) => Promise<void>;
  onVisibilityChange: (section: ProfileSection, isPublic: boolean) => Promise<void>;
  onMove: (section: ProfileSection, direction: -1 | 1) => Promise<void>;
}

const ProfileSectionsEditor = ({
  sections,
  busyId,
  onAdd,
  onChange,
  onSave,
  onRemove,
  onVisibilityChange,
  onMove,
}: ProfileSectionsEditorProps) => {
  const [newKind, setNewKind] = useState<ProfileSectionKind>("accomplishment");
  const [adding, setAdding] = useState(false);

  const add = async () => {
    setAdding(true);
    try {
      await onAdd(newKind);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display font-semibold">Profile sections</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Add factual, professional information. Empty and private sections never appear publicly.
            </p>
          </div>
          <div className="flex gap-2">
            <select
              aria-label="Section type"
              value={newKind}
              onChange={(event) => setNewKind(event.target.value as ProfileSectionKind)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              {PROFILE_SECTION_KINDS.map((kind) => (
                <option key={kind} value={kind}>{PROFILE_SECTION_DEFINITIONS[kind].label}</option>
              ))}
            </select>
            <Button type="button" onClick={add} disabled={adding} className="gap-2">
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
        </div>
      </Card>

      {sections.length === 0 && (
        <Card className="border-dashed p-8 text-center">
          <p className="font-medium">Your profile is ready for more detail.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Add an accomplishment, role, credential, project, education entry, or About section.
          </p>
        </Card>
      )}

      {sections.map((section, index) => {
        const definition = PROFILE_SECTION_DEFINITIONS[section.kind];
        const busy = busyId === section.id;

        return (
          <Card key={section.id} className="p-4 sm:p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display font-semibold">{definition.label}</h3>
                <p className="text-xs text-muted-foreground mt-1">{definition.description}</p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={busy || index === 0}
                  onClick={() => onMove(section, -1)}
                  aria-label={`Move ${definition.label} up`}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={busy || index === sections.length - 1}
                  onClick={() => onMove(section, 1)}
                  aria-label={`Move ${definition.label} down`}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={busy}
                  onClick={() => onRemove(section)}
                  aria-label={`Delete ${definition.label}`}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {definition.fields.map((field) => {
                const value = section.data?.[field.key] || "";
                const fullWidth = field.type === "textarea" || field.key === "url";
                return (
                  <div key={field.key} className={fullWidth ? "sm:col-span-2" : undefined}>
                    <Label htmlFor={`${section.id}-${field.key}`}>{field.label}</Label>
                    {field.type === "textarea" ? (
                      <Textarea
                        id={`${section.id}-${field.key}`}
                        value={value}
                        onChange={(event) => onChange(section.id, field.key, event.target.value)}
                        placeholder={field.placeholder}
                        maxLength={600}
                        className="mt-1 min-h-24"
                      />
                    ) : (
                      <Input
                        id={`${section.id}-${field.key}`}
                        type={field.type === "url" ? "url" : "text"}
                        value={value}
                        onChange={(event) => onChange(section.id, field.key, event.target.value)}
                        placeholder={field.placeholder}
                        maxLength={field.type === "url" ? 500 : 160}
                        className="mt-1"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={section.is_public}
                  onCheckedChange={(checked) => onVisibilityChange(section, checked)}
                  disabled={busy}
                />
                {section.is_public ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                {section.is_public ? "Visible on profile" : "Private draft"}
              </label>
              <Button type="button" size="sm" onClick={() => onSave(section)} disabled={busy} className="gap-2">
                <Save className="h-4 w-4" /> {busy ? "Saving…" : "Save section"}
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default ProfileSectionsEditor;
