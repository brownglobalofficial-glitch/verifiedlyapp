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
    swatch: "bg-gradient-to-br from-neutral-950 via-neutral-500 to-neutral-100",
    page: "bg-neutral-50",
    hero: "bg-gradient-to-br from-neutral-950 via-neutral-500 to-neutral-100",
    avatarRing: "border-white",
    socialButton: "border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-100",
  },
  {
    value: "ocean",
    label: "Ocean",
    swatch: "bg-gradient-to-br from-slate-950 via-blue-700 to-cyan-300",
    page: "bg-sky-50",
    hero: "bg-gradient-to-br from-slate-950 via-blue-700 to-cyan-300",
    avatarRing: "border-white",
    socialButton: "border-sky-300 bg-sky-50 text-sky-950 hover:bg-sky-100",
  },
  {
    value: "forest",
    label: "Forest",
    swatch: "bg-gradient-to-br from-emerald-950 via-green-700 to-lime-300",
    page: "bg-emerald-50",
    hero: "bg-gradient-to-br from-emerald-950 via-green-700 to-lime-300",
    avatarRing: "border-white",
    socialButton: "border-emerald-300 bg-emerald-50 text-emerald-950 hover:bg-emerald-100",
  },
  {
    value: "plum",
    label: "Plum",
    swatch: "bg-gradient-to-br from-violet-950 via-fuchsia-700 to-pink-300",
    page: "bg-purple-50",
    hero: "bg-gradient-to-br from-violet-950 via-fuchsia-700 to-pink-300",
    avatarRing: "border-white",
    socialButton: "border-purple-300 bg-purple-50 text-purple-950 hover:bg-purple-100",
  },
  {
    value: "sunset",
    label: "Sunset",
    swatch: "bg-gradient-to-br from-rose-700 via-orange-500 to-amber-200",
    page: "bg-orange-50",
    hero: "bg-gradient-to-br from-rose-700 via-orange-500 to-amber-200",
    avatarRing: "border-white",
    socialButton: "border-orange-300 bg-orange-50 text-orange-950 hover:bg-orange-100",
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