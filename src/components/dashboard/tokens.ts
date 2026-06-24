// Azure Communications design tokens — mapped from azure-inspired.css
export const C = {
  // Core palette
  bg:          "var(--az-bg)",
  surface:     "var(--az-surface)",
  ink:         "var(--az-ink)",
  muted:       "var(--az-muted)",
  line:        "var(--az-line)",

  // Brand colours
  blue:        "var(--az-blue)",        // #1499d6
  blueDark:    "var(--az-blue-dark)",   // #0873ad
  blueLight:   "var(--az-blue-light)",  // #e6f5fc
  navy:        "var(--az-navy)",        // #102a43
  green:       "var(--az-green)",       // #7bc043
  greenLight:  "var(--az-green-light)", // #f0f9e6

  // Status
  amber:       "var(--az-amber)",
  amberLight:  "var(--az-amber-light)",
  amberBorder: "#fcd34d",
  red:         "var(--az-red)",
  redLight:    "var(--az-red-light)",
  redBorder:   "#fca5a5",
  greenBorder: "#86efac",

  // Layout
  shadow:      "var(--az-shadow)",
  shadowLg:    "var(--az-shadow-lg)",
  radius:      "var(--az-radius-md)",

  // Aliases for backwards compat
  white:       "#ffffff",
  offWhite:    "var(--az-bg)",
  grey:        "rgba(16,32,51,0.10)",
  greyMid:     "rgba(16,32,51,0.18)",
  greyDark:    "var(--az-muted)",
  dark:        "var(--az-ink)",
  azure:       "var(--az-blue)",
  azureLight:  "var(--az-blue-light)",
  lime:        "var(--az-green)",
  limeLight:   "var(--az-green-light)",
} as const;

export type View =
  | "dashboard"
  | "upload-quote"
  | "new-quote"
  | "email-quote"
  | "customers"
  | "quotes"
  | "pricing"
  | "intelligence"
  | "client-portals"
  | "admin-settings";
