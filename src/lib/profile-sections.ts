export type ProfileSectionKind =
  | "about"
  | "work"
  | "education"
  | "accomplishment"
  | "credential"
  | "project";

export type ProfileSectionData = Record<string, string>;

export interface ProfileSection {
  id: string;
  user_id: string;
  kind: ProfileSectionKind;
  position: number;
  data: ProfileSectionData;
  is_public: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SectionField {
  key: string;
  label: string;
  placeholder: string;
  type?: "text" | "date" | "url" | "textarea";
}

export interface SectionDefinition {
  label: string;
  description: string;
  fields: SectionField[];
}

export const PROFILE_SECTION_DEFINITIONS: Record<ProfileSectionKind, SectionDefinition> = {
  about: {
    label: "About",
    description: "A fuller introduction than the one-line bio under your name.",
    fields: [
      { key: "text", label: "About", placeholder: "Share what you do and what matters to you.", type: "textarea" },
    ],
  },
  work: {
    label: "Work",
    description: "A current or previous role.",
    fields: [
      { key: "role", label: "Role", placeholder: "Founder, player, designer…" },
      { key: "organization", label: "Organization", placeholder: "Organization name" },
      { key: "start", label: "Start", placeholder: "2024" },
      { key: "end", label: "End", placeholder: "Present" },
      { key: "description", label: "Description", placeholder: "What you do there", type: "textarea" },
      { key: "url", label: "Official link", placeholder: "https://…", type: "url" },
    ],
  },
  education: {
    label: "Education",
    description: "A school, program, course, or training experience.",
    fields: [
      { key: "school", label: "School or program", placeholder: "School or program name" },
      { key: "program", label: "Area of study", placeholder: "Program, degree, or subject" },
      { key: "start", label: "Start", placeholder: "2022" },
      { key: "end", label: "End", placeholder: "2026" },
      { key: "url", label: "Official link", placeholder: "https://…", type: "url" },
    ],
  },
  accomplishment: {
    label: "Accomplishment",
    description: "A milestone, result, award, or achievement.",
    fields: [
      { key: "title", label: "Title", placeholder: "What you accomplished" },
      { key: "date", label: "Date", placeholder: "2026" },
      { key: "description", label: "Details", placeholder: "Add helpful context", type: "textarea" },
      { key: "url", label: "Supporting link", placeholder: "https://…", type: "url" },
    ],
  },
  credential: {
    label: "Credential",
    description: "A degree, certificate, license, or qualification you want to reference.",
    fields: [
      { key: "name", label: "Credential", placeholder: "Credential name" },
      { key: "issuer", label: "Issuer", placeholder: "Issuing organization" },
      { key: "issued", label: "Issued", placeholder: "2025" },
      { key: "expires", label: "Expires", placeholder: "Optional" },
      { key: "url", label: "Verification or official link", placeholder: "https://…", type: "url" },
    ],
  },
  project: {
    label: "Project",
    description: "Something you created, operate, or contribute to.",
    fields: [
      { key: "name", label: "Project", placeholder: "Project name" },
      { key: "role", label: "Your role", placeholder: "Founder, contributor, athlete…" },
      { key: "description", label: "Description", placeholder: "What it is and what you did", type: "textarea" },
      { key: "url", label: "Project link", placeholder: "https://…", type: "url" },
    ],
  },
};

export const PROFILE_SECTION_KINDS = Object.keys(PROFILE_SECTION_DEFINITIONS) as ProfileSectionKind[];

export const emptySectionData = (kind: ProfileSectionKind): ProfileSectionData =>
  Object.fromEntries(PROFILE_SECTION_DEFINITIONS[kind].fields.map((field) => [field.key, ""]));

export const hasVisibleSectionData = (section: ProfileSection) =>
  Object.values(section.data || {}).some((value) => String(value || "").trim().length > 0);

export const safeExternalUrl = (value?: string | null) => {
  if (!value) return null;
  try {
    const url = new URL(value.startsWith("http://") || value.startsWith("https://") ? value : `https://${value}`);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
};
