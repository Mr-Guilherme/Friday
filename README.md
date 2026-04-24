# Friday

Friday is an AI chat web app for Brazilian software engineers who want to practice English in realistic engineering conversations.

## MVP

- Supabase authentication with Google OAuth and email magic link.
- Authenticated chat with streaming AI responses.
- Multiple conversations with persisted context.
- Bilingual interface for Portuguese and English.
- Responsive layout for mobile and desktop.

## Stack

- Node.js 24 LTS through Devbox.
- Next.js 16, React 19, TypeScript 6.
- Supabase Auth and Postgres.
- Vercel AI SDK with OpenAI `gpt-4.1-mini`.
- Tailwind CSS and shadcn-style components.
- Zod validation, Biome, Vitest, Playwright, Husky, commitlint.

## Commands

```sh
devbox shell
pnpm install
pnpm supabase:start
pnpm dev
```

Validation:

```sh
pnpm lint
pnpm test
pnpm build
pnpm test:e2e
```

## Environment

Copy `.env.example` to `.env.local` and fill values from your local Supabase stack or hosted environment. Do not commit `.env*` files.
