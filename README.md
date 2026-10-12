# Hanpace

This pnpm workspace contains two independent Next.js apps:

| App | Directory | Development URL |
| --- | --- | --- |
| Pace landing page | `part-1/` | http://localhost:3000 |
| Part 2 starter | `part-2/` | http://localhost:3001 |

Install dependencies once at the repository root:

```bash
pnpm install
```

Run both apps, or start one at a time:

```bash
pnpm dev
pnpm dev:part-1
pnpm dev:part-2
```

Run checks across both apps:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

Each app owns its dependencies and configuration in its own directory. The workspace shares a single `pnpm-lock.yaml`; use `pnpm --filter part-1 add <package>` or `pnpm --filter part-2 add <package>` to add an app-specific dependency.
