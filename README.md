# Acquisitions API

Docker setup for running the Express API against Neon Local during development
and Neon Cloud in production.

## Requirements

- Docker with the Compose plugin
- A Neon account, project, API key, and parent branch for development

Neon Local is a proxy to Neon Cloud, not a local Postgres server. It creates an
ephemeral Neon branch from `PARENT_BRANCH_ID` and deletes that branch when the
proxy container stops. The proxy requires internet access and Neon credentials.
Do not use a production branch as the parent for development or tests.

## Development with Neon Local

1. Copy the development template:

   ```sh
   cp .env.development.example .env.development
   ```

   On PowerShell:

   ```powershell
   Copy-Item .env.development.example .env.development
   ```

2. Set `NEON_API_KEY`, `NEON_PROJECT_ID`, `PARENT_BRANCH_ID`, and a valid
   `ARCJET_KEY` in `.env.development`. Replace the local `JWT_SECRET` with a
   development-only value. The `DATABASE_URL` is configured to use the
   `neon-local` Compose service; do not replace it with a cloud connection URL.

3. Start the proxy and API:

   ```sh
   npm run dev:docker
   ```

   This npm script invokes Docker Compose directly and works from PowerShell
   and other Windows terminals; it does not require Bash or `sh`.

   The API is available at <http://localhost:3000>. Neon Local is reachable by
   the application at `neon-local:5432` inside the Compose network, so it does
   not need to bind a database port on the Windows host. The Node Neon
   serverless driver uses Neon Local's HTTP SQL endpoint for this hostname.

4. Apply schema migrations to the current ephemeral branch:

   ```sh
   docker compose --env-file .env.development -f docker-compose.dev.yml exec app npm run db-migrate
   ```

5. Stop the environment with `Ctrl+C`, or run:

   ```sh
   docker compose --env-file .env.development -f docker-compose.dev.yml down
   ```

   Stopping Neon Local deletes its ephemeral branch. Starting it again creates
   a fresh branch from the configured parent.

## Production with Neon Cloud

Create `.env.production` from the production template on the deployment host,
then set `DATABASE_URL` to the actual Neon Cloud connection string. Keep this
file out of source control; the Compose configuration injects it at runtime and
does not include or start a Neon Local service.

```sh
cp .env.production.example .env.production
```

In PowerShell:

```powershell
Copy-Item .env.production.example .env.production
```

Set `DATABASE_URL` to your actual Neon Cloud URL and provide a non-empty
`JWT_SECRET` and valid `ARCJET_KEY`. Provide secrets through a secret manager or
protected environment file; do not put real credentials in the template or
image. The API refuses to start without `JWT_SECRET`.

Build and start the production API:

```sh
docker compose -f docker-compose.prod.yml up --build -d
```

The production image contains runtime dependencies only and runs as the
unprivileged `node` user. It connects directly to the supplied Neon Cloud
`DATABASE_URL`; Neon Local is not part of the production Compose stack.

Run Drizzle migrations as a deployment step before routing traffic to a new
release. Use a protected CI/deployment job with the production `DATABASE_URL`
and development dependencies installed (`npm ci` followed by
`npm run db-migrate`). Do not run migrations against production from the
development Compose stack.

## Configuration and commands

| Environment | `DATABASE_URL` destination                                | Compose file              |
| ----------- | --------------------------------------------------------- | ------------------------- |
| Development | `neon-local:5432`, proxied to a new ephemeral Neon branch | `docker-compose.dev.yml`  |
| Production  | Neon Cloud `*.neon.tech` endpoint                         | `docker-compose.prod.yml` |

Development and production environment files are ignored by Git. The
`.env.*.example` templates contain placeholders only.

```sh
# Development
docker compose --env-file .env.development -f docker-compose.dev.yml up --build
docker compose --env-file .env.development -f docker-compose.dev.yml down

# Production
docker compose -f docker-compose.prod.yml up --build -d
docker compose -f docker-compose.prod.yml logs -f app
docker compose -f docker-compose.prod.yml down
```
