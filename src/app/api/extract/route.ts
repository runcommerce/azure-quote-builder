import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { provider, model, base64, mediaType, prompt, apiKey } = body;

    if (provider === "anthropic") {
      const key = apiKey || process.env.ANTHROPIC_API_KEY;
      if (!key) return NextResponse.json({ error: "No Anthropic API key configured" }, { status: 401 });

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: model || "claude-sonnet-4-6",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: [
              { type: "document", source: { type: "base64", media_type: mediaType, data: base64 } },
              { type: "text", text: prompt },
            ],
          }],
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        return NextResponse.json({ error: err }, { status: res.status });
      }
      const data = await res.json();
      const text = data.content?.find((b: { type: string }) => b.type === "text")?.text || "";
      return NextResponse.json({ text });
    }

    if (provider === "openai") {
      const key = apiKey || process.env.OPENAI_API_KEY;
      if (!key) return NextResponse.json({ error: "No OpenAI API key configured" }, { status: 401 });

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
        body: JSON.stringify({
          model: model || "gpt-4o",
          messages: [{
            role: "user",
            content: [
              { type: "image_url", image_url: { url: `data:${mediaType};base64,${base64}` } },
              { type: "text", text: prompt },
            ],
          }],
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        return NextResponse.json({ error: err }, { status: res.status });
      }
      const data = await res.json();
      return NextResponse.json({ text: data.choices?.[0]?.message?.content || "" });
    }

    return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
