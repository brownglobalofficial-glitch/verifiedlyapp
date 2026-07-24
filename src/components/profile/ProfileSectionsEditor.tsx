import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Award,
  BriefcaseBusiness,
  Eye,
  EyeOff,
  FileBadge2,
  GraduationCap,
  GripVertical,
  Link2,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  PROFILE_SECTION_DEFINITIONS,
  type ProfileSection,
  type ProfileSectionKind,
  type SectionField,
} from "@/lib/profile-sections";

interface ProfileSectionsEditorProps {
  sections: ProfileSection[];
  kinds: ProfileSectionKind[];
  onAdd: (kind: ProfileSectionKind) => void;
  onChange: (id: string, key: string, value: string) => void;
  onRemove: (section: ProfileSection) => void;
  onVisibilityChange: (section: ProfileSection, isPublic: boolean) => void;
  onReorder: (kind: ProfileSectionKind, activeId: string, overId: string) => void;
}

const SECTION_ICONS: Partial<Record<ProfileSectionKind, typeof BriefcaseBusiness>> = {
  work: BriefcaseBusiness,
  education: GraduationCap,
  credential: FileBadge2,
  accomplishment: Award,
  project: Link2,
};

const fieldValue = (section: ProfileSection, field: SectionField) => section.data?.[field.key] || "";

const SectionFieldInput = ({
  field,
  section,
  onChange,
}: {
  field: SectionField;
  section: ProfileSection;
  onChange: ProfileSectionsEditorProps["onChange"];
}) => {
  const id = `${section.id}-${field.key}`;
  return (
    <div className={field.type === "textarea" ? "sm:col-span-2" : ""}>
      <Label htmlFor={id} className="text-[11px] font-medium text-muted-foreground">
        {field.label}{field.optional && <span className="font-normal"> · optional</span>}
      </Label>
      {field.type === "textarea" ? (
        <Textarea
          id={id}
          value={fieldValue(section, field)}
          onChange={(event) => onChange(section.id, field.key, event.target.value.slice(0, 500))}
          placeholder={field.placeholder}
          className="mt-1.5 min-h-20 resize-y rounded-xl text-sm"
        />
      ) : (
        <Input
          id={id}
          type={field.type === "url" ? "url" : "text"}
          value={fieldValue(section, field)}
          onChange={(event) => onChange(section.id, field.key, event.target.value.slice(0, field.type === "url" ? 500 : 160))}
          placeholder={field.placeholder}
          className="mt-1.5 h-10 rounded-xl text-sm"
        />
      )}
    </div>
  );
};

const SortableSectionEntry = ({
  section,
  kind,
  entryIndex,
  onChange,
  onRemove,
  onVisibilityChange,
}: {
  section: ProfileSection;
  kind: ProfileSectionKind;
  entryIndex: number;
  onChange: ProfileSectionsEditorProps["onChange"];
  onRemove: ProfileSectionsEditorProps["onRemove"];
  onVisibilityChange: ProfileSectionsEditorProps["onVisibilityChange"];
}) => {
  const definition = PROFILE_SECTION_DEFINITIONS[kind];
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-2xl border bg-background p-4 transition ${section.is_public ? "border-border/80" : "border-dashed border-border/70 bg-muted/20"} ${isDragging ? "relative z-30 shadow-xl" : "shadow-sm"}`}
    >
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            className="inline-flex h-8 w-8 shrink-0 touch-none cursor-grab items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground active:cursor-grabbing"
            aria-label={`Reorder ${definition.singular} ${entryIndex + 1}`}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{definition.singular} {entryIndex + 1}</p>
            <p className="text-[11px] text-muted-foreground">{section.is_public ? "Visible on your public profile" : "Hidden from your public profile"}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => onVisibilityChange(section, !section.is_public)}
            aria-label={section.is_public ? `Hide ${definition.singular}` : `Show ${definition.singular}`}
            title={section.is_public ? "Hide from profile" : "Show on profile"}
          >
            {section.is_public ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive"
            onClick={() => onRemove(section)}
            aria-label={`Remove ${definition.singular}`}
            title="Remove"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {definition.fields.map((field) => (
          <SectionFieldInput key={field.key} field={field} section={section} onChange={onChange} />
        ))}
      </div>
    </article>
  );
};

const ProfileSectionsEditor = ({
  sections,
  kinds,
  onAdd,
  onChange,
  onRemove,
  onVisibilityChange,
  onReorder,
}: ProfileSectionsEditorProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const finishDrag = (kind: ProfileSectionKind, event: DragEndEvent) => {
    if (!event.over || event.active.id === event.over.id) return;
    onReorder(kind, String(event.active.id), String(event.over.id));
  };

  return (
    <div className="space-y-5">
      {kinds.map((kind) => {
        const definition = PROFILE_SECTION_DEFINITIONS[kind];
        const entries = sections.filter((section) => section.kind === kind);
        const Icon = SECTION_ICONS[kind] || FileBadge2;

        return (
          <section key={kind} className="rounded-3xl border border-border/75 bg-muted/10 p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border bg-background shadow-sm">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-display text-base font-bold">{definition.label}</h2>
                  <p className="mt-1 max-w-xl text-xs leading-relaxed text-muted-foreground">{definition.description}</p>
                </div>
              </div>
              <Button type="button" variant="outline" size="sm" className="h-9 shrink-0 rounded-full" onClick={() => onAdd(kind)}>
                <Plus className="mr-1.5 h-4 w-4" /> Add {definition.singular.toLowerCase()}
              </Button>
            </div>

            {entries.length ? (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(event) => finishDrag(kind, event)}>
                <SortableContext items={entries.map((section) => section.id)} strategy={verticalListSortingStrategy}>
                  <div className="mt-4 space-y-3">
                    {entries.map((section, entryIndex) => (
                      <SortableSectionEntry
                        key={section.id}
                        section={section}
                        kind={kind}
                        entryIndex={entryIndex}
                        onChange={onChange}
                        onRemove={onRemove}
                        onVisibilityChange={onVisibilityChange}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <button
                type="button"
                onClick={() => onAdd(kind)}
                className="mt-4 flex w-full items-center justify-center rounded-2xl border border-dashed border-border px-4 py-5 text-xs text-muted-foreground transition hover:border-foreground/30 hover:bg-background hover:text-foreground"
              >
                <Plus className="mr-2 h-4 w-4" /> Add your first {definition.singular.toLowerCase()}
              </button>
            )}
          </section>
        );
      })}
    </div>
  );
};

export default ProfileSectionsEditor;
