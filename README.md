# kitchen

Express + TypeScript API for FoodLens: upload a meal photo, identify foods, compute nutrition from Postgres, return an editable meal.

The AI (later: Ollama) only names foods and estimates grams. **This API owns calories and macros.** Clients can always PATCH portion size or food identity; we recalculate from the `Food` table.

Product plan: [`../PLAN.md`](../PLAN.md).

## Status

- Node **24.16.0**, Express, `GET /health`, request logging via **morgan**
- Compose: `api` + `postgres` + `test` (Vitest watch)
- **Dev Container (Bookworm)** for the editor; **Alpine** image for runtime/deploy
- No committed `package-lock.json` — `npm install` on each image build / in the Dev Container volume
- Domain: `calculateNutrition` + unit test (TDD)

Do not add Ollama, Redis, or auth until meals work with a mock analyzer.

## Stack

| Piece | Choice |
|-------|--------|
| Runtime image | `Dockerfile` → `node:24.16.0-alpine` |
| Editor image | `Dockerfile.dev` → `node:24.16.0-bookworm` (Dev Container only) |
| App | Express + TypeScript (`tsx`) |
| HTTP logs | morgan (`dev` format locally) |
| Database | PostgreSQL 16 (Compose) |
| Tests | Vitest |
| Format | Prettier (CLI + Dev Container extension) |

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Compose V2)
- Cursor/VS Code **Dev Containers** extension (recommended workflow)

You do not need a local Postgres or a host `node_modules` tree.

## Bootstrap after cloning

```bash
git clone <repo-url> kitchen
cd kitchen
cp docker-compose.override.example.yaml docker-compose.override.yaml
```

Then pick **one** way to work (prefer A).

### A. Dev Container (recommended)

Keeps the editor and `npm install` on **Linux**. Runtime deploy image stays **Alpine**.

1. Open the **`kitchen`** folder (this repo), not the parent `restaurant` folder.
2. Command Palette → **Dev Containers: Reopen in Container** (rebuild if prompted).
3. First start builds `Dockerfile.dev`, starts Compose (`api`, `postgres`, `test`), and runs `npm install` into Docker volumes (`kitchen_node_modules`, etc.).

**While the Dev Container is open:**

- The API is already running (`npm run dev` on service `api`). Do **not** also run `docker compose up --watch` from the Mac against the same project — you’ll fight the same stack.
- Source files are **bind-mounted**: edits in Cursor update files on the Mac (and vice versa).
- `node_modules` lives in a **volume** — do not `rm -rf node_modules` (mount is busy). Use `npm install`, or remove the volume from the host after `docker compose down`.
- Add packages in the Dev Container terminal:

  ```bash
  npm install <pkg>
  npm install -D <pkg>
  ```

- Follow logs from a **Mac** terminal if you like:

  ```bash
  docker compose logs -f api
  docker compose logs -f test
  ```

- File watchers use polling (`CHOKIDAR_USEPOLLING`) so bind-mount edits reload `tsx` / Vitest more reliably on Docker Desktop.

### B. Host-only Compose (no Dev Container)

```bash
docker compose up --build --watch
```

- **`--watch`** syncs `src/` and `tests/` into containers; rebuilds when `package.json` / `Dockerfile` change.
- Editor may show missing-module warnings without a local `node_modules` — expected.

### Verify

```bash
curl http://localhost:3000/health
# {"status":"ok"}
```

API logs should show a morgan line, e.g. `GET /health 200 …`.

## Everyday commands

| Action | Where | Command |
|--------|--------|---------|
| Health | Mac or container | `curl http://localhost:3000/health` |
| Follow API logs | Mac | `docker compose logs -f api` |
| Follow tests | Mac | `docker compose logs -f test` |
| One-shot tests | Dev Container or `exec` | `npm test` / `docker compose exec test npm test` |
| Add dependency | Dev Container terminal | `npm install <pkg>` |
| Format | Dev Container | `npm run format` |
| Stop stack | Mac (after leaving DC) | `docker compose down` |
| Wipe DB volume | Mac | `docker compose down -v` |
| Wipe dep volumes | Mac | `docker volume ls` then `docker volume rm …` |

## Two Dockerfiles

| File | Base | Used for |
|------|------|----------|
| `Dockerfile` | Alpine | `docker compose` runtime / future deploy |
| `Dockerfile.dev` | Bookworm | Cursor Dev Container only (glibc for the editor server) |

Bookworm is **not** what you deploy; it only makes the IDE work inside Linux.

## Layout

```
kitchen/
  Dockerfile                 # Alpine — runtime / deploy
  Dockerfile.dev             # Bookworm — Dev Container only
  .devcontainer/
    devcontainer.json        # Compose merge, Prettier extension, postCreate npm install
    docker-compose.yaml      # Bookworm build, bind mount, node_modules volumes, polling
  docker-compose.yaml
  docker-compose.override.example.yaml
  docker-compose.override.yaml   # local only (gitignored)
  package.json                   # no package-lock by design
  prettier.config.ts
  tsconfig.json
  src/
    index.ts                 # Express, morgan, /health
    nutrition-calculator.ts
  tests/
    nutrition-calculator.unit.test.ts
```

## Local vs base Compose

| File | Role |
|------|------|
| `docker-compose.yaml` | Shared services, Postgres volume — no host ports |
| `docker-compose.override*.yaml` | Local ports, `dev` / `test:watch`, Watch sync (host workflow) |
| `.devcontainer/docker-compose.yaml` | Dev Container overrides: Bookworm `api`, bind mounts, dep volumes |

Prod-shaped run (no override, Alpine image):

```bash
docker compose -f docker-compose.yaml up --build
```

## API (MVP)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Process is up |
| POST | `/meals/analyze` | Upload image → analyze → persist |
| GET | `/meals` | List meals |
| GET | `/meals/:id` | One meal |
| PATCH | `/meals/:id` | Correct foods/grams; recalculate |
| DELETE | `/meals/:id` | Delete meal |

Only `/health` exists today (plus morgan access logs).

## Roadmap (this repo)

1. ~~Dockerfile + Compose + `/health`~~
2. ~~Dev Container (Bookworm) + Alpine runtime split~~
3. ~~morgan request logging~~
4. Nutrition domain + Vitest → then Zod
5. Postgres schema + repository tests
6. Analyze endpoint with mock AI + uploads
7. GET / PATCH / DELETE
8. Ollama as another Compose service
9. Redis + worker after sync analysis works
