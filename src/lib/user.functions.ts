import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const toggleBookmark = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        articleId: z.string().uuid().optional(),
        resourceId: z.string().uuid().optional(),
      })
      .refine((v) => v.articleId || v.resourceId, "One id required")
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const filter = data.articleId
      ? { column: "article_id", value: data.articleId }
      : { column: "resource_id", value: data.resourceId! };

    const { data: existing } = await supabase
      .from("bookmarks")
      .select("id")
      .eq("user_id", userId)
      .eq(filter.column, filter.value)
      .maybeSingle();

    if (existing) {
      await supabase.from("bookmarks").delete().eq("id", existing.id);
      return { bookmarked: false };
    }
    await supabase.from("bookmarks").insert({
      user_id: userId,
      article_id: data.articleId ?? null,
      resource_id: data.resourceId ?? null,
    });
    return { bookmarked: true };
  });

export const toggleLike = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ articleId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: existing } = await supabase
      .from("likes")
      .select("id")
      .eq("user_id", userId)
      .eq("article_id", data.articleId)
      .maybeSingle();
    if (existing) {
      await supabase.from("likes").delete().eq("id", existing.id);
      return { liked: false };
    }
    await supabase.from("likes").insert({ user_id: userId, article_id: data.articleId });
    return { liked: true };
  });

export const getUserDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [searches, bookmarks, chats, recent] = await Promise.all([
      supabase.from("search_history").select("id,query,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
      supabase.from("bookmarks").select("id,article_id,resource_id,created_at").eq("user_id", userId),
      supabase.from("chat_conversations").select("id,title,updated_at").eq("user_id", userId).order("updated_at", { ascending: false }).limit(10),
      supabase.from("search_history").select("created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(200),
    ]);
    // Build a weekly count for the last 7 days.
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i)); d.setHours(0, 0, 0, 0);
      return d;
    });
    const weekly = days.map((d, i) => {
      const next = i < 6 ? days[i + 1].getTime() : Date.now() + 86400000;
      const count = (recent.data ?? []).filter((r) => {
        const t = new Date(r.created_at).getTime();
        return t >= d.getTime() && t < next;
      }).length;
      return { day: d.toLocaleDateString(undefined, { weekday: "short" }), count };
    });

    return {
      totalSearches: (searches.data ?? []).length,
      recentSearches: searches.data ?? [],
      bookmarksCount: (bookmarks.data ?? []).length,
      articleBookmarks: (bookmarks.data ?? []).filter((b) => b.article_id).length,
      resourceBookmarks: (bookmarks.data ?? []).filter((b) => b.resource_id).length,
      conversations: chats.data ?? [],
      weekly,
    };
  });

export const getMyBookmarks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("bookmarks")
      .select("id,article_id,resource_id,created_at, articles(id,slug,title,description,cover_url), resources(id,title,description,url,category)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    return data ?? [];
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      full_name: z.string().trim().max(100).optional(),
      bio: z.string().trim().max(500).optional(),
      avatar_url: z.string().url().max(500).optional().or(z.literal("")),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const payload: { full_name?: string | null; bio?: string | null; avatar_url?: string | null } = {};
    if (data.full_name !== undefined) payload.full_name = data.full_name;
    if (data.bio !== undefined) payload.bio = data.bio;
    if (data.avatar_url !== undefined) payload.avatar_url = data.avatar_url || null;
    await context.supabase.from("profiles").update(payload).eq("id", context.userId);
    return { ok: true };
  });

export const isAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    return { admin: !!data };
  });
