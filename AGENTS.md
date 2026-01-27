# FableLab - K12 STEM Learning AI Playground

## Core Commands

### Development
• Start dev server: `bun dev`
• Run type check: `bun tsc --noEmit`
• Lint code: `bun lint`
• Auto-fix lint: `bun lint:fix`
• Format code: `bun format`

### Database
• Generate migration: `bun db:generate`
• Apply migration: `bun db:migrate`
• Push schema: `bun db:push`
• Open DB studio: `bun db:studio`
• Drop tables: `bun db:drop`
• Pull schema from DB: `bun db:pull`
• Check schema: `bun db:check`

### Auth
• Regenerate auth schema: `bun auth:generate`
• Push auth tables: `bun auth:migrate`

### Build
• Production build: `bun build`
• Start production server: `bun start`

## Project Structure

```
src/
├─ app/                    # Next.js App Router
│  ├─ (marketing)/          # Public marketing pages
│  ├─ (app)/               # Authenticated application routes
│  │  ├─ home/              # ChatGPT-like lesson generation
│  │  ├─ lesson/             # Scene-based lesson player
│  │  ├─ playground/          # GeoGebra interactive area
│  │  ├─ shared/             # Public shared lessons
│  │  └─ dashboard/          # User profile & progress
│  ├─ api/                 # API routes
│  │  ├─ auth/[...all]/       # Better Auth handler
│  │  └─ trpc/[trpc]/        # tRPC edge handler
│  ├─ layout.tsx
│  └─ globals.css
├─ components/             # React components
│  ├─ ui/                  # ShadCN UI components
│  ├─ auth/                 # Authentication components
│  ├─ lesson/               # Lesson/scene components
│  └─ playground/           # GeoGebra components
├─ lib/
│  ├─ db/                  # Drizzle ORM
│  │  ├─ schema/            # Database schema definitions
│  │  ├─ migrations/         # SQL migration files
│  │  └─ index.ts           # Drizzle client
│  ├─ server/               # tRPC routers
│  │  └─ routers/           # Individual router modules
│  ├─ trpc/                # tRPC client & context
│  ├─ auth/                # Better Auth configuration
│  └─ ai/                  # AI services (Gemini, ElevenLabs, Suno)
├─ hooks/                 # Custom React hooks
└─ types/                 # Shared TypeScript types
```

## Technology Stack

### Frontend
- **Next.js 16** - React framework with App Router, Server Components, RSC
- **React 19** - UI library with latest features (Actions, Concurrent)
- **TypeScript 5** - Type safety, strict mode enabled
- **Tailwind CSS 4** - Utility-first styling
- **ShadCN UI** - Pre-built accessible components
- **TanStack Query 5** - Data fetching and caching
- **Framer Motion** - Smooth animations (if added)

### Backend
- **tRPC 11** - Type-safe API framework
- **Drizzle ORM 0.44** - Type-safe database queries
- **Neon PostgreSQL** - Serverless Postgres database
- **SuperJSON** - JSON serialization for tRPC
- **Zod 4** - Schema validation

### Authentication
- **Better Auth 1.4** - Email/password + Google OAuth
- **Better Auth CLI** - Auth schema generation

### AI & External Services
- **Google Gemini** - Content generation (stories, scenes, GeoGebra XML, quizzes, lyrics)
- **ElevenLabs** - High-quality text-to-speech for narration
- **Suno AI** - Scene-specific background music generation
- **GeoGebra** - Interactive mathematical visualizations

### Development Tools
- **Biome 2.2** - Linting and formatting
- **Husky 9** - Git hooks
- **Commitlint** - Conventional commits enforcement
- **Drizzle Kit** - Database CLI tools
- **bun** - Package manager

## Architecture Overview

### Data Flow

```
┌─────────────┐
│   Client    │ React 19 + tRPC Client
└──────┬──────┘
       │ HTTP/JSON (SuperJSON)
       │
┌──────▼──────────────────────────────────┐
│         Next.js API Routes         │
│  ┌────────────────────────────────┐  │
│  │      tRPC Router          │  │
│  │  ├─ lessons              │  │
│  │  ├─ ai                   │  │
│  │  ├─ quizzes              │  │
│  │  └─ playgrounds           │  │
│  └────────────────────────────────┘  │
└──────┬──────────────────────────────┘
       │
       ├────────────┬────────────┐
       │            │            │
┌──────▼─────┐  ┌───▼─────┐  ┌─────▼──────┐
│ Drizzle ORM  │  │Better Auth│  │ AI Services  │
│             │  │          │  │              │
│┌──────────┐│  │┌───────┐│  │┌────────────┐│
││Neon DB   ││  ││Session ││  ││Gemini     ││
│└──────────┘│  ││Manager ││  ││ElevenLabs ││
└─────────────┘  │└───────┘│  ││Suno       ││
                 └─────────────┘  └────────────┘
```

### Key Patterns

#### Server vs Client Components
- **Default to Server Components** - All pages should use server components by default
- **Use `use client`** - Only for interactivity (state, event handlers, browser APIs)
- **Data Fetching** - Server components fetch directly from DB; client components use tRPC hooks

#### tRPC Architecture
- **Router Composition** - All routers merged in `src/lib/server/routers/_app.ts`
- **Protected Procedures** - Use `protectedProcedure` middleware for authenticated endpoints
- **Context** - Includes `{ db, session }` for database and authentication access
- **Mutation Patterns** - Use `trpc.*.useMutation()` for mutations with optimistic updates

