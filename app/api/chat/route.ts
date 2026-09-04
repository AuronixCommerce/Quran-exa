import { NextResponse } from "next/server";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const SYSTEM_PROMPT = `You are Quranexa AI, an Islamic learning assistant.

Core behavior:
- Help users understand Quranic themes, translations, tafsir context, authentic hadith, duas, and general Islamic knowledge.
- Be humble and source-conscious. Never present an uncertain statement as definitive revelation, a binding fatwa, or a verified hadith.
- When quoting or closely paraphrasing Quran or hadith, identify the source when you are confident. If you are not confident about an exact citation, say so clearly instead of inventing one.
- Distinguish clearly between Quranic text, translation, tafsir, scholarly interpretation, and your own explanatory summary.
- For sensitive fiqh, legal, medical, financial, or personal religious rulings, explain general principles and encourage consultation with a qualified scholar when appropriate.
- Keep answers calm, respectful, concise, and useful.
- If the user writes in Urdu, answer fully in natural Urdu rather than mixing unnecessary English terms. If the user writes in Arabic, answer in Arabic. Otherwise answer in English.
- Do not claim access to sources, databases, browsing, authentication data, or private user history that you do not actually have.
`;

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as Record<string, unknown>;
  return (
    (message.role === "user" || message.role === "assistant") &&
    typeof message.content === "string" &&
    message.content.trim().length > 0
  );
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

    if (!apiKey) {
      return NextResponse.json(
        { error: "Quranexa AI is not configured yet. Add GROQ_API_KEY to the deployment environment." },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => null);
    const incoming = Array.isArray(body?.messages) ? body.messages : [];
    const messages = incoming.filter(isChatMessage).slice(-20);

    if (!messages.length) {
      return NextResponse.json({ error: "Please enter a question." }, { status: 400 });
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.25,
        max_completion_tokens: 1800,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      }),
      signal: AbortSignal.timeout(45000),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      console.error("Quranexa Groq request failed", response.status, data);
      return NextResponse.json(
        { error: "Quranexa could not reach the AI service right now." },
        { status: 502 }
      );
    }

    const answer = data?.choices?.[0]?.message?.content;
    if (typeof answer !== "string" || !answer.trim()) {
      return NextResponse.json(
        { error: "Quranexa did not receive a usable answer." },
        { status: 502 }
      );
    }

    return NextResponse.json({ answer: answer.trim() });
  } catch (error) {
    console.error("Quranexa chat route failed", error);
    return NextResponse.json(
      { error: "Quranexa could not answer right now." },
      { status: 500 }
    );
  }
}
