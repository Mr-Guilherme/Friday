# Friday

Friday is an AI chat web app focused on English practice.

Repository: <https://github.com/Mr-Guilherme/Friday>

## MVP

- Supabase authentication with Google OAuth and email magic link.
- Authenticated chat with streaming AI responses.
- Multiple conversations with persisted context.
- Bilingual interface for Portuguese and English with persisted preference.
- Mobile-first responsive layout with a desktop conversation sidebar and mobile conversation drawer.
- Server-side English coach system prompt tuned for software engineering conversations.

## Stack

- Node.js 24 LTS through Devbox and pnpm 10.
- Next.js 16.2.4, React 19.2.5, TypeScript 6.0.3.
- Supabase Auth, SSR helpers, local CLI, and Postgres with RLS.
- Vercel AI SDK with OpenAI `gpt-4.1-mini`.
- Tailwind CSS and shadcn-style components.
- Zod 4.3.6 validation, Biome, Vitest, Playwright, Husky, and commitlint.

## Commands

```sh
devbox shell
pnpm install
pnpm supabase:start
pnpm dev
```

Open <http://localhost:3000> after the development server starts.

Validation:

```sh
pnpm lint
pnpm test
pnpm build
pnpm test:e2e
```

`pnpm validate` runs lint, unit tests, and build. The pre-commit hook runs the same command, and GitHub Actions also runs Playwright E2E with local Supabase and mocked AI responses.

## Environment

Copy `.env.example` to `.env.local` and fill values from your local Supabase stack or hosted environment. Do not commit `.env*` files.

Required values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `OPENAI_API_KEY`
- `RATE_LIMIT_SALT`

`FRIDAY_MOCK_AI=1` is reserved for automated tests and local validation without calling OpenAI.

## Security

- Auth is validated server-side with Supabase SSR cookies.
- User-owned tables have RLS and explicit ownership checks in server code.
- Chat and auth payloads are validated with Zod.
- The system prompt and OpenAI key stay server-side.
- AI requests use a Postgres-backed rate limit before calling the model.
- Security headers are configured in Next.js.
