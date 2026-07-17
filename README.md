# Startup Navigator

An AI-powered SaaS platform to help entrepreneurs explore every aspect of building and growing a startup — from company registration to exit.

## Features

- **Home** — premium landing with hero, features, stats, testimonials, FAQs
- **Explore Topics** — 100+ in-depth articles across 25 categories with search, filters, sorting
- **Article pages** — Markdown content, reading progress, bookmark, like, share, related articles
- **Startup AI Advisor** — ChatGPT-style RAG chat that searches the knowledge base and cites sources
- **Resources** — 75+ curated resources (government links, templates, tools) with search & save
- **Dashboard** — personal stats, weekly search chart, recent chats
- **Profile** — edit name/bio, sign out
- **Bookmarks** — view saved articles and resources
- **Admin** — protected CRUD for articles, first-admin bootstrap
- **Auth** — Email/password + Google OAuth (Lovable-managed)
- **Dark mode** — full theme support, persisted
- **SEO** — per-page metadata, OG tags, sitemap.xml, robots.txt

## Stack

- **Framework:** TanStack Start v1 (React 19 + Vite 7 + TypeScript, SSR/edge)
- **UI:** Tailwind CSS v4 + shadcn/ui + Lucide + Recharts
- **Backend:** Lovable Cloud (Postgres + Auth + RLS)
- **AI:** Lovable AI Gateway (Google Gemini 2.5 Flash) with tsvector-based RAG
- **Data fetching:** TanStack Query + TanStack Server Functions

## Architecture

```
Browser (React)
  │  UI: shadcn/ui + Tailwind v4 tokens (styles.css)
  │  State: TanStack Query + Supabase auth listener
  ▼
TanStack Start Server Functions  ─────▶  Lovable AI Gateway
  · requireSupabaseAuth (bearer)              (Gemini 2.5 Flash)
  · askAdvisor → RAG: tsvector search
                 → prompt with cited context
                 → persist conversation + messages
  ▼
Lovable Cloud (Postgres)
  · profiles / user_roles / has_role()
  · categories · articles (search_tsv GIN)
  · resources · faqs
  · bookmarks · likes
  · chat_conversations · chat_messages
  · search_history
  All tables: RLS enabled, per-user policies.
```

### AI RAG Workflow

1. User submits a question via `askAdvisor` server function.
2. Postgres full-text search (`websearch_to_tsquery` on `articles.search_tsv`) returns the top 5 relevant articles.
3. The top hits are injected into the system prompt as cited source excerpts.
4. Prior conversation messages are loaded (last 20) to preserve context.
5. The Lovable AI Gateway (`google/gemini-2.5-flash`) generates a Markdown answer.
6. Both user and assistant messages are persisted with sources and confidence.
7. Fallback: if the gateway fails, the response falls back to the top knowledge-base hits.

## Database Schema

| Table | Purpose |
|-------|---------|
| `profiles` | Public user profiles |
| `user_roles` | Role assignments (`admin` / `user`) — separate from profiles to prevent privilege escalation |
| `categories` | 25 topic categories |
| `articles` | 100 Markdown articles with generated `search_tsv` for full-text search |
| `resources` | 75 curated resource links |
| `faqs` | 50 FAQs |
| `bookmarks` | Per-user saves for articles/resources |
| `likes` | Per-user likes on articles |
| `chat_conversations` / `chat_messages` | Persisted AI chat history with sources |
| `search_history` | Per-user query log |

RLS: enabled on every table, scoped to `auth.uid()` for user-owned data; content tables are publicly readable and admin-writable via `has_role(auth.uid(), 'admin')`.

## Folder Structure

```
src/
  assets/          # generated hero image
  components/      # SiteHeader, SiteFooter, Markdown, ThemeProvider + shadcn ui
  hooks/           # use-auth
  integrations/    # generated supabase + lovable auth clients
  lib/             # ai.functions.ts, user.functions.ts, admin.functions.ts, ai-gateway.server.ts
  routes/          # file-based routes
    __root.tsx     # shell (header, footer, providers, auth listener)
    index.tsx      # /
    explore.tsx    # /explore
    articles.$slug.tsx  # /articles/:slug
    ai.tsx         # /ai (Startup AI Advisor)
    resources.tsx  # /resources
    auth.tsx       # /auth
    sitemap[.]xml.ts
    _authenticated/
      route.tsx    # auth gate (ssr: false)
      dashboard.tsx
      profile.tsx
      bookmarks.tsx
      admin.tsx
  styles.css       # design system (tokens, gradients, glass, elegant shadows)
```

## Getting Started

Lovable Cloud is already connected. To run locally:

```bash
bun install
bun dev
```

Environment variables are auto-provisioned by Lovable Cloud (`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `LOVABLE_API_KEY`). No `.env` editing required.

## Admin Bootstrap

The first authenticated user to visit `/admin` can click **Claim admin role** to become admin. After that, only existing admins can create additional admins (via a manual DB action).

## Deployment

This app is deployed via Lovable's edge deployment (Cloudflare Workers under the hood). Click **Publish** in the Lovable editor to ship.

## Security

- JWT auth via Supabase (Lovable Cloud)
- Row-Level Security on every table
- Bearer tokens attached to server functions via `attachSupabaseAuth` middleware
- Zod input validation on every server function
- Roles stored in a separate `user_roles` table with `has_role()` SECURITY DEFINER helper
- Server-only secrets never exposed to the client

## Credits

Built with love for founders. Design inspired by Stripe, Linear, and Notion.
