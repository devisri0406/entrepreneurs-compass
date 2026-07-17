// Server-only helper for calling the Lovable AI Gateway.
// Never import from client code.

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function callLovableAI(
  messages: ChatMessage[],
  opts: { model?: string; temperature?: number } = {},
): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY missing");

  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: opts.model ?? "google/gemini-2.5-flash",
      messages,
      temperature: opts.temperature ?? 0.4,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (res.status === 429) throw new Error("AI is rate-limited. Please try again in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted for this workspace. Add credits in Settings.");
    throw new Error(`AI gateway error ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? "";
}
