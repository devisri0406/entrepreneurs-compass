import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { callLovableAI, type ChatMessage } from "./ai-gateway.server";
import { escapeIlikePattern } from "./search-utils";

const AskSchema = z.object({
  question: z.string().trim().min(2).max(2000),
  conversationId: z.string().uuid().optional(),
});

export interface AskResult {
  conversationId: string;
  answer: string;
  sources: { id: string; title: string; slug: string }[];
  confidence: number;
  suggestions: string[];
}

/**
 * Ask the Startup AI Advisor.
 * RAG: search the articles knowledge base with Postgres full-text search,
 * inject the top matches as context, then call the Lovable AI Gateway.
 * Persists the conversation and messages.
 */
export const askAdvisor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => AskSchema.parse(d))
  .handler(async ({ data, context }): Promise<AskResult> => {
    const { supabase, userId } = context;

    type Hit = { id: string; title: string; slug: string; description: string; content: string; tags: string[] };

    // 1) Retrieve top matching articles via tsvector search.
    let hits: Hit[] = [];
    try {
      const { data: matches } = await supabase
        .from("articles")
        .select("id,title,slug,description,content,tags")
        .textSearch("search_tsv", data.question, { type: "websearch", config: "english" })
        .limit(5);
      hits = (matches ?? []) as Hit[];
    } catch {
      hits = [];
    }

    // Fallback: keyword LIKE search.
    if (!hits.length) {
      const kw = data.question.split(/\s+/)
        .filter((w) => w.length > 3)
        .slice(0, 4)
        .map((w) => escapeIlikePattern(w))
        .filter(Boolean);
      const orExpr = kw.length ? kw.map((w) => `title.ilike.%${w}%,description.ilike.%${w}%`).join(",") : "";
      if (orExpr) {
        const { data: fb } = await supabase
          .from("articles")
          .select("id,title,slug,description,content,tags")
          .or(orExpr)
          .limit(5);
        hits = (fb ?? []) as Hit[];
      }
    }

    const context_snippets = hits
      .map((h: Hit, i: number) => `[Source ${i + 1}] ${h.title}\n${(h.content ?? h.description).slice(0, 900)}`)
      .join("\n\n");

    // 2) Load prior messages if a conversation is passed.
    let priorMessages: { role: string; content: string }[] = [];
    let conversationId = data.conversationId ?? null;
    if (conversationId) {
      const { data: prev } = await supabase
        .from("chat_messages")
        .select("role,content")
        .eq("conversation_id", conversationId)
        .order("created_at")
        .limit(20);
      priorMessages = prev ?? [];
    } else {
      const { data: created, error } = await supabase
        .from("chat_conversations")
        .insert({ user_id: userId, title: data.question.slice(0, 60) })
        .select("id")
        .single();
      if (error || !created) throw new Error("Could not start conversation");
      conversationId = created.id;
    }

    // 3) Build prompt.
    const system: ChatMessage = {
      role: "system",
      content:
        "You are Startup AI Advisor, an expert on building and scaling startups (India-focused, but globally aware). " +
        "Answer clearly and concisely in Markdown. When the provided knowledge sources are relevant, cite them inline like [Source 1]. " +
        "If sources don't fully cover the question, use general startup knowledge but say so briefly. Never fabricate legal or tax specifics.",
    };
    const contextMsg: ChatMessage = {
      role: "system",
      content: context_snippets
        ? `Relevant knowledge base excerpts:\n\n${context_snippets}`
        : "No knowledge base matches found for this query.",
    };

    const history: ChatMessage[] = priorMessages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    let answer = "";
    let fallback = false;
    try {
      answer = await callLovableAI(
        [system, contextMsg, ...history, { role: "user", content: data.question }],
        { model: "google/gemini-2.5-flash" },
      );
    } catch (err) {
      fallback = true;
      const errorMessage = err instanceof Error ? err.message : String(err);
      answer =
        (hits.length
          ? `**From the knowledge base:**\n\n${hits
              .map((h, i) => `**${i + 1}. ${h.title}** — ${h.description}`)
              .join("\n\n")}\n\n_AI gateway unavailable: ${errorMessage}_`
          : `I couldn't reach the AI service and no knowledge base articles matched your question.\n\n_${errorMessage}_`);
    }

    const confidence = fallback ? 0.4 : Math.min(0.95, 0.55 + hits.length * 0.08);
    const sources = hits.map((h) => ({ id: h.id, title: h.title, slug: h.slug }));

    // Suggested follow-ups (simple heuristic).
    const suggestions = hits.length
      ? hits.slice(0, 3).map((h) => `Tell me more about ${h.title.split(" — ").slice(-1)[0]}`)
      : [
          "How do I register a startup in India?",
          "What is Startup India recognition?",
          "How can I raise seed funding?",
        ];

    // 4) Persist both messages.
    await supabase.from("chat_messages").insert([
      { conversation_id: conversationId, user_id: userId, role: "user", content: data.question },
      {
        conversation_id: conversationId,
        user_id: userId,
        role: "assistant",
        content: answer,
        sources,
        confidence,
      },
    ]);
    await supabase.from("search_history").insert({ user_id: userId, query: data.question });
    await supabase
      .from("chat_conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);

    return { conversationId, answer, sources, confidence, suggestions };
  });

/** List conversations for the current user. */
export const listConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("chat_conversations")
      .select("id,title,updated_at")
      .order("updated_at", { ascending: false })
      .limit(50);
    return data ?? [];
  });

/** Fetch messages for a conversation (RLS scopes to owner). */
export const getConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: convo } = await context.supabase
      .from("chat_conversations")
      .select("id,title")
      .eq("id", data.id)
      .maybeSingle();
    const { data: msgs } = await context.supabase
      .from("chat_messages")
      .select("id,role,content,sources,confidence,created_at")
      .eq("conversation_id", data.id)
      .order("created_at");
    return { conversation: convo, messages: msgs ?? [] };
  });

export const deleteConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await context.supabase.from("chat_conversations").delete().eq("id", data.id);
    return { ok: true };
  });
