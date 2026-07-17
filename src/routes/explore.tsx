import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ArrowRight, Clock } from "lucide-react";

interface ExploreSearch { q?: string; category?: string; sort?: "newest" | "oldest" | "title" }
const searchSchema = z.object({
  q: z.string().optional().catch(""),
  category: z.string().optional().catch(""),
  sort: z.enum(["newest", "oldest", "title"]).optional().catch("newest"),
});

export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "Explore Startup Topics — Startup Navigator" },
      { name: "description", content: "Browse 100+ in-depth guides across 25 startup topics: registration, funding, marketing, hiring, legal, and more." },
    ],
  }),
  validateSearch: (s): ExploreSearch => searchSchema.parse(s) as ExploreSearch,
  component: Explore,
});

function Explore() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [q, setQ] = useState(search.q ?? "");

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await supabase.from("categories").select("*").order("sort_order")).data ?? [],
  });

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["articles", search],
    queryFn: async () => {
      let query = supabase.from("articles").select("id,slug,title,description,tags,cover_url,reading_time_min,category_id,created_at").eq("published", true);
      if (search.category) {
        const cat = (await supabase.from("categories").select("id").eq("slug", search.category).maybeSingle()).data;
        if (cat) query = query.eq("category_id", cat.id);
      }
      if (search.q) query = query.or(`title.ilike.%${search.q}%,description.ilike.%${search.q}%`);
      const sort = search.sort ?? "newest";
      if (sort === "newest") query = query.order("created_at", { ascending: false });
      else if (sort === "oldest") query = query.order("created_at", { ascending: true });
      else query = query.order("title");
      return (await query.limit(120)).data ?? [];
    },
  });

  const activeCat = search.category;
  const chipCls = (active: boolean) =>
    `rounded-full border px-3 py-1 text-xs transition-colors ${active ? "gradient-hero text-primary-foreground border-transparent shadow-glow" : "border-border bg-card hover:bg-muted"}`;

  const filtered = useMemo(() => articles, [articles]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Explore Startup Topics</h1>
        <p className="mt-2 text-muted-foreground">100+ in-depth guides across 25 categories.</p>
      </div>

      <form
        className="flex flex-col gap-3 md:flex-row md:items-center"
        onSubmit={(e) => { e.preventDefault(); navigate({ search: (s: ExploreSearch) => ({ ...s, q }) }); }}
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search articles…" className="pl-9" />
        </div>
        <select
          value={search.sort ?? "newest"}
          onChange={(e) => navigate({ search: (s: ExploreSearch) => ({ ...s, sort: e.target.value as "newest" | "oldest" | "title" }) })}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="title">Title A–Z</option>
        </select>
        <Button type="submit" className="gradient-hero text-primary-foreground shadow-glow">Search</Button>
      </form>

      <div className="mt-6 flex flex-wrap gap-2">
        <button className={chipCls(!activeCat)} onClick={() => navigate({ search: (s: ExploreSearch) => ({ ...s, category: undefined }) })}>All</button>
        {categories.map((c) => (
          <button key={c.id} className={chipCls(activeCat === c.slug)} onClick={() => navigate({ search: (s: ExploreSearch) => ({ ...s, category: c.slug }) })}>
            {c.name}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading && Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-56 w-full rounded-xl" />
        ))}
        {!isLoading && filtered.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed p-10 text-center text-muted-foreground">
            No articles match your search.
          </div>
        )}
        {filtered.map((a) => (
          <Link key={a.id} to="/articles/$slug" params={{ slug: a.slug }}>
            <Card className="h-full overflow-hidden border-border/60 transition-all hover:-translate-y-0.5 hover:shadow-elegant">
              {a.cover_url && (
                <div className="aspect-[16/9] w-full overflow-hidden bg-muted">
                  <img src={a.cover_url} alt={a.title} loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                </div>
              )}
              <CardContent className="p-5">
                <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" /> {a.reading_time_min} min read
                </div>
                <div className="text-lg font-semibold leading-snug">{a.title}</div>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{a.description}</p>
                <div className="mt-4 flex flex-wrap gap-1">
                  {(a.tags ?? []).slice(0, 3).map((t) => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
                </div>
                <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                  Read more <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
