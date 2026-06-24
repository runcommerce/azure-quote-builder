// Azure Communications exact brand tokens — from azurecomm.ie
export const C = {
  // Primary brand
  forest:      "var(--az-forest)",       // #1a3a2e — sidebar, hero bg
  forestDeep:  "var(--az-forest-deep)",  // #122a21 — hover/active
  lime:        "var(--az-lime)",          // #c8e63c — accent
  limeDark:    "var(--az-lime-dark)",     // #a8c420

  // Neutral
  white:       "#ffffff",
  offWhite:    "var(--az-off-white)",     // #f7f9f7
  ink:         "var(--az-ink)",           // #0e1f18
  muted:       "var(--az-muted)",         // #5a7066
  line:        "var(--az-line)",
  lineLight:   "var(--az-line-light)",

  // Status
  amber:       "var(--az-amber)",
  amberLight:  "var(--az-amber-light)",
  amberBorder: "#fcd34d",
  red:         "var(--az-red)",
  redLight:    "var(--az-red-light)",
  redBorder:   "#fca5a5",
  greenOk:     "var(--az-green-ok)",
  greenLight:  "var(--az-green-light)",
  greenBorder: "#86efac",

  // Backwards compat aliases
  navy:        "var(--az-forest)",
  navyDark:    "var(--az-forest-deep)",
  blue:        "var(--az-forest)",
  blueDark:    "var(--az-forest-deep)",
  blueLight:   "rgba(200,230,60,0.12)",
  azure:       "var(--az-forest)",
  azureLight:  "rgba(200,230,60,0.10)",
  green:       "var(--az-lime)",
  greenLt:     "rgba(200,230,60,0.15)",
  grey:        "var(--az-line)",
  greyMid:     "rgba(26,58,46,0.20)",
  greyDark:    "var(--az-muted)",
  dark:        "var(--az-ink)",
  surface:     "#ffffff",
  bg:          "var(--az-off-white)",
  shadow:      "var(--az-shadow)",
  shadowLg:    "var(--az-shadow-lg)",
} as const;

export type View =
  | "dashboard" | "upload-quote" | "new-quote" | "email-quote"
  | "customers" | "quotes" | "pricing" | "intelligence"
  | "client-portals" | "admin-settings";
