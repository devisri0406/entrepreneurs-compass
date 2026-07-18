import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminStats, saveArticle, deleteArticle } from "@/lib/admin.functions";
import { isAdmin } from "@/lib/user.functions";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useState } from "react";
import { FileText, BookOpen, HelpCircle, LayoutGrid, ShieldCheck, Trash2, Pencil } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — Startup Navigator" }] }),
  component: Admin,
});

interface ArticleForm {
  id?: string;
  slug: string; title: string; description: string; content: string;
  category_id: string | null; tags: string; reading_time_min: number; cover_url: string; published: boolean;
}

const EMPTY: ArticleForm = { slug: "", title: "", description: "", content: "", category_id: null, tags: "", reading_time_min: 5, cover_url: "", published: true };

function Admin() {
  const qc = useQueryClient();
  const isAdminFn = useServerFn(isAdmin);
  const statsFn = useServerFn(adminStats);
  // grantSelfAdmin removed for security — admin role is assigned manually by an existing admin.
  const saveFn = useServerFn(saveArticle);
  const deleteFn = useServerFn(deleteArticle);

  const { data: adminCheck, isLoading: checking } = useQuery({ queryKey: ["is-admin"], queryFn: () => isAdminFn() });
  const isAdminUser = adminCheck?.admin ?? false;

  const { data: stats } = useQuery({ queryKey: ["admin-stats"], queryFn: () => statsFn(), enabled: isAdminUser });
  const { data: categories = [] } = useQuery({ queryKey: ["cats"], queryFn: async () => (await supabase.from("categories").select("*").order("sort_order")).data ?? [] });
  const { data: articles = [] } = useQuery({
    queryKey: ["admin-articles"], enabled: isAdminUser,
    queryFn: async () => (await supabase.from("articles").select("id,slug,title,description,category_id,published,updated_at").order("updated_at", { ascending: false }).limit(200)).data ?? [],
  });

  const [form, setForm] = useState<ArticleForm>(EMPTY);
  const [editing, setEditing] = useState(false);

  const save = useMutation({
    mutationFn: () => saveFn({ data: {
      id: form.id,
      slug: form.slug, title: form.title, description: form.description, content: form.content,
      category_id: form.category_id, tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      reading_time_min: Number(form.reading_time_min), cover_url: form.cover_url, published: form.published,
    } }),
    onSuccess: () => { toast.success("Saved"); setForm(EMPTY); setEditing(false); qc.invalidateQueries({ queryKey: ["admin-articles"] }); qc.invalidateQueries({ queryKey: ["admin-stats"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-articles"] }); qc.invalidateQueries({ queryKey: ["admin-stats"] }); },
  });


  if (checking) return <div className="p-10 text-center text-muted-foreground">Loading…</div>;

  if (!isAdminUser) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl gradient-hero text-primary-foreground shadow-glow"><ShieldCheck className="h-5 w-5" /></div>
        <h1 className="text-2xl font-bold">Admin access required</h1>
        <p className="mt-2 text-muted-foreground">This area is restricted. Ask an existing administrator to grant you access.</p>
      </div>
    );
  }
        <Button onClick={() => grant.mutate()} className="mt-6 gradient-hero text-primary-foreground shadow-glow">Claim admin role</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Admin</h1>
      <p className="mt-2 text-muted-foreground">Manage articles and view content stats.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: FileText, label: "Articles", value: stats?.articles ?? 0 },
          { icon: BookOpen, label: "Resources", value: stats?.resources ?? 0 },
          { icon: HelpCircle, label: "FAQs", value: stats?.faqs ?? 0 },
          { icon: LayoutGrid, label: "Categories", value: stats?.categories ?? 0 },
        ].map((s) => (
          <Card key={s.label}><CardContent className="flex items-center justify-between p-5">
            <div><div className="text-sm text-muted-foreground">{s.label}</div><div className="mt-1 text-2xl font-bold">{s.value}</div></div>
            <div className="grid h-10 w-10 place-items-center rounded-lg gradient-hero text-primary-foreground shadow-glow"><s.icon className="h-4 w-4" /></div>
          </CardContent></Card>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card><CardContent className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="font-semibold">{editing ? "Edit article" : "Create article"}</div>
            {editing && <Button variant="ghost" size="sm" onClick={() => { setForm(EMPTY); setEditing(false); }}>Cancel</Button>}
          </div>
          <div className="grid gap-3">
            <div><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="unique-slug" /></div>
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
            <div><Label>Category</Label>
              <select value={form.category_id ?? ""} onChange={(e) => setForm({ ...form, category_id: e.target.value || null })} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                <option value="">— none —</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Reading time (min)</Label><Input type="number" value={form.reading_time_min} onChange={(e) => setForm({ ...form, reading_time_min: Number(e.target.value) })} /></div>
              <div><Label>Cover image URL</Label><Input value={form.cover_url} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} placeholder="https://…" /></div>
            </div>
            <div><Label>Tags (comma-separated)</Label><Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="startup, funding, india" /></div>
            <div><Label>Content (Markdown)</Label><Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={10} /></div>
            <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} /> Published</label>
            <Button onClick={() => save.mutate()} disabled={save.isPending} className="gradient-hero text-primary-foreground shadow-glow">{save.isPending ? "Saving…" : "Save article"}</Button>
          </div>
        </CardContent></Card>

        <Card><CardContent className="p-6">
          <div className="mb-4 font-semibold">Articles ({articles.length})</div>
          <div className="max-h-[560px] space-y-2 overflow-y-auto">
            {articles.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                <div className="min-w-0 flex-1 truncate">
                  <div className="truncate font-medium">{a.title}</div>
                  <div className="truncate text-xs text-muted-foreground">/{a.slug}</div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button size="icon" variant="ghost" onClick={async () => {
                    const { data } = await supabase.from("articles").select("*").eq("id", a.id).single();
                    if (data) { setForm({
                      id: data.id, slug: data.slug, title: data.title, description: data.description, content: data.content,
                      category_id: data.category_id, tags: (data.tags ?? []).join(", "),
                      reading_time_min: data.reading_time_min, cover_url: data.cover_url ?? "", published: data.published,
                    }); setEditing(true); }
                  }}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => { if (confirm("Delete this article?")) del.mutate(a.id); }}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent></Card>
      </div>
    </div>
  );
}
