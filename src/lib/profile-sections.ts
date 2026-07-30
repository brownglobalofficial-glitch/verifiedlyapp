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

// Retired section definitions remain for data compatibility. The current
// editor and public profile expose only Work and Education.
export const PROFILE_SECTION_DEFINITIONS: Record<ProfileSectionKind, SectionDefinition> = {
  about: {
    label: "About",
    singular: "About",
    description: "Retired profile section.",
    fields: [
      { key: "text", label: "About", placeholder: "", type: "textarea" },
    ],
  },
  work: {
    label: "Work",
    singular: "Work entry",
    description: "Your current and previous professional, athletic, leadership or volunteer roles.",
    fields: [
      { key: "role", label: "Job title or role", placeholder: "Founder, footballer, student leader…" },
      { key: "organization", label: "Organization", placeholder: "Company, club, team, school or organization" },
      { key: "start", label: "Start date", placeholder: "2024", optional: true },
      { key: "end", label: "End date or Present", placeholder: "Present", optional: true },
    ],
  },
  education: {
    label: "Education",
    singular: "Education entry",
    description: "Schools, degree programs, courses and formal training.",
    fields: [
      { key: "school", label: "School", placeholder: "School or institution" },
      { key: "program", label: "Program or field", placeholder: "Degree, program or field", optional: true },
      { key: "start", label: "Start date", placeholder: "2022", optional: true },
      { key: "end", label: "End date or Present", placeholder: "2026", optional: true },
    ],
  },
  credential: {
    label: "Certifications & licenses",
    singular: "Certification or license",
    description: "Retired profile section.",
    fields: [
      { key: "name", label: "Certification or license", placeholder: "" },
      { key: "issuer", label: "Issuing organization", placeholder: "" },
      { key: "issued", label: "Issued", placeholder: "", optional: true },
      { key: "expires", label: "Expires", placeholder: "", optional: true },
      { key: "credential_id", label: "Credential ID", placeholder: "", optional: true },
      { key: "url", label: "Official verification link", placeholder: "", type: "url", optional: true },
    ],
  },
  accomplishment: {
    label: "Awards & achievements",
    singular: "Award or achievement",
    description: "Retired profile section.",
    fields: [
      { key: "title", label: "Award or achievement", placeholder: "" },
      { key: "issuer", label: "Presented by", placeholder: "", optional: true },
      { key: "date", label: "Date", placeholder: "", optional: true },
      { key: "url", label: "Supporting source", placeholder: "", type: "url", optional: true },
    ],
  },
  project: {
    label: "Official links",
    singular: "Official link",
    description: "Retired profile section.",
    fields: [
      { key: "name", label: "Link title", placeholder: "" },
      { key: "url", label: "URL", placeholder: "", type: "url" },
    ],
  },
};

export const PERSON_PROFILE_SECTION_KINDS: ProfileSectionKind[] = [
  "work",
  "education",
];

// Organizations retain their core organization profile fields but do not use
// personal Work/Education or retired credential/award/link sections.
export const ORGANIZATION_PROFILE_SECTION_KINDS: ProfileSectionKind[] = [];

export const PUBLIC_PROFILE_SECTION_KINDS: ProfileSectionKind[] = [
  "work",
  "education",
];

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
