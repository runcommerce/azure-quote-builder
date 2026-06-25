import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, content, base64, mimeType, provider, model, prompt, apiKey } = body;

    const ANTHROPIC_KEY = apiKey || process.env.ANTHROPIC_API_KEY;
    if (!ANTHROPIC_KEY) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured. Add it in Vercel → Environment Variables." }, { status: 503 });
    }

    let messages;

    if (type === "email") {
      // Email parsing mode — text only
      messages = [{
        role: "user",
        content: prompt || `Parse this email and extract print quote specifications. Return JSON only.\n\n${content}`,
      }];
    } else {
      // PDF extraction mode
      messages = [{
        role: "user",
        content: [
          { type: "document", source: { type: "base64", media_type: mimeType || "application/pdf", data: base64 } },
          { type: "text", text: prompt },
        ],
      }];
    }

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type":      "application/json",
        "x-api-key":         ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model:      model || "claude-sonnet-4-6",
        max_tokens: 4000,
        messages,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = (err as { error?: { message?: string } }).error?.message || `API error ${res.status}`;
      if (res.status === 401) return NextResponse.json({ error: "Invalid Anthropic API key." }, { status: 401 });
      if (res.status === 429) return NextResponse.json({ error: "Rate limit or spend cap reached. Check console.anthropic.com/settings/limits" }, { status: 429 });
      return NextResponse.json({ error: msg }, { status: res.status });
    }

    const data = await res.json();
    const result = data.content?.[0]?.text || "";
    return NextResponse.json({ result });
  } catch (err) {
    console.error("Extract error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
