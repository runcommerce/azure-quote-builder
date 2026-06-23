# Azure Quote Builder

AI-powered RFQ spec parser for Azure Communications. Upload a portal PDF spec (HH Global, Custodian, Konica), extract all quoting fields, review, and generate PrintLogic-ready output.

## Setup

1. Clone the repo
2. `npm install`
3. Set environment variables (see `.env.example`)
4. `npm run dev`

## Environment Variables

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Claude API key (primary LLM) |
| `OPENAI_API_KEY` | OpenAI API key (optional fallback) |

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Server-side API proxy (`/api/extract`) keeps keys secure
- Configurable AI provider (Anthropic / OpenAI / Custom)

## Admin Panel

Click ⚙ Admin in the header to configure:
- Portal customers (HH Global, Custodian, Konica) and input types
- Job type defaults (stock, sides, delivery)
- Material lookup table (PrintLogic stock names)
- Delivery rules
- Follow-up automation settings
