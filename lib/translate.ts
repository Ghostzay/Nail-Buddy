const SYSTEM_PROMPT =
  "You are a translator for a nail salon. Translate the customer note from English to natural, conversational Vietnamese as it would be spoken by a nail technician. Return only the translated text with no quotes, labels, or extra commentary.";

async function translateWithAnthropic(text: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: text }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Anthropic translation failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  const block = data.content?.find((c: { type: string }) => c.type === "text");
  return (block?.text ?? "").trim();
}

async function translateWithOpenAI(text: string): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI translation failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  return (data.choices?.[0]?.message?.content ?? "").trim();
}

/** Translates text to Vietnamese on demand. Never called automatically. */
export async function translateToVietnamese(text: string): Promise<string> {
  if (process.env.ANTHROPIC_API_KEY) {
    return translateWithAnthropic(text);
  }
  if (process.env.OPENAI_API_KEY) {
    return translateWithOpenAI(text);
  }
  throw new Error(
    "No translation provider configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY."
  );
}
