import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { askAdvisor, deleteConversation, getConversation, listConversations, type AskResult } from "@/lib/ai.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Plus, Send, Sparkles, Trash2, User as UserIcon, Copy, ThumbsUp, ThumbsDown, RotateCcw } from "lucide-react";
import { Markdown } from "@/components/markdown";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";

const suggestions = [
  "How do I register a startup in India?",
  "How can I raise seed funding?",
  "Explain ESOPs.",
  "How do startups pay GST?",
  "What is a term sheet?",
  "How to find product-market fit?",
];

const searchSchema = z.object({ id: z.string().uuid().optional().catch(undefined) });

export const Route = createFileRoute("/ai")({
  head: () => ({
    meta: [
      { title: "Startup AI Advisor — Startup Navigator" },
      { name: "description", content: "Ask the Startup AI Advisor: cited, RAG-powered answers to any startup question." },
    ],
  }),
  validateSearch: (s) => searchSchema.parse(s),
  component: AIPage,
});

interface Msg {
  id?: string;
  role: "user" | "assistant";
  content: string;
  sources?: { id: string; title: string; slug: string }[];
  confidence?: number;
  suggestions?: string[];
}

function AIPage() {
  const { user } = useAuth();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [convoId, setConvoId] = useState<string | undefined>(search.id);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const askFn = useServerFn(askAdvisor);
  const listFn = useServerFn(listConversations);
  const getFn = useServerFn(getConversation);
  const deleteFn = useServerFn(deleteConversation);

  const { data: convos = [] } = useQuery({
    queryKey: ["convos"], queryFn: () => listFn(), enabled: !!user,
  });

  useEffect(() => { setConvoId(search.id); }, [search.id]);

  useEffect(() => {
    if (!convoId || !user) { setMessages([]); return; }
    getFn({ data: { id: convoId } }).then((res) => {
      setMessages((res.messages ?? []).map((m) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content,
        sources: (m.sources as Msg["sources"]) ?? [],
        confidence: m.confidence ?? undefined,
      })));
    });
  }, [convoId, user, getFn]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages]);
  useEffect(() => { inputRef.current?.focus(); }, [convoId, messages.length]);

  const ask = useMutation({
    mutationFn: (q: string) => askFn({ data: { question: q, conversationId: convoId } }),
    onMutate: (q) => setMessages((m) => [...m, { role: "user", content: q }, { role: "assistant", content: "…" }]),
    onSuccess: (res: AskResult) => {
      setConvoId(res.conversationId);
      navigate({ search: { id: res.conversationId }, replace: true });
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: "assistant", content: res.answer, sources: res.sources, confidence: res.confidence, suggestions: res.suggestions };
        return copy;
      });
      qc.invalidateQueries({ queryKey: ["convos"] });
    },
    onError: (e: Error) => { toast.error(e.message); setMessages((m) => m.slice(0, -1)); },
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ["convos"] });
      if (convoId === id) { setConvoId(undefined); setMessages([]); navigate({ search: {}, replace: true }); }
    },
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) { toast.info("Sign in to chat with the AI advisor"); return; }
    const q = input.trim(); if (!q) return;
    setInput(""); ask.mutate(q);
  }

  function newChat() { setConvoId(undefined); setMessages([]); navigate({ search: {}, replace: true }); inputRef.current?.focus(); }

  return (
    <div className="mx-auto grid h-[calc(100vh-4rem)] max-w-7xl grid-cols-1 md:grid-cols-[280px_1fr]">
      {/* Sidebar */}
      <aside className="hidden border-r bg-card/50 md:flex md:flex-col">
        <div className="p-3">
          <Button onClick={newChat} className="w-full gradient-hero text-primary-foreground shadow-glow"><Plus className="mr-2 h-4 w-4" /> New chat</Button>
        </div>
        <div className="px-3 pb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">History</div>
        <ScrollArea className="flex-1">
          <div className="space-y-1 px-2 pb-4">
            {!user && <div className="rounded-md p-3 text-sm text-muted-foreground">Sign in to save chat history.</div>}
            {convos.map((c) => (
              <div key={c.id} className={`group flex items-center gap-1 rounded-md px-2 py-1.5 text-sm hover:bg-muted ${convoId === c.id ? "bg-muted" : ""}`}>
                <button className="flex-1 truncate text-left" onClick={() => { setConvoId(c.id); navigate({ search: { id: c.id }, replace: true }); }}>
                  {c.title}
                </button>
                <button aria-label="Delete" className="opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100" onClick={() => del.mutate(c.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {user && convos.length === 0 && <div className="rounded-md p-3 text-sm text-muted-foreground">No conversations yet.</div>}
          </div>
        </ScrollArea>
      </aside>

      {/* Chat */}
      <div className="flex min-h-0 flex-col">
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="mx-auto max-w-2xl px-4 py-16 text-center">
              <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl gradient-hero text-primary-foreground shadow-glow">
                <Bot className="h-6 w-6" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Startup AI Advisor</h1>
              <p className="mt-2 text-muted-foreground">Ask anything about building your startup. Answers cite our knowledge base.</p>
              <div className="mt-8 grid gap-2 sm:grid-cols-2">
                {suggestions.map((s) => (
                  <button key={s} onClick={() => { setInput(s); inputRef.current?.focus(); }} className="rounded-xl border p-4 text-left text-sm hover:bg-muted">
                    <Sparkles className="mb-1 h-3.5 w-3.5 text-primary" /> {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
              {messages.map((m, i) => (
                <div key={i} className="flex gap-3">
                  <div className={`mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${m.role === "user" ? "bg-secondary text-secondary-foreground" : "gradient-hero text-primary-foreground shadow-glow"}`}>
                    {m.role === "user" ? <UserIcon className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    {m.role === "assistant" && m.content === "…" ? (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-primary" />
                        <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:120ms]" />
                        <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:240ms]" />
                        <span className="ml-2 text-sm">Thinking…</span>
                      </div>
                    ) : (
                      <>
                        <Markdown>{m.content}</Markdown>
                        {m.role === "assistant" && m.sources && m.sources.length > 0 && (
                          <div className="mt-3">
                            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Sources</div>
                            <div className="flex flex-wrap gap-2">
                              {m.sources.map((s, j) => (
                                <Link key={s.id} to="/articles/$slug" params={{ slug: s.slug }}>
                                  <Badge variant="secondary" className="cursor-pointer">[{j + 1}] {s.title}</Badge>
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}
                        {m.role === "assistant" && typeof m.confidence === "number" && (
                          <div className="mt-2 text-xs text-muted-foreground">Confidence: {(m.confidence * 100).toFixed(0)}%</div>
                        )}
                        {m.role === "assistant" && (
                          <div className="mt-2 flex gap-1 text-muted-foreground">
                            <button aria-label="Copy" className="rounded p-1 hover:bg-muted" onClick={() => { navigator.clipboard.writeText(m.content); toast.success("Copied"); }}><Copy className="h-3.5 w-3.5" /></button>
                            <button aria-label="Like" className="rounded p-1 hover:bg-muted"><ThumbsUp className="h-3.5 w-3.5" /></button>
                            <button aria-label="Dislike" className="rounded p-1 hover:bg-muted"><ThumbsDown className="h-3.5 w-3.5" /></button>
                            <button aria-label="Regenerate" className="rounded p-1 hover:bg-muted" onClick={() => { const last = [...messages].reverse().find((x) => x.role === "user"); if (last) ask.mutate(last.content); }}><RotateCcw className="h-3.5 w-3.5" /></button>
                          </div>
                        )}
                        {m.role === "assistant" && m.suggestions && m.suggestions.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {m.suggestions.map((s) => (
                              <button key={s} className="rounded-full border px-3 py-1 text-xs hover:bg-muted" onClick={() => ask.mutate(s)}>{s}</button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={submit} className="border-t bg-background p-3">
          <div className="mx-auto flex max-w-3xl gap-2">
            <Input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder={user ? "Ask about registration, funding, hiring, GST…" : "Sign in to chat with the AI advisor"} disabled={!user || ask.isPending} />
            <Button type="submit" className="gradient-hero text-primary-foreground shadow-glow" disabled={!user || ask.isPending || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Keep bundler happy for CardContent import if it gets pruned by tree-shaking
export const _u = { Card, CardContent };
