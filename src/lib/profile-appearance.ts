export type ProfileTheme = "classic" | "ocean" | "forest" | "plum" | "sunset";

export const PROFILE_THEME_OPTIONS: ReadonlyArray<{
  value: ProfileTheme;
  label: string;
  swatch: string;
  page: string;
  hero: string;
  avatarRing: string;
  socialButton: string;
}> = [
  {
    value: "classic",
    label: "Classic",
    swatch: "bg-gradient-to-br from-neutral-100 via-white to-neutral-300",
    page: "bg-neutral-50",
    hero: "bg-gradient-to-br from-neutral-100 via-white to-neutral-200",
    avatarRing: "border-white",
    socialButton: "border-neutral-200 bg-white hover:bg-neutral-100",
  },
  {
    value: "ocean",
    label: "Ocean",
    swatch: "bg-gradient-to-br from-sky-200 via-blue-100 to-indigo-300",
    page: "bg-sky-50/70",
    hero: "bg-gradient-to-br from-sky-200 via-blue-100 to-indigo-200",
    avatarRing: "border-white",
    socialButton: "border-sky-200 bg-white hover:bg-sky-50",
  },
  {
    value: "forest",
    label: "Forest",
    swatch: "bg-gradient-to-br from-emerald-200 via-green-100 to-teal-300",
    page: "bg-emerald-50/60",
    hero: "bg-gradient-to-br from-emerald-200 via-green-100 to-teal-200",
    avatarRing: "border-white",
    socialButton: "border-emerald-200 bg-white hover:bg-emerald-50",
  },
  {
    value: "plum",
    label: "Plum",
    swatch: "bg-gradient-to-br from-fuchsia-200 via-purple-100 to-violet-300",
    page: "bg-purple-50/60",
    hero: "bg-gradient-to-br from-fuchsia-200 via-purple-100 to-violet-200",
    avatarRing: "border-white",
    socialButton: "border-purple-200 bg-white hover:bg-purple-50",
  },
  {
    value: "sunset",
    label: "Sunset",
    swatch: "bg-gradient-to-br from-amber-200 via-orange-100 to-rose-300",
    page: "bg-orange-50/60",
    hero: "bg-gradient-to-br from-amber-200 via-orange-100 to-rose-200",
    avatarRing: "border-white",
    socialButton: "border-orange-200 bg-white hover:bg-orange-50",
  },
];

const PROFILE_THEME_VALUES = new Set<ProfileTheme>(PROFILE_THEME_OPTIONS.map((option) => option.value));

export const normalizeProfileTheme = (value: unknown): ProfileTheme => {
  const normalized = String(value || "").trim().toLowerCase() as ProfileTheme;
  return PROFILE_THEME_VALUES.has(normalized) ? normalized : "classic";
};

export const getProfileTheme = (value: unknown) => {
  const normalized = normalizeProfileTheme(value);
  return PROFILE_THEME_OPTIONS.find((option) => option.value === normalized) || PROFILE_THEME_OPTIONS[0];
};
