# Friday Agent Context

## Decisions

- Use Devbox for local runtime and pin Node.js 24 LTS.
- Use pnpm as the package manager.
- Use Supabase local CLI for development and CI validation.
- Use Supabase Auth with Google OAuth and email magic link only.
- Store user-owned data in Postgres with RLS enabled on every app table.
- Use OpenAI `gpt-4.1-mini` through the Vercel AI SDK.
- Use Zod for all request payload validation.
- Use Biome as the primary linter and formatter.
- Use Vitest for focused unit coverage and Playwright for mobile and desktop E2E coverage.
- Use GitHub Actions for lint, tests, build, local Supabase, and E2E validation.

## Architecture

- `src/app` contains App Router pages and route handlers.
- `src/features/auth` owns login actions and auth input validation.
- `src/features/chat` owns chat schemas, server actions, persistence helpers, prompt assembly, rate limiting, and the chat UI shell.
- `src/features/profile` owns profile preference reads and writes.
- `src/lib/supabase` owns browser, server, and proxy Supabase client creation.
- `supabase/migrations` owns schema, RLS policies, triggers, and RPC functions.

## Commands

```sh
devbox shell
pnpm install
pnpm supabase:start
pnpm dev
pnpm lint
pnpm test
pnpm build
pnpm test:e2e
pnpm validate
```

## Security Notes

- Never commit secrets, `.env.local`, Supabase service keys, or OpenAI keys.
- Keep the AI system prompt server-side.
- Validate route handler payloads with Zod.
- Check authenticated user ownership before reading or writing conversation data.
- Use RLS as the final data access boundary.
- Run E2E with `FRIDAY_MOCK_AI=1` to avoid spending tokens or exposing OpenAI behavior in tests.
- Keep UI rendering through React text nodes; do not add `dangerouslySetInnerHTML`.
