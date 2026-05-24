# GitHub Actions — Required Secrets

To activate the CI/CD pipeline, add these secrets in your GitHub repository:
**Settings → Secrets and variables → Actions → New repository secret**

| Secret Name              | Where to find it                                                                 |
|--------------------------|----------------------------------------------------------------------------------|
| `VITE_SUPABASE_URL`      | Supabase Dashboard → Project Settings → API → Project URL                       |
| `VITE_SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API → `anon` `public` key               |
| `SUPABASE_ACCESS_TOKEN`  | https://supabase.com/dashboard/account/tokens → Generate new token               |
| `SUPABASE_DB_PASSWORD`   | Supabase Dashboard → Project Settings → Database → Database password             |

## Workflows

### `ci.yml` — Runs on every push to `main` and every pull request
- Installs dependencies
- Runs TypeScript type check (`npm run typecheck`)
- Runs production Vite build with production env vars
- Uploads the `dist/` folder as a build artifact (available 7 days)
- All errors are logged in the GitHub Actions tab for immediate troubleshooting

### `migrate.yml` — Runs on push to `main` when `supabase/migrations/**` changes
- Automatically applies new migration files to the Supabase project
- Uses `supabase db push` with your project ref `stcfgvfaxnvcwdglrflg`
- Only triggers when migration files are modified — skips on unrelated code changes

## Bolt.new → GitHub Sync

In Bolt.new, connect your GitHub repository under:
**Project Settings → GitHub Integration → Connect Repository**

Once connected, every save in Bolt.new pushes a commit to `main`, which triggers:
1. `ci.yml` — builds and validates the frontend
2. `migrate.yml` — applies any new DB migrations

This creates the one-click launch environment: code change → GitHub push → build validated → DB migrated → site deployed.
