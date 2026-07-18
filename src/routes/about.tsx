import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Rocket, Target, Eye, Sparkles, Users, Zap, Shield, Globe,
  ArrowRight, Database, Bot, Code2, Cloud,
} from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Startup Navigator — Our Mission & Story" },
      { name: "description", content: "Startup Navigator helps founders build faster with an AI-powered knowledge base, curated resources, and expert guidance." },
      { property: "og:title", content: "About Startup Navigator" },
      { property: "og:description", content: "The mission, vision, and story behind Startup Navigator." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});

const timeline = [
  { year: "2024", title: "The idea", body: "Founders were drowning in fragmented startup advice. We set out to unify it." },
  { year: "2025", title: "Knowledge base", body: "Curated hundreds of articles, resources, and playbooks across the founder journey." },
  { year: "2026", title: "AI Advisor", body: "Shipped an AI advisor grounded in our knowledge base to answer founder questions in seconds." },
  { year: "Today", title: "Growing together", body: "Serving thousands of founders with new content and features every week." },
];

const stack = [
  { icon: Code2, name: "TanStack Start", desc: "React 19 full-stack framework with SSR + type-safe routing." },
  { icon: Cloud, name: "Edge Runtime", desc: "Deployed globally on Cloudflare Workers for low latency." },
  { icon: Database, name: "Lovable Cloud", desc: "Postgres with Row Level Security and realtime for user data." },
  { icon: Bot, name: "Lovable AI Gateway", desc: "Gemini-powered retrieval-augmented generation for the AI Advisor." },
];

const values = [
  { icon: Shield, title: "Trustworthy", body: "Everything is fact-checked and sourced from proven playbooks." },
  { icon: Zap, title: "Fast", body: "Ship insights in seconds — no more digging through 20-tab research sessions." },
  { icon: Users, title: "Founder-first", body: "Built by founders, for founders. We use it to run our own company." },
  { icon: Globe, title: "Global", body: "Advice that works whether you're in Bangalore, Berlin, or Boston." },
];

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div className="pointer-events-none absolute inset-0 gradient-hero opacity-10" />
        <div className="mx-auto max-w-5xl px-4 py-24 text-center md:px-6">
          <Badge variant="secondary" className="mb-4"><Sparkles className="mr-1.5 h-3 w-3" /> Our story</Badge>
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
            Helping founders go from <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">idea to exit</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Startup Navigator is the AI-powered companion for the founder journey — a knowledge base, playbook library, and always-on advisor rolled into one.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/explore"><Button className="gradient-hero text-primary-foreground shadow-glow">Explore topics <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
            <Link to="/contact"><Button variant="outline">Get in touch</Button></Link>
          </div>
        </div>
      </section>

      {/* Mission + Vision */}
      <section className="mx-auto max-w-6xl px-4 py-20 md:px-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-primary/20"><CardContent className="p-8">
            <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl gradient-hero text-primary-foreground shadow-glow"><Target className="h-5 w-5" /></div>
            <h2 className="text-2xl font-semibold">Our mission</h2>
            <p className="mt-3 text-muted-foreground">
              Give every founder — regardless of network or geography — access to the same quality of advice, playbooks, and mentorship the best-funded startups take for granted.
            </p>
          </CardContent></Card>
          <Card className="border-primary/20"><CardContent className="p-8">
            <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl gradient-hero text-primary-foreground shadow-glow"><Eye className="h-5 w-5" /></div>
            <h2 className="text-2xl font-semibold">Our vision</h2>
            <p className="mt-3 text-muted-foreground">
              A world where great ideas succeed on merit, not on who you know — accelerated by AI that turns collective startup wisdom into an on-demand co-founder.
            </p>
          </CardContent></Card>
        </div>
      </section>

      {/* Values */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-20 md:px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight">What we stand for</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <Card key={v.title} className="transition-all hover:shadow-elegant"><CardContent className="p-6">
                <div className="mb-3 grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary"><v.icon className="h-5 w-5" /></div>
                <div className="font-semibold">{v.title}</div>
                <p className="mt-1 text-sm text-muted-foreground">{v.body}</p>
              </CardContent></Card>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="mx-auto max-w-4xl px-4 py-20 md:px-6">
        <h2 className="text-center text-3xl font-bold tracking-tight">Our journey</h2>
        <div className="mt-12 space-y-6">
          {timeline.map((t, i) => (
            <div key={i} className="relative flex gap-5">
              <div className="flex flex-col items-center">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full gradient-hero text-primary-foreground shadow-glow">
                  <Rocket className="h-4 w-4" />
                </div>
                {i < timeline.length - 1 && <div className="mt-2 h-full w-px flex-1 bg-border" />}
              </div>
              <Card className="mb-2 flex-1"><CardContent className="p-5">
                <div className="text-xs font-semibold uppercase tracking-wider text-primary">{t.year}</div>
                <div className="mt-1 text-lg font-semibold">{t.title}</div>
                <p className="mt-1 text-sm text-muted-foreground">{t.body}</p>
              </CardContent></Card>
            </div>
          ))}
        </div>
      </section>

      {/* Tech stack */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-20 md:px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">Built on a modern stack</h2>
            <p className="mt-3 text-muted-foreground">Fast, secure, and designed to scale with your business.</p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stack.map((s) => (
              <Card key={s.name} className="glass transition-all hover:shadow-elegant"><CardContent className="p-6">
                <div className="mb-3 grid h-10 w-10 place-items-center rounded-lg gradient-hero text-primary-foreground shadow-glow"><s.icon className="h-5 w-5" /></div>
                <div className="font-semibold">{s.name}</div>
                <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
              </CardContent></Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="mx-auto max-w-5xl px-4 py-20 md:px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">A small team with a big mission</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Startup Navigator is built by a lean team of founders, engineers, and writers who've shipped, scaled, and sometimes stumbled.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            { role: "Founders", n: "3" },
            { role: "Contributors", n: "12+" },
            { role: "Countries", n: "8" },
          ].map((c) => (
            <Card key={c.role}><CardContent className="p-8 text-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">{c.n}</div>
              <div className="mt-2 text-sm uppercase tracking-wider text-muted-foreground">{c.role}</div>
            </CardContent></Card>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link to="/contact"><Button size="lg" className="gradient-hero text-primary-foreground shadow-glow">Join our journey <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
        </div>
      </section>
    </div>
  );
}
