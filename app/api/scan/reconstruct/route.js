import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { images } = await request.json();
    if (!images?.front || !images?.back || !images?.side) {
      return NextResponse.json(
        { error: "Provide front, back, and side image base64 strings" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not set in environment" },
        { status: 500 }
      );
    }

    const prompt = `Analyze these three views (front, back, side) of the same object.
Estimate relative dimensions as normalized units (width, height, depth) where the largest dimension is 1.
Describe shape briefly.

Respond ONLY with valid JSON, no markdown:
{
  "width": number,
  "height": number,
  "depth": number,
  "shapeNotes": "short description",
  "dominantColor": "color name"
}`;

    const content = [
      { type: "text", text: "Front view:" },
      {
        type: "image",
        source: { type: "base64", media_type: "image/jpeg", data: images.front },
      },
      { type: "text", text: "Back view:" },
      {
        type: "image",
        source: { type: "base64", media_type: "image/jpeg", data: images.back },
      },
      { type: "text", text: "Side view:" },
      {
        type: "image",
        source: { type: "base64", media_type: "image/jpeg", data: images.side },
      },
      { type: "text", text: prompt },
    ];

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-opus-4-5",
        max_tokens: 512,
        messages: [{ role: "user", content }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: `Claude API error: ${err}` }, { status: 500 });
    }

    const data = await response.json();
    const rawText = data.content?.find((b) => b.type === "text")?.text || "";
    const cleaned = rawText.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json({
      ...parsed,
      textures: {
        front: `data:image/jpeg;base64,${images.front}`,
        back: `data:image/jpeg;base64,${images.back}`,
        side: `data:image/jpeg;base64,${images.side}`,
      },
    });
  } catch (err) {
    console.error("Reconstruct error:", err);
    return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 });
  }
}
