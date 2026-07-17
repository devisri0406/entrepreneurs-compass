import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Markdown } from "@/components/markdown";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Bookmark, Heart, Share2, Clock, ArrowLeft } from "lucide-react";
import { toggleBookmark, toggleLike } from "@/lib/user.functions";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/articles/$slug")({
  head: () => ({
    meta: [{ title: "Article — Startup Navigator" }],
  }),
  errorComponent: ({ error }) => <div className="p-10 text-center text-muted-foreground">{error.message}</div>,
  notFoundComponent: () => <div className="p-10 text-center text-muted-foreground">Article not found.</div>,
  component: ArticlePage,
});

function ArticlePage() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [progress, setProgress] = useState(0);

  const { data: article, isLoading, error } = useQuery({
    queryKey: ["article", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("articles").select("*, categories(name,slug)").eq("slug", slug).maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data;
    },
  });

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const p = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
      setProgress(Math.max(0, Math.min(100, p)));
    };
    document.addEventListener("scroll", onScroll);
    return () => document.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (article) document.title = `${article.title} — Startup Navigator`;
  }, [article]);

  const { data: related = [] } = useQuery({
    queryKey: ["related", article?.id, article?.category_id],
    enabled: !!article?.category_id,
    queryFn: async () => (await supabase.from("articles").select("id,slug,title,description").eq("category_id", article!.category_id).neq("id", article!.id).limit(3)).data ?? [],
  });

  const { data: interactions } = useQuery({
    queryKey: ["article-interactions", article?.id, user?.id],
    enabled: !!user && !!article,
    queryFn: async () => {
      const [b, l] = await Promise.all([
        supabase.from("bookmarks").select("id").eq("user_id", user!.id).eq("article_id", article!.id).maybeSingle(),
        supabase.from("likes").select("id").eq("user_id", user!.id).eq("article_id", article!.id).maybeSingle(),
      ]);
      return { bookmarked: !!b.data, liked: !!l.data };
    },
  });

  const toggleBookmarkFn = useServerFn(toggleBookmark);
  const toggleLikeFn = useServerFn(toggleLike);
  const bookmarkMut = useMutation({
    mutationFn: () => toggleBookmarkFn({ data: { articleId: article!.id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["article-interactions"] }); toast.success(interactions?.bookmarked ? "Bookmark removed" : "Bookmarked"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const likeMut = useMutation({
    mutationFn: () => toggleLikeFn({ data: { articleId: article!.id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["article-interactions"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const requireAuth = (fn: () => void) => {
    if (!user) { toast.info("Sign in to save"); return; }
    fn();
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="mt-4 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-5/6" />
        <Skeleton className="mt-8 h-96 w-full" />
      </div>
    );
  }
  if (error || !article) return <div className="p-10 text-center text-muted-foreground">Article not found.</div>;

  return (
    <div>
      <div className="fixed left-0 right-0 top-16 z-40 h-1 bg-transparent">
        <div className="h-full gradient-hero transition-all" style={{ width: `${progress}%` }} />
      </div>

      {article.cover_url && (
        <div className="relative h-64 w-full overflow-hidden bg-muted md:h-80">
          <img src={article.cover_url} alt={article.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        </div>
      )}

      <article className="mx-auto max-w-3xl px-4 py-10 md:px-6">
        <Link to="/explore" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Explore
        </Link>

        {article.categories && (
          <Badge variant="secondary" className="mb-3">{article.categories.name}</Badge>
        )}
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{article.title}</h1>
        <p className="mt-3 text-lg text-muted-foreground">{article.description}</p>

        <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span>By <span className="text-foreground">{article.author}</span></span>
          <span>·</span>
          <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {article.reading_time_min} min read</span>
          <span>·</span>
          <span>Updated {new Date(article.updated_at).toLocaleDateString()}</span>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => requireAuth(() => bookmarkMut.mutate())}>
            <Bookmark className={`mr-2 h-4 w-4 ${interactions?.bookmarked ? "fill-current" : ""}`} />
            {interactions?.bookmarked ? "Bookmarked" : "Bookmark"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => requireAuth(() => likeMut.mutate())}>
            <Heart className={`mr-2 h-4 w-4 ${interactions?.liked ? "fill-current text-primary" : ""}`} />
            {interactions?.liked ? "Liked" : "Like"}
          </Button>
          <Button variant="outline" size="sm" onClick={async () => {
            const url = window.location.href;
            if (navigator.share) { try { await navigator.share({ title: article.title, url }); } catch { /* cancelled */ } }
            else { await navigator.clipboard.writeText(url); toast.success("Link copied"); }
          }}>
            <Share2 className="mr-2 h-4 w-4" /> Share
          </Button>
        </div>

        <div className="mt-10">
          <Markdown>{article.content}</Markdown>
        </div>

        {(article.tags ?? []).length > 0 && (
          <div className="mt-10 flex flex-wrap gap-1.5">
            {article.tags.map((t: string) => <Badge key={t} variant="secondary">{t}</Badge>)}
          </div>
        )}

        {related.length > 0 && (
          <div className="mt-16">
            <h3 className="mb-4 text-xl font-semibold">Related articles</h3>
            <div className="grid gap-4 md:grid-cols-3">
              {related.map((r) => (
                <Link key={r.id} to="/articles/$slug" params={{ slug: r.slug }}>
                  <Card className="h-full transition-all hover:shadow-elegant"><CardContent className="p-5">
                    <div className="font-semibold">{r.title}</div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{r.description}</p>
                  </CardContent></Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
}
