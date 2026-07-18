# Startup Navigator - Entrepreneurs Compass

https://entrepreneurs-compass.vercel.app/

An AI-powered SaaS platform that helps entrepreneurs explore every aspect of building and growing a startup — from idea validation and company registration to scaling and exit strategies.

## Product Overview

Startup Navigator is an AI-powered startup knowledge platform designed to guide founders through every stage of their entrepreneurial journey.

The platform combines:

- A structured startup knowledge base
- AI-powered startup assistance
- Curated resources and tools
- Founder dashboards and personalization

It helps entrepreneurs make informed decisions faster by providing reliable startup information and AI-guided insights.

---

# Features

- **Home** — Premium landing page with hero section, features, stats, testimonials, FAQs, About section, and Contact section
- **About** — Explains the mission, vision, and purpose behind Startup Navigator
- **Contact** — Allows users to reach out for questions, feedback, and support
- **Explore Topics** — 100+ in-depth articles across 25 categories with search, filters, and sorting
- **Article Pages** — Markdown content, reading progress, bookmarks, likes, shares, and related articles
- **Startup AI Advisor** — ChatGPT-style RAG assistant that searches the knowledge base and provides cited answers
- **Resources** — 75+ curated startup resources including government links, templates, and tools with search and save functionality
- **Dashboard** — Personal statistics, weekly search activity, recent AI conversations, and user insights
- **Profile** — Edit profile information and manage account settings
- **Bookmarks** — View saved articles and resources
- **Admin Panel** — Protected content management system for administrators
- **Authentication** — Email/password authentication and Google OAuth
- **Dark Mode** — Complete theme support with persistence
- **SEO** — Per-page metadata, Open Graph tags, sitemap.xml, and robots.txt

---

# User Roles & Permissions

Startup Navigator supports two user roles:

## User

Users can:

- Browse startup articles and resources
- Explore startup topics
- Search the knowledge base
- Use Startup AI Advisor
- Receive AI-generated startup guidance
- Bookmark articles and resources
- Like articles
- Manage profile information
- View dashboard statistics
- Access saved conversations

## Admin

Admins have all user permissions plus:

- Access protected admin dashboard
- Create new articles
- Edit existing articles
- Delete articles
- Manage resources
- Manage FAQs
- Maintain startup knowledge content

Role permissions are enforced through Supabase authentication, database Row-Level Security policies, and server-side authorization checks.

---

# Content Management

Admins can manage the Startup Navigator knowledge base through a protected admin dashboard.

Admin capabilities include:

- Creating Markdown-based articles
- Updating existing articles
- Removing outdated content
- Managing startup categories
- Managing curated resources
- Managing FAQs

All content operations are protected using:

- Authentication checks
- Admin role verification
- Row-Level Security policies
- Server-side validation

---

# Technology Stack

- **Framework:** TanStack Start v1 (React 19 + Vite 7 + TypeScript, SSR/edge)
- **UI:** Tailwind CSS v4 + shadcn/ui + Lucide Icons + Recharts
- **Backend:** Lovable Cloud (PostgreSQL + Authentication + Row-Level Security)
- **AI:** Lovable AI Gateway using Google Gemini 2.5 Flash with tsvector-based RAG
- **Data Fetching:** TanStack Query + TanStack Server Functions
- **Deployment:** Vercel

---

# Architecture

```
Browser (React)
  │
  │ UI Layer
  │ shadcn/ui + Tailwind CSS v4
  │
  │ State Management
  │ TanStack Query + Supabase Auth Listener
  ▼

TanStack Start Server Functions

  ├── Authentication Middleware
  │      requireSupabaseAuth
  │
  ├── User Functions
  │      Profile management
  │      Bookmarks
  │      Likes
  │      Search history
  │
  ├── Admin Functions
  │      Article CRUD
  │      Resource management
  │      FAQ management
  │
  └── AI Functions
         askAdvisor
         RAG search
   AI response generation

              ▼

      Lovable AI Gateway

              ▼

    Google Gemini 2.5 Flash

              ▼

     Lovable Cloud PostgreSQL

  profiles
  user_roles
  categories
  articles
  resources
  faqs
  bookmarks
  likes
  chat_conversations
  chat_messages
  search_history

All database tables are protected with Row-Level Security.
```

