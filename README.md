# kitchen

Express + TypeScript API for FoodLens: upload a meal photo, identify foods, compute nutrition from Postgres, return an editable meal.

The AI (later: Ollama) only names foods and estimates grams. **This API owns calories and macros.** Clients can always PATCH portion size or food identity; we recalculate from the `Food` table.

Product plan: `[../PLAN.md](../PLAN.md)`.

## Status

Dockerized hello world is in place:

- Node **24.16.0** image, Express `GET /health`
- Compose: `api` + `postgres` (named volume)
- Local override: port publish, Compose Watch sync, Vitest watch service
- First domain slice: `calculateNutrition` + unit test (TDD)

Do not add Ollama, Redis, or auth until meals work with a mock analyzer.

## Stack


| Piece           | Choice                                         |
| --------------- | ---------------------------------------------- |
| Runtime         | Node.js 24.16.0 + Express + TypeScript (`tsx`) |
| Database        | PostgreSQL 16 (Compose)                        |
| Tests           | Vitest                                         |
| Dev environment | Docker Compose + Compose Watch                 |


## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Compose V2)
- Optional on the host: Node/npm only if you want `npm run …` helpers; the app runs in Docker

You do not need a local Postgres or a global Node install to run the API.

## Bootstrap after cloning

```bash
git clone <repo-url> kitchen
cd kitchen
```

### 1. Local Compose override

```bash
cp docker-compose.override.example.yaml docker-compose.override.yaml
```

`docker-compose.override.yaml` is gitignored — customize ports, Watch rules, etc. locally.

### 2. IDE dependencies (optional)

So the editor resolves `express` / types without using host Node as the runtime:

```bash
npm run deps
```

That runs `npm install` inside `node:24.16.0-alpine` with a bind mount (writes `node_modules` + lockfile on disk).

### 3. Start the stack

```bash
docker compose up --build --watch
```

- `**--watch**` — syncs `src/` and `tests/` into containers; rebuilds when `package.json` / lockfile / Dockerfile change
- `**api**` — `npm run dev` (`tsx watch`), ports published via override
- `**test**` — `vitest --watch`, `attach: false` (does not clutter the main `up` terminal)
- `**postgres**` — data in named volume `postgres_data`

### 4. Verify

```bash
curl http://localhost:3000/health
# {"status":"ok"}

docker compose logs -f test
# Vitest watch output
```

### Everyday commands


| Action                   | Command                                                                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Health                   | `curl http://localhost:3000/health`                                                                                                              |
| Follow tests             | `docker compose logs -f test`                                                                                                                    |
| One-shot tests           | `docker compose exec test npm 
| Refresh lock/IDE modules | `npm run deps`                                                                                                                                   |
| Stop                     | `docker compose down`                                                                                                                            |
| Stop + wipe DB           | `docker compose down -v`                                                                                                                         |


**Dependency habit:** prefer `npm install <pkg>` (via Docker) over hand-editing `package.json` alone. The Dockerfile uses `npm ci`, which needs `package.json` and `package-lock.json` in sync.

## Layout

```
kitchen/
  Dockerfile
  docker-compose.yaml                 # prod-leaning base (no host ports)
  docker-compose.override.example.yaml
  docker-compose.override.yaml        # local only (gitignored)
  package.json
  tsconfig.json
  src/
    index.ts                    # Express + /health
    nutrition-calculator.ts     # domain (early)
  tests/
    nutrition-calculator.unit.test.ts
```

## Local vs base Compose


| File                            | Role                                                                             |
| ------------------------------- | -------------------------------------------------------------------------------- |
| `docker-compose.yaml`           | Shared services, Postgres volume — no host port publishing                       |
| `docker-compose.override*.yaml` | Local ports, `dev` / `test:watch`, Compose Watch sync, `attach: false` on `test` |


Prod-shaped run (no override):

```bash
docker compose -f docker-compose.yaml up --build
```

## API (MVP)


| Method | Path             | Purpose                          |
| ------ | ---------------- | -------------------------------- |
| GET    | `/health`        | Process is up                    |
| POST   | `/meals/analyze` | Upload image → analyze → persist |
| GET    | `/meals`         | List meals                       |
| GET    | `/meals/:id`     | One meal                         |
| PATCH  | `/meals/:id`     | Correct foods/grams; recalculate |
| DELETE | `/meals/:id`     | Delete meal                      |


Only `/health` exists today.

## Roadmap (this repo)

1. ~~Dockerfile + Compose + `/health`~~
2. Nutrition domain + Vitest (in progress) → then Zod
3. Postgres schema + repository tests
4. Analyze endpoint with mock AI + uploads
5. GET / PATCH / DELETE
6. Ollama as another Compose service
7. Redis + worker after sync analysis works