#### Database Access
- **Drizzle Client** - Singleton instance in `src/lib/db/index.ts`
- **Transactions** - Use `db.transaction()` for multi-table operations
- **Migrations** - Never edit SQL directly; regenerate via `db:generate`
- **Schema Definitions** - All schemas in `src/lib/db/schema/` and `src/lib/auth/schema.ts`

## Development Patterns

### Code Style
- **TypeScript strict mode** - No `any` types, prefer `unknown` with type guards
- **Quotes** - Single quotes (`'`), double quotes for JSX attributes
- **Semicolons** - No semicolons
- **Line limit** - 100 characters (Biome configured)
- **Indentation** - 2 spaces
- **Component naming** - PascalCase for components (`AuthForm.tsx`)
- **Utility naming** - camelCase for functions (`generateLesson()`)
- **Constants** - UPPER_SNAKE_CASE (`DATABASE_URL`)

### Database Conventions
- **All migrations** in `src/lib/db/migrations/`
- **Never edit migrations** - Regenerate via `db:generate` after schema changes
- **Schema types** - Use `$inferInsert` and `$inferSelect` for type inference
- **Foreign keys** - Always define `references()` and `onDelete()` behavior
- **Indexes** - Add indexes for frequently queried columns

### tRPC Patterns
- **Zod validation** - All inputs validated via `z.object().strict()`
- **Error handling** - Use `TRPCError` with appropriate codes
- **Type inference** - Use `z.infer<>` for deriving input types
```typescript
const lessonInput = z.object({
  prompt: z.string().min(10).max(1000),
  complexity: z.enum(['elementary', 'middle', 'high'])
})

type LessonInput = z.infer<typeof lessonInput>
```

### External Service Integration
- **Gemini API** - Implement exponential backoff for rate limits
- **ElevenLabs** - Cache audio URLs in database; regenerate only if needed
- **Suno API** - Poll for completion status (async generation)
- **GeoGebra** - Capture state via `onUpdate` callback for saving to DB

## Gotchas & Common Issues

### Local Development
- **Environment variables:** Copy `.env.example` to `.env.local` and fill in all values
- **Database connection:** Ensure `DATABASE_URL` is set before running migrations
- **Port conflicts:** Next.js defaults to port 3000; use `bun dev -- -p 3001` if occupied
- **HMR issues:** Clear `.next` directory if Hot Module Replacement stops working

### Database Issues
- **Migration conflicts:** If migrations fail, use `bun db:drop` (destructive) or manually resolve
- **Schema sync:** `bun db:push` is for dev only; use `db:migrate` in production
- **Connection pool:** Neon serverless may timeout; increase pool size if needed
- **Foreign key errors:** Check `onDelete: "cascade"` for proper cleanup

### tRPC Issues
- **Type errors:** If `trpc.router()` has type errors, check `createTRPCContext` return type
- **Middleware:** Ensure middleware runs before procedure, not inside it
- **Serialization:** SuperJSON handles Date, BigInt automatically; don't manually stringify
- **Client vs Server:** Use `trpc/client.tsx` in client components, `trpc/server.tsx` in server components

### AI Service Integration
- **Rate limits:**
  - Gemini: Implement exponential backoff (wait 1s, 2s, 4s, 8s)
  - ElevenLabs: Cache results; regenerate only on schema change
  - Suno: Poll status endpoint every 5s, max 60 attempts
- **Timeouts:** Lesson generation can take 60s+; show loading state with progress
- **Cost management:**
  - ElevenLabs: $0.30 per 1K characters (use efficient prompts)
  - Suno: ~$1 per song (generate shorter clips: 30s)
  - Gemini: ~$0.001 per lesson (token-efficient prompts)
- **Error handling:**
  - Always wrap API calls in try/catch
  - Log errors with context (prompt, error message, timestamp)
  - Provide fallback content (generic explanation) on failure


## Environment Variables

Required for local development (see `.env.example` for complete list):

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Auth
BETTER_AUTH_SECRET=random-secret-key-at-least-32-chars
BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# AI Services
GEMINI_API_KEY=your-gemini-api-key
ELEVENLABS_API_KEY=your-elevenlabs-api-key
SUNO_API_KEY=your-suno-api-key

# Storage (when implementing)
VERCEL_BLOB_TOKEN=your-vercel-blob-token
NEXT_PUBLIC_CDN_URL=https://cdn.example.com
```

## Documentation

- **User docs:** `README.md` - Project overview and getting started
- **Technical docs:** `docs/PRD.md` and `docs/TECHNICAL_ARCHITECTURE.md`
- **Agent docs:** `AGENTS.md` (this file) - AI development guidance
- **Code comments:** Keep comments concise; prefer self-documenting code


## Additional Resources

- **Project docs:** `docs/PRD.md`, `docs/TECHNICAL_ARCHITECTURE.md`
- **Stack docs:**
  - [Next.js](https://nextjs.org/docs)
  - [tRPC](https://trpc.io/docs)
  - [Drizzle ORM](https://orm.drizzle.team/docs/overview)
  - [Better Auth](https://www.better-auth.com/docs)
  - [Biome](https://biomejs.dev/docs)
- **Issue templates:** `.github/ISSUE_TEMPLATE/`
- **PR template:** `.github/pull_request_template.md`
