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
  optional?: boolean;
}

export interface SectionDefinition {
  label: string;
  description: string;
  singular: string;
  fields: SectionField[];
}

export const PROFILE_SECTION_DEFINITIONS: Record<ProfileSectionKind, SectionDefinition> = {
  about: {
    label: "About",
    singular: "About",
    description: "A longer introduction.",
    fields: [
      { key: "text", label: "About", placeholder: "Share what you do and what matters to you.", type: "textarea" },
    ],
  },
  work: {
    label: "Experience",
    singular: "Experience",
    description: "Work, athletics, leadership, internships, volunteering and other meaningful roles.",
    fields: [
      { key: "role", label: "Role or title", placeholder: "Founder, footballer, student leader…" },
      { key: "organization", label: "Organization", placeholder: "Team, school, company or organization" },
      { key: "start", label: "Start", placeholder: "2024", optional: true },
      { key: "end", label: "End", placeholder: "Present", optional: true },
      { key: "url", label: "Official source", placeholder: "https://…", type: "url", optional: true },
    ],
  },
  education: {
    label: "Education",
    singular: "Education entry",
    description: "Schools, degrees, programs, courses and formal training.",
    fields: [
      { key: "school", label: "School or program", placeholder: "School or program name" },
      { key: "program", label: "Area of study", placeholder: "Degree, program or subject", optional: true },
      { key: "start", label: "Start", placeholder: "2022", optional: true },
      { key: "end", label: "End", placeholder: "2026", optional: true },
      { key: "url", label: "Official source", placeholder: "https://…", type: "url", optional: true },
    ],
  },
  credential: {
    label: "Certifications & licenses",
    singular: "Certification or license",
    description: "Optional professional certifications, licenses and formal qualifications.",
    fields: [
      { key: "name", label: "Certification or license", placeholder: "Certification or license name" },
      { key: "issuer", label: "Issuing organization", placeholder: "Issuer" },
      { key: "issued", label: "Issued", placeholder: "2025", optional: true },
      { key: "expires", label: "Expires", placeholder: "Optional", optional: true },
      { key: "credential_id", label: "Credential ID", placeholder: "Optional", optional: true },
      { key: "url", label: "Official verification link", placeholder: "https://…", type: "url", optional: true },
    ],
  },
  accomplishment: {
    label: "Awards & achievements",
    singular: "Award or achievement",
    description: "Optional awards, honors, milestones and notable achievements.",
    fields: [
      { key: "title", label: "Award or achievement", placeholder: "Award, honor or milestone" },
      { key: "issuer", label: "Presented by", placeholder: "Organization or event", optional: true },
      { key: "date", label: "Date", placeholder: "2026", optional: true },
      { key: "url", label: "Supporting source", placeholder: "https://…", type: "url", optional: true },
    ],
  },
  project: {
    label: "Official links",
    singular: "Official link",
    description: "A small set of official websites, portfolios, media pages or other important links.",
    fields: [
      { key: "name", label: "Link title", placeholder: "Portfolio, player profile, interview…" },
      { key: "url", label: "URL", placeholder: "https://…", type: "url" },
    ],
  },
};

export const PERSON_PROFILE_SECTION_KINDS: ProfileSectionKind[] = [
  "work",
  "education",
  "credential",
  "accomplishment",
  "project",
];

export const ORGANIZATION_PROFILE_SECTION_KINDS: ProfileSectionKind[] = [
  "credential",
  "accomplishment",
  "project",
];

export const PUBLIC_PROFILE_SECTION_KINDS: ProfileSectionKind[] = [
  "work",
  "education",
  "credential",
  "accomplishment",
  "project",
];

// Kept as a compatibility export for older imports. New editors should use
// profileSectionKindsForAccountType so person and organization profiles stay focused.
export const PROFILE_EDITOR_SECTION_KINDS = PERSON_PROFILE_SECTION_KINDS;

export const profileSectionKindsForAccountType = (accountType?: string | null) =>
  accountType === "business" ? ORGANIZATION_PROFILE_SECTION_KINDS : PERSON_PROFILE_SECTION_KINDS;

export const isProfileEditorSectionKind = (kind: ProfileSectionKind) =>
  PUBLIC_PROFILE_SECTION_KINDS.includes(kind);

export const emptySectionData = (kind: ProfileSectionKind): ProfileSectionData =>
  Object.fromEntries(PROFILE_SECTION_DEFINITIONS[kind].fields.map((field) => [field.key, ""]));

export const hasVisibleSectionData = (section: ProfileSection) =>
  PROFILE_SECTION_DEFINITIONS[section.kind].fields.some((field) =>
    String(section.data?.[field.key] || "").trim().length > 0,
  );

export const safeExternalUrl = (value?: string | null) => {
  if (!value) return null;
  try {
    const url = new URL(value.startsWith("http://") || value.startsWith("https://") ? value : `https://${value}`);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
};
