import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { imageBase64, existingInventory } = await request.json();

    if (!imageBase64) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not set in environment" },
        { status: 500 }
      );
    }

    const inventorySummary =
      existingInventory && existingInventory.length > 0
        ? "Existing inventory items:\n" +
          existingInventory
            .map(
              (it) =>
                `id=${it.id}, name="${it.name}", type="${it.type}", color="${it.color}", traits="${it.traits}", description="${it.description || ""}"`
            )
            .join("\n")
        : "The inventory is currently empty.";

    const prompt = `You are an AI inventory scanner. Analyze this image and identify the object shown.

${inventorySummary}

Your tasks:
1. Identify the object: its name, type/category, dominant color(s), and 2–4 unique traits (shape, material, visible brand/text, size estimate, texture, distinctive markings, etc.).
2. Determine if this object MATCHES any existing inventory item by comparing: same type + similar color + overlapping traits. Be specific — a red apple and a green apple are NOT matches. Only match if you are confident.

Respond ONLY with a valid JSON object. No markdown, no explanation, no code fences:
{
  "name": "short object name",
  "type": "category (e.g. fruit, electronics, tool, clothing, book, container, toy, food, stationery, etc.)",
  "color": "dominant color description",
  "traits": "2–4 specific traits separated by commas",
  "description": "one concise sentence describing the object",
  "match_id": null or the id value (string) of the matching inventory item,
  "match_confidence": "high" or "medium" or "low" or null,
  "match_reason": "brief reason for the match, or null"
}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-opus-4-5",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: "image/jpeg",
                  data: imageBase64,
                },
              },
              { type: "text", text: prompt },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json(
        { error: `Claude API error: ${err}` },
        { status: 500 }
      );
    }

    const data = await response.json();
    const rawText =
      data.content?.find((b) => b.type === "text")?.text || "";

    // Strip any accidental markdown fences
    const cleaned = rawText.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Scan error:", err);
    return NextResponse.json(
      { error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}
