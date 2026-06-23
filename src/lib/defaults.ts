import type { AdminConfig, ApiConfig } from "./types";

export const DEFAULT_ADMIN: AdminConfig = {
  portalCustomers: [
    { id: "hh_global",  name: "HH Global",  inputType: "pdf",   active: true },
    { id: "custodian",  name: "Custodian",   inputType: "email", active: true },
    { id: "konica",     name: "Konica",      inputType: "email", active: true },
  ],
  jobTypeDefaults: [
    { jobType: "Leaflet",         stock: "130gsm silk",     sides: "Double sided", delivery: "Overnight Parcel (€10)", active: true },
    { jobType: "Mailing",         stock: "150gsm silk",     sides: "Double sided", delivery: "Overnight Parcel (€10)", active: true },
    { jobType: "Brochure",        stock: "170gsm silk",     sides: "Double sided", delivery: "Overnight Parcel (€10)", active: true },
    { jobType: "Booklet",         stock: "170gsm silk",     sides: "Double sided", delivery: "Overnight Parcel (€10)", active: true },
    { jobType: "Business Cards",  stock: "400gsm silk",     sides: "Double sided", delivery: "Overnight Parcel (€10)", active: true },
    { jobType: "Postcard",        stock: "350gsm silk",     sides: "Double sided", delivery: "Overnight Parcel (€10)", active: true },
    { jobType: "Poster",          stock: "200gsm silk",     sides: "Single sided", delivery: "Small Van (€35)",        active: true },
    { jobType: "Stationery",      stock: "100gsm uncoated", sides: "Single sided", delivery: "Overnight Parcel (€10)", active: true },
  ],
  materialLookup: [
    { key: "130gsm silk",     printlogic: "MAGNO SATIN & GLOSS - COATED 130gsm silk FSC MIX Credit",  confirmed: true  },
    { key: "150gsm silk",     printlogic: "MAGNO SATIN & GLOSS - COATED 150gsm silk FSC MIX Credit",  confirmed: true  },
    { key: "170gsm silk",     printlogic: "MAGNO SATIN & GLOSS - COATED 170gsm silk FSC MIX Credit",  confirmed: false },
    { key: "200gsm silk",     printlogic: "MAGNO SATIN & GLOSS - COATED 200gsm silk FSC MIX Credit",  confirmed: false },
    { key: "250gsm silk",     printlogic: "MAGNO SATIN & GLOSS - COATED 250gsm silk FSC MIX Credit",  confirmed: false },
    { key: "300gsm silk",     printlogic: "MAGNO SATIN & GLOSS - COATED 300gsm silk FSC MIX Credit",  confirmed: true  },
    { key: "350gsm silk",     printlogic: "MAGNO SATIN & GLOSS - COATED 350gsm silk FSC MIX Credit",  confirmed: true  },
    { key: "400gsm silk",     printlogic: "MAGNO SATIN & GLOSS - COATED 400gsm silk FSC MIX Credit",  confirmed: true  },
    { key: "115gsm matt",     printlogic: "Novatech Matt Paper Matt/Silk 115gsm silk",                 confirmed: false },
    { key: "170gsm matt",     printlogic: "Novatech Matt Paper Matt/Silk 170gsm silk",                 confirmed: false },
    { key: "250gsm matt",     printlogic: "Novatech Matt Paper Matt/Silk 250gsm silk",                 confirmed: false },
    { key: "80gsm uncoated",  printlogic: "SOPORSET OFFSET - UNCOATED 80gsm uncoated FSC MIX Credit", confirmed: false },
    { key: "100gsm uncoated", printlogic: "SOPORSET OFFSET - UNCOATED 100gsm uncoated FSC MIX Credit",confirmed: false },
    { key: "300gsm uncoated", printlogic: "SOPORSET OFFSET - UNCOATED 300gsm uncoated FSC MIX Credit",confirmed: true  },
    { key: "350gsm uncoated", printlogic: "SOPORSET OFFSET - UNCOATED 350gsm uncoated FSC MIX Credit",confirmed: true  },
  ],
  deliveryRules: [
    { condition: "Dublin postcode (D01–D24)",            courier: "Small Van",         price: "€35",  active: true  },
    { condition: "Outside Dublin / Republic of Ireland", courier: "Overnight Parcel",  price: "€10",  active: true  },
    { condition: "High volume / pallet weight",          courier: "Pallet",            price: "€75",  active: false },
    { condition: "Very large / heavy consignment",       courier: "Truck",             price: "€150", active: false },
  ],
  followUp: {
    day2Email: true,
    day5RepAlert: true,
    highValueThreshold: 1000,
  },
  defaultMarkup: 125,
  defaultSheetSize: "SRA3",
};

export const DEFAULT_API_CONFIG: ApiConfig = {
  provider: "anthropic",
  anthropic: {
    endpoint: "/api/extract",  // proxied server-side to keep keys secure
    model: "claude-sonnet-4-6",
    apiKey: "",
  },
  openai: {
    endpoint: "/api/extract",
    model: "gpt-4o",
    apiKey: "",
  },
  custom: {
    endpoint: "",
    model: "",
    apiKey: "",
    headerName: "Authorization",
    headerPrefix: "Bearer ",
  },
};
