import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowRight, Sparkles, Building2, Banknote, Megaphone, UserPlus, Scale, Receipt, Palette, Bot, Rocket, Star, Check } from "lucide-react";
import heroImg from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Startup Navigator — AI Guide to Building Startups" },
      { name: "description", content: "Explore 25+ startup topics, get AI-powered answers, and access curated resources — from registration to exit." },
      { property: "og:title", content: "Startup Navigator" },
      { property: "og:description", content: "Your AI-powered guide to building successful startups." },
    ],
  }),
  component: Home,
});

const features = [
  { icon: Building2, title: "Company Registration", desc: "Incorporate the right entity, DPIIT, DIN, DSC." },
  { icon: Banknote, title: "Funding & Investors", desc: "Seed, angels, VC, term sheets, cap tables." },
  { icon: Megaphone, title: "Marketing & Sales", desc: "Growth playbooks that actually work." },
  { icon: UserPlus, title: "Hiring & ESOPs", desc: "Build a team without breaking the bank." },
  { icon: Scale, title: "Legal Compliance", desc: "Founders' agreements, contracts, IP." },
  { icon: Receipt, title: "GST & Taxation", desc: "Stay compliant from day one." },
  { icon: Palette, title: "Branding & Design", desc: "Positioning that resonates." },
  { icon: Bot, title: "AI Tools", desc: "Curated stack to move 10× faster." },
  { icon: Rocket, title: "Growth & Scaling", desc: "From product-market fit to exit." },
];

const stats = [
  { value: "25+", label: "Startup topics" },
  { value: "100+", label: "In-depth articles" },
  { value: "75+", label: "Curated resources" },
  { value: "24/7", label: "AI advisor" },
];

const testimonials = [
  { name: "Ananya S.", role: "Founder, FinPay", text: "The AI advisor answered our GST questions in seconds. Saved us hours of research." },
  { name: "Rahul K.", role: "CTO, BuildAI", text: "The curated resources are gold. It's like having a mentor on call." },
  { name: "Meera P.", role: "COO, GreenLoop", text: "Explore Topics is where we go for every new decision. Beautifully organized." },
];

const faqs = [
  { q: "Is Startup Navigator free?", a: "Yes — reading articles, browsing resources, and asking the AI advisor are all free while you're signed in." },
  { q: "Which countries do you cover?", a: "We focus on India-specific playbooks (Startup India, MCA, GST) with globally applicable frameworks for funding, growth, and product." },
  { q: "How does the AI advisor work?", a: "The AI searches our knowledge base for the most relevant articles, then uses a large language model to synthesise an answer with citations." },
  { q: "Can I save articles?", a: "Yes — sign in to bookmark articles and resources, and access them anytime from your dashboard." },
];

function Home() {
  const { data: categories = [] } = useQuery({
    queryKey: ["home-categories"],
    queryFn: async () => (await supabase.from("categories").select("*").order("sort_order").limit(9)).data ?? [],
  });

  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative overflow-hidden gradient-mesh">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 md:grid-cols-2 md:px-6 md:py-28">
          <div className="flex flex-col justify-center">
            <Badge variant="secondary" className="mb-4 w-fit gap-1">
              <Sparkles className="h-3 w-3" /> AI-powered startup guidance
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
              Your AI guide to <span className="text-gradient">building startups</span>.
            </h1>
            <p className="mt-4 max-w-xl text-lg text-muted-foreground">
              From company registration to raising capital, hiring, marketing, and exit — everything a founder needs, in one place.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/explore">
                <Button size="lg" className="gradient-hero text-primary-foreground shadow-glow">
                  Explore Topics <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/ai">
                <Button size="lg" variant="outline"><Bot className="mr-2 h-4 w-4" /> Ask AI</Button>
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5"><Check className="h-4 w-4 text-primary" /> India-focused</div>
              <div className="flex items-center gap-1.5"><Check className="h-4 w-4 text-primary" /> Cited answers</div>
              <div className="flex items-center gap-1.5"><Check className="h-4 w-4 text-primary" /> Free to use</div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 -z-10 gradient-hero opacity-20 blur-3xl" />
            <img
              src={heroImg}
              alt="Illustration of a rocket ascending mountain peaks representing the startup journey"
              width={1600} height={1000}
              className="rounded-2xl border shadow-elegant"
            />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y bg-card">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 md:grid-cols-4 md:px-6">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-bold tracking-tight md:text-4xl">{s.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-20 md:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Everything a founder needs</h2>
          <p className="mt-3 text-muted-foreground">Explore playbooks across the full startup lifecycle.</p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="group border-border/60 transition-all hover:-translate-y-0.5 hover:shadow-elegant">
              <CardContent className="p-6">
                <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl gradient-hero text-primary-foreground shadow-glow">
                  <f.icon className="h-5 w-5" />
                </div>
                <div className="text-lg font-semibold">{f.title}</div>
                <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Categories preview */}
      <section className="border-t bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-20 md:px-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Popular categories</h2>
              <p className="mt-2 text-muted-foreground">Dive into curated startup playbooks.</p>
            </div>
            <Link to="/explore"><Button variant="ghost">All categories <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => (
              <Link key={c.id} to="/explore" search={{ category: c.slug }}>
                <Card className="h-full transition-all hover:shadow-elegant">
                  <CardContent className="p-5">
                    <div className="text-base font-semibold">{c.name}</div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-7xl px-4 py-20 md:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">Loved by founders</h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {testimonials.map((t) => (
            <Card key={t.name} className="border-border/60">
              <CardContent className="p-6">
                <div className="flex gap-1 text-primary">{[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}</div>
                <p className="mt-3 text-sm text-foreground/90">"{t.text}"</p>
                <div className="mt-4 text-sm"><span className="font-medium">{t.name}</span> <span className="text-muted-foreground">· {t.role}</span></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQs */}
      <section className="border-t bg-muted/40">
        <div className="mx-auto max-w-3xl px-4 py-20 md:px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight">Frequently asked</h2>
          <Accordion type="single" collapsible className="mt-8">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={String(i)}>
                <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-20 md:px-6">
        <div className="overflow-hidden rounded-3xl gradient-hero p-10 text-primary-foreground shadow-glow md:p-16">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Ready to build?</h2>
            <p className="mt-3 opacity-90">Ask the AI advisor anything, or browse 100+ startup guides.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/ai"><Button size="lg" variant="secondary">Open AI Advisor</Button></Link>
              <Link to="/explore"><Button size="lg" variant="outline" className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">Explore Topics</Button></Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
