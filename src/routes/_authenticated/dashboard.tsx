import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getUserDashboard } from "@/lib/user.functions";
import { Card, CardContent } from "@/components/ui/card";
import { BookmarkIcon, MessageSquare, Search, TrendingUp } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Startup Navigator" }] }),
  component: Dashboard,
});

function Dashboard() {
  const fn = useServerFn(getUserDashboard);
  const { data } = useQuery({ queryKey: ["dashboard"], queryFn: () => fn() });

  const stats = [
    { icon: Search, label: "Total searches", value: data?.totalSearches ?? 0 },
    { icon: BookmarkIcon, label: "Bookmarks", value: data?.bookmarksCount ?? 0 },
    { icon: MessageSquare, label: "AI chats", value: data?.conversations?.length ?? 0 },
    { icon: TrendingUp, label: "Article bookmarks", value: data?.articleBookmarks ?? 0 },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Your dashboard</h1>
      <p className="mt-2 text-muted-foreground">Track your learning, saved content, and AI activity.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}><CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">{s.label}</div>
                <div className="mt-1 text-3xl font-bold">{s.value}</div>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-lg gradient-hero text-primary-foreground shadow-glow">
                <s.icon className="h-4 w-4" />
              </div>
            </div>
          </CardContent></Card>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card><CardContent className="p-6">
          <div className="mb-4 font-semibold">Searches this week</div>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={data?.weekly ?? []}>
                <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Bar dataKey="count" fill="var(--primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent></Card>

        <Card><CardContent className="p-6">
          <div className="mb-4 font-semibold">Recent searches</div>
          <ul className="space-y-2 text-sm">
            {(data?.recentSearches ?? []).slice(0, 8).map((s) => (
              <li key={s.id} className="flex items-center justify-between rounded-md border p-2">
                <span className="truncate">{s.query}</span>
                <span className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</span>
              </li>
            ))}
            {(data?.recentSearches ?? []).length === 0 && (
              <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                Ask the AI to see searches here. <Link className="text-primary" to="/ai">Open AI Advisor →</Link>
              </div>
            )}
          </ul>
        </CardContent></Card>
      </div>

      <div className="mt-8">
        <Card><CardContent className="p-6">
          <div className="mb-4 font-semibold">Recent AI chats</div>
          <ul className="grid gap-3 md:grid-cols-2">
            {(data?.conversations ?? []).map((c) => (
              <li key={c.id}>
                <Link to="/ai" search={{ id: c.id }} className="block rounded-lg border p-3 transition-colors hover:bg-muted">
                  <div className="truncate font-medium">{c.title}</div>
                  <div className="text-xs text-muted-foreground">{new Date(c.updated_at).toLocaleString()}</div>
                </Link>
              </li>
            ))}
            {(data?.conversations ?? []).length === 0 && (
              <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground md:col-span-2">
                No conversations yet. <Link className="text-primary" to="/ai">Start a chat →</Link>
              </div>
            )}
          </ul>
        </CardContent></Card>
      </div>
    </div>
  );
}
