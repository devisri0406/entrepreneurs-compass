import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ExternalLink, BookmarkPlus } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toggleBookmark } from "@/lib/user.functions";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { escapeIlikePattern, sanitizeSearchTerm } from "@/lib/search-utils";

export const Route = createFileRoute("/resources")({
  head: () => ({
    meta: [
      { title: "Startup Resources — Startup Navigator" },
      { name: "description", content: "Curated startup resources: government links, templates, tools, incubators, and more." },
    ],
  }),
  component: Resources,
});

function Resources() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const { user } = useAuth();
  const bookmarkFn = useServerFn(toggleBookmark);

  const { data: resources = [], isLoading } = useQuery({
    queryKey: ["resources", q, cat],
    queryFn: async () => {
      let query = supabase.from("resources").select("*");
      if (cat) query = query.eq("category", cat);
      if (q) {
        const safe = escapeIlikePattern(sanitizeSearchTerm(q));
        if (safe) query = query.or(`title.ilike.%${safe}%,description.ilike.%${safe}%`);
      }
      return (await query.order("created_at", { ascending: false }).limit(200)).data ?? [];
    },
  });

  const categoriesSet = Array.from(new Set(resources.map((r) => r.category)));

  async function save(id: string) {
    if (!user) return toast.info("Sign in to bookmark");
    try {
      await bookmarkFn({ data: { resourceId: id } });
      toast.success("Saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Resources</h1>
      <p className="mt-2 text-muted-foreground">Curated links, templates, and tools for founders.</p>

      <div className="mt-6 flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search resources…" className="pl-9" />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => setCat(null)}
          className={`rounded-full border px-3 py-1 text-xs ${!cat ? "gradient-hero text-primary-foreground border-transparent shadow-glow" : "hover:bg-muted"}`}
        >All</button>
        {categoriesSet.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`rounded-full border px-3 py-1 text-xs ${cat === c ? "gradient-hero text-primary-foreground border-transparent shadow-glow" : "hover:bg-muted"}`}
          >{c}</button>
        ))}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading && Array.from({ length: 6 }).map((_, i) => <Card key={i}><CardContent className="h-40 p-6" /></Card>)}
        {resources.map((r) => (
          <Card key={r.id} className="flex h-full flex-col transition-all hover:shadow-elegant">
            <CardContent className="flex flex-1 flex-col p-5">
              <Badge variant="secondary" className="mb-2 w-fit text-xs">{r.category}</Badge>
              <div className="font-semibold">{r.title}</div>
              <p className="mt-1 flex-1 text-sm text-muted-foreground">{r.description}</p>
              <div className="mt-4 flex gap-2">
                <a href={r.url} target="_blank" rel="noreferrer">
                  <Button size="sm" variant="outline"><ExternalLink className="mr-2 h-3.5 w-3.5" /> Open</Button>
                </a>
                <Button size="sm" variant="ghost" onClick={() => save(r.id)}>
                  <BookmarkPlus className="mr-2 h-3.5 w-3.5" /> Save
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {!isLoading && resources.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed p-10 text-center text-muted-foreground">
            No resources match. Try another search.
          </div>
        )}
      </div>

      <div className="mt-12 rounded-2xl border bg-card p-8 text-center">
        <div className="text-lg font-semibold">Looking for step-by-step guides?</div>
        <p className="mt-1 text-sm text-muted-foreground">Explore 100+ founder-focused articles.</p>
        <Link to="/explore" className="mt-4 inline-block"><Button className="gradient-hero text-primary-foreground shadow-glow">Explore Topics</Button></Link>
      </div>
    </div>
  );
}
