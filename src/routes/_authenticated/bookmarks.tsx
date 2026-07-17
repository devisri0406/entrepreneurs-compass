import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyBookmarks } from "@/lib/user.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Bookmark, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/_authenticated/bookmarks")({
  head: () => ({ meta: [{ title: "Bookmarks — Startup Navigator" }] }),
  component: Bookmarks,
});

interface BookmarkRow {
  id: string;
  articles?: { id: string; slug: string; title: string; description: string } | null;
  resources?: { id: string; title: string; description: string; url: string; category: string } | null;
}

function Bookmarks() {
  const fn = useServerFn(getMyBookmarks);
  const { data = [] } = useQuery({ queryKey: ["my-bookmarks"], queryFn: () => fn() as unknown as Promise<BookmarkRow[]> });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Your bookmarks</h1>
      <p className="mt-2 text-muted-foreground">Everything you've saved for later.</p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {data.map((b) => b.articles ? (
          <Link key={b.id} to="/articles/$slug" params={{ slug: b.articles!.slug }}>
            <Card className="transition-all hover:shadow-elegant"><CardContent className="p-5">
              <div className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground"><Bookmark className="h-3 w-3" /> Article</div>
              <div className="font-semibold">{b.articles!.title}</div>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{b.articles!.description}</p>
            </CardContent></Card>
          </Link>
        ) : b.resources ? (
          <a key={b.id} href={b.resources!.url} target="_blank" rel="noreferrer">
            <Card className="transition-all hover:shadow-elegant"><CardContent className="p-5">
              <div className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground"><ExternalLink className="h-3 w-3" /> Resource</div>
              <div className="font-semibold">{b.resources!.title}</div>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{b.resources!.description}</p>
            </CardContent></Card>
          </a>
        ) : null)}
        {data.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed p-10 text-center text-muted-foreground">
            You haven't saved anything yet. <Link to="/explore" className="text-primary">Explore articles →</Link>
          </div>
        )}
      </div>
    </div>
  );
}
