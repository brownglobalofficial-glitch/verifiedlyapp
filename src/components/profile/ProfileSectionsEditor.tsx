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
import { Eye, EyeOff, GripVertical, MoreHorizontal, Plus, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  PROFILE_EDITOR_SECTION_KINDS,
  PROFILE_SECTION_DEFINITIONS,
  type ProfileSection,
  type ProfileSectionKind,
  type SectionField,
} from "@/lib/profile-sections";

interface ProfileSectionsEditorProps {
  sections: ProfileSection[];
  onAdd: (kind: ProfileSectionKind) => void;
  onChange: (id: string, key: string, value: string) => void;
  onRemove: (section: ProfileSection) => void;
  onVisibilityChange: (section: ProfileSection, isPublic: boolean) => void;
  onReorder: (kind: ProfileSectionKind, activeId: string, overId: string) => void;
}

interface SortableSectionProps extends Omit<ProfileSectionsEditorProps, "sections" | "onAdd" | "onReorder"> {
  section: ProfileSection;
  entryIndex: number;
  label: string;
  primaryFields: SectionField[];
  detailFields: SectionField[];
}

const compactInputClass = "h-7 rounded-none border-0 border-b border-border/70 bg-transparent px-0 text-xs shadow-none placeholder:text-muted-foreground/55 focus-visible:border-foreground focus-visible:ring-0";

const DetailField = ({ field, section, onChange }: { field: SectionField; section: ProfileSection; onChange: ProfileSectionsEditorProps["onChange"] }) => (
  <label className="block">
    <span className="mb-1 block text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">{field.label}</span>
    <Input
      type={field.type === "url" ? "url" : "text"}
      value={section.data?.[field.key] || ""}
      onChange={(event) => onChange(section.id, field.key, event.target.value)}
      placeholder={field.placeholder}
      maxLength={field.type === "url" ? 500 : 160}
      className="h-8 rounded-lg text-xs"
    />
  </label>
);

const SortableSection = ({
  section,
  entryIndex,
  label,
  primaryFields,
  detailFields,
  onChange,
  onRemove,
  onVisibilityChange,
}: SortableSectionProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-xl border bg-background/95 p-2.5 ${section.is_public ? "border-border/80" : "border-dashed border-border/70 opacity-70"} ${isDragging ? "relative z-30 shadow-lg" : ""}`}
    >
      <div className="flex items-start gap-1.5">
        <button
          type="button"
          className="mt-0.5 inline-flex h-7 w-5 shrink-0 touch-none cursor-grab items-center justify-center rounded text-muted-foreground/55 transition hover:bg-muted hover:text-foreground active:cursor-grabbing"
          aria-label={`Reorder ${label} ${entryIndex + 1}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>

        <div className="min-w-0 flex-1 space-y-1">
          {primaryFields.map((field) => (
            <Input
              key={field.key}
              aria-label={`${label} ${entryIndex + 1} ${field.label}`}
              value={section.data?.[field.key] || ""}
              onChange={(event) => onChange(section.id, field.key, event.target.value)}
              placeholder={field.placeholder}
              maxLength={160}
              className={compactInputClass}
            />
          ))}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground" aria-label={`Options for ${label} ${entryIndex + 1}`}>
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => onVisibilityChange(section, !section.is_public)}>
              {section.is_public ? <EyeOff className="mr-2 h-3.5 w-3.5" /> : <Eye className="mr-2 h-3.5 w-3.5" />}
              {section.is_public ? "Hide" : "Show"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onRemove(section)}>Remove</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {!!detailFields.length && (
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="ml-6 mt-1.5 h-6 gap-1 px-1.5 text-[10px] font-normal text-muted-foreground">
              <SlidersHorizontal className="h-3 w-3" /> Details
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" side="left" className="w-[min(320px,calc(100vw-24px))] space-y-3 p-4">
            <div>
              <p className="text-sm font-semibold">{label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Dates and supporting link.</p>
            </div>
            {detailFields.map((field) => <DetailField key={field.key} field={field} section={section} onChange={onChange} />)}
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};

const ProfileSectionsEditor = ({
  sections,
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
    <div className="divide-y divide-border/70">
      {PROFILE_EDITOR_SECTION_KINDS.map((kind) => {
        const definition = PROFILE_SECTION_DEFINITIONS[kind];
        const entries = sections.filter((section) => section.kind === kind);
        const primaryFields = definition.fields.slice(0, 2);
        const detailFields = definition.fields.slice(2);

        return (
          <section key={kind} className="py-3.5 first:pt-0 last:pb-0">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{definition.label}</h2>
              <button type="button" onClick={() => onAdd(kind)} className="inline-flex h-6 items-center gap-1 rounded-full px-2 text-[10px] font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground">
                <Plus className="h-3 w-3" /> Add
              </button>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(event) => finishDrag(kind, event)}>
              <SortableContext items={entries.map((section) => section.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {entries.map((section, entryIndex) => (
                    <SortableSection
                      key={section.id}
                      section={section}
                      entryIndex={entryIndex}
                      label={definition.label}
                      primaryFields={primaryFields}
                      detailFields={detailFields}
                      onChange={onChange}
                      onRemove={onRemove}
                      onVisibilityChange={onVisibilityChange}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </section>
        );
      })}
    </div>
  );
};

export default ProfileSectionsEditor;
