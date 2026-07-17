import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertAdmin(supabase: { from: (t: string) => { select: (s: string) => { eq: (c: string, v: string) => { eq: (c: string, v: string) => { maybeSingle: () => Promise<{ data: unknown }> } } } } }, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Forbidden: admin only");
}

export const adminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase as never, context.userId);
    const [articles, resources, faqs, cats] = await Promise.all([
      context.supabase.from("articles").select("id", { count: "exact", head: true }),
      context.supabase.from("resources").select("id", { count: "exact", head: true }),
      context.supabase.from("faqs").select("id", { count: "exact", head: true }),
      context.supabase.from("categories").select("id", { count: "exact", head: true }),
    ]);
    return {
      articles: articles.count ?? 0,
      resources: resources.count ?? 0,
      faqs: faqs.count ?? 0,
      categories: cats.count ?? 0,
    };
  });

const ArticleSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(2).max(120),
  title: z.string().min(2).max(200),
  description: z.string().min(2).max(500),
  content: z.string().min(2),
  category_id: z.string().uuid().nullable().optional(),
  tags: z.array(z.string()).default([]),
  reading_time_min: z.number().int().min(1).max(120).default(5),
  cover_url: z.string().url().nullable().optional().or(z.literal("")),
  published: z.boolean().default(true),
});

export const saveArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ArticleSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase as never, context.userId);
    const payload = { ...data, cover_url: data.cover_url || null };
    if (data.id) {
      await context.supabase.from("articles").update(payload).eq("id", data.id);
    } else {
      await context.supabase.from("articles").insert(payload);
    }
    return { ok: true };
  });

export const deleteArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase as never, context.userId);
    await context.supabase.from("articles").delete().eq("id", data.id);
    return { ok: true };
  });

export const grantSelfAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Bootstrap: allow the FIRST user to claim admin. After the first admin exists, this is a no-op.
    const { data: existing } = await context.supabase.from("user_roles").select("id").eq("role", "admin").limit(1);
    if (existing && existing.length > 0) {
      const { data: mine } = await context.supabase
        .from("user_roles").select("id").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
      if (!mine) throw new Error("Admin already exists. Ask an admin to grant you access.");
      return { alreadyAdmin: true };
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("user_roles").insert({ user_id: context.userId, role: "admin" });
    return { granted: true };
  });
