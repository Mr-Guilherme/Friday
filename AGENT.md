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
```

## Security Notes

- Never commit secrets, `.env.local`, Supabase service keys, or OpenAI keys.
- Keep the AI system prompt server-side.
- Validate route handler payloads with Zod.
- Check authenticated user ownership before reading or writing conversation data.
- Use RLS as the final data access boundary.