---

# AI RAG Workflow

1. User submits a question through Startup AI Advisor.
2. The `askAdvisor` server function receives the request.
3. PostgreSQL full-text search (`websearch_to_tsquery`) searches relevant articles.
4. The top 5 matching articles are selected.
5. Relevant article content is injected into the AI prompt as cited context.
6. Previous conversation messages are loaded to maintain context.
7. Google Gemini 2.5 Flash generates a Markdown response.
8. User and assistant messages are stored with sources and confidence information.
9. If AI generation fails, the system falls back to knowledge-base search results.

---

# Database Schema

| Table | Purpose |
|---|---|
| `profiles` | Public user profiles |
| `user_roles` | Role assignments (`admin` / `user`) separate from profiles to prevent privilege escalation |
| `categories` | Startup topic categories |
| `articles` | Markdown startup articles with generated search indexes |
| `resources` | Curated startup resources |
| `faqs` | Frequently asked questions |
| `bookmarks` | User saved articles and resources |
| `likes` | User article likes |
| `chat_conversations` | Saved AI conversation sessions |
| `chat_messages` | AI conversation messages and responses |
| `search_history` | User search activity |

### Database Security

- RLS enabled on every table
- User-owned data scoped using `auth.uid()`
- Public content readable where required
- Write operations restricted to administrators
- Admin verification handled through `has_role()` SECURITY DEFINER helper

---

# Folder Structure

```
src/
  assets/
    # Generated images and static assets

  components/
    # SiteHeader
    # SiteFooter
    # Markdown renderer
    # ThemeProvider
    # shadcn/ui components

  hooks/
    # Authentication hooks

  integrations/
    # Supabase and Lovable generated clients

  lib/
    # ai.functions.ts
    # user.functions.ts
    # admin.functions.ts
    # ai-gateway.server.ts

  routes/

    __root.tsx
      # Application shell
      # Header, footer, providers, auth listener

    index.tsx
      # Home page

    explore.tsx
      # Explore startup topics

    articles.$slug.tsx
      # Article detail pages

    ai.tsx
      # Startup AI Advisor

    resources.tsx
      # Resources library

    auth.tsx
      # Authentication

    about.tsx
      # About page

    contact.tsx
      # Contact page

    sitemap[.]xml.ts

    _authenticated/

      route.tsx
        # Authentication protection

      dashboard.tsx
        # User dashboard

      profile.tsx
        # User profile

      bookmarks.tsx
        # Saved content

      admin.tsx
        # Admin dashboard

  styles.css
    # Design system
    # Theme tokens
    # Gradients
    # Glass effects
    # Shadows
```

---

# Getting Started

Startup Navigator was built using Lovable and connected with Lovable Cloud.

To run locally:

```bash
bun install
bun dev
```

Environment variables are automatically provided by Lovable Cloud:

```
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
LOVABLE_API_KEY
```

No manual environment configuration is required.

---

# Admin Bootstrap

The first administrator can be initialized through the admin bootstrap process.

After the first admin account is created:

- Only existing administrators can grant admin permissions
- Normal users cannot modify roles
- Role permissions are controlled through database policies

---

# Deployment

The deployment workflow:

```
    Lovable
       |
       ▼
GitHub Repository
       |
       ▼
Vercel Deployment

```
The application was built using Lovable, version-controlled with GitHub, and deployed on Vercel.

Post-deployment maintenance:
- Monitored application behavior after deployment
- Identified and fixed bugs independently
- Improved stability and user experience through continuous updates
- Maintained code quality and deployment workflow through GitHub version control

---

# Security

Startup Navigator follows production-focused security practices:

- JWT authentication using Supabase Auth
- Row-Level Security enabled on all database tables
- Server-side authorization checks
- Bearer tokens attached to server functions
- Zod validation for server inputs
- Admin roles stored separately from user profiles
- SECURITY DEFINER role verification helper
- Server-only secrets never exposed to clients

---

# Future Roadmap

Planned improvements:

- AI startup idea validation
- Business model canvas generator
- Startup cost calculator
- Business plan generator
- Investor pitch deck generator
- Founder community features
- Multi-language support
- Advanced AI startup coaching

---

# Credits

Built with love for founders.

Design inspiration:

- Stripe
- Linear
- Notion
