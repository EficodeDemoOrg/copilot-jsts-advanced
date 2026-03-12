# Weather App — GitHub Copilot Exercise Environment (JS/TS)

A fully working weather service built with **Express + TypeScript** that serves as the substrate for a workshop teaching participants to build agentic workflows with GitHub Copilot: custom agents, skills, subagents, hooks, and MCP integration.

> **The application code is complete and tested.** Participants should never need to fix application bugs — they build Copilot tooling *around* a working codebase.

## Exercises

See [EXERCISES.md](EXERCISES.md) for the workshop exercises.

## What It Does

- Fetches real-time weather data from the [OpenWeatherMap One Call API 3.0](https://openweathermap.org/api/one-call-3)
- Manages a collection of saved locations (in-memory, no database)
- Serves a static HTML/JS dashboard with current weather, 5-day forecast charts (Chart.js), and government weather alerts
- Provides a clean REST API with full CRUD for locations and weather queries
- Interactive API docs at `/docs` (Swagger UI)

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Runtime | Node.js 20+, TypeScript 5.x, ESM |
| Web Framework | Express 4 |
| Validation | Zod |
| API Docs | swagger-jsdoc + swagger-ui-express |
| HTTP Client | Built-in `fetch` (Node 20+) |
| Tests | Vitest + supertest (unit/integration), Playwright (e2e) |
| Linting | ESLint 9 (flat config) + Prettier |
| External API | OpenWeatherMap One Call API 3.0 |

## Quick Start

### 1. Get an API Key

Sign up at [OpenWeatherMap](https://openweathermap.org/) and subscribe to the [One Call API 3.0](https://openweathermap.org/api/one-call-3). A free tier is available (1,000 calls/day).

### 2. Install Dependencies

```bash
nvm use          # Uses Node 20 from .nvmrc
npm install
```

### 3. Configure

```bash
cp .env.example .env
# Edit .env and add your OPENWEATHERMAP_API_KEY
```

### 4. Run

```bash
npm run dev      # Start dev server with hot reload (http://localhost:3000)
```

Open <http://localhost:3000> for the dashboard or <http://localhost:3000/docs> for the API docs.

## Run Tests

```bash
npm test                    # All unit + integration tests
npm run test:unit           # Unit tests only
npm run test:integration    # Integration tests only
npm run test:e2e            # Playwright e2e tests
```

## Lint & Format

```bash
npm run lint       # Run ESLint
npm run format     # Format with Prettier
```

## Project Structure

```
├── .github/
│   ├── copilot-instructions.md              # Always-on project context
│   ├── instructions/
│   │   ├── typescript.instructions.md       # TS conventions (src/**/*.ts)
│   │   ├── testing.instructions.md          # Test conventions (tests/**/*.ts)
│   │   └── frontend.instructions.md         # Frontend conventions (public/**)
│   └── agents/
│       └── teacher.agent.md                 # Exercise Tutor agent
├── public/
│   ├── index.html                           # Dashboard HTML
│   ├── style.css                            # Dashboard styles
│   └── app.js                               # Dashboard logic (vanilla JS)
├── src/
│   ├── app.ts                               # Express app factory + error handlers
│   ├── main.ts                              # Entry point
│   ├── config.ts                            # Settings from .env / environment
│   ├── models.ts                            # Zod schemas + TypeScript types
│   ├── dependencies.ts                      # DI container factory
│   ├── routers/
│   │   ├── weather.ts                       # GET /api/weather/{current,forecast,alerts}
│   │   └── locations.ts                     # CRUD /api/locations
│   ├── services/
│   │   ├── exceptions.ts                    # Domain exception hierarchy
│   │   ├── openweathermap.ts                # OWM One Call API 3.0 client
│   │   └── weather-service.ts               # Business logic + unit conversion
│   ├── repositories/
│   │   └── location-repo.ts                 # In-memory CRUD (Map)
│   └── utils/
│       └── converters.ts                    # Temperature/wind/compass converters
├── tests/
│   ├── setup.ts                             # Test helpers + DI overrides
│   ├── factories.ts                         # Test data factories
│   ├── unit/
│   │   ├── converters.test.ts
│   │   ├── models.test.ts
│   │   ├── location-repo.test.ts
│   │   └── weather-service.test.ts
│   ├── integration/
│   │   ├── weather-api.test.ts
│   │   └── locations-api.test.ts
│   └── e2e/
│       └── dashboard.spec.ts
├── EXERCISES.md                             # Workshop exercises
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── playwright.config.ts
├── eslint.config.js
└── .prettierrc
```

## API Endpoints

### Weather

| Method | Path | Query Params | Description |
|--------|------|-------------|-------------|
| GET | `/api/weather/current` | `lat`, `lon`, `units` (celsius/fahrenheit/kelvin) | Current weather |
| GET | `/api/weather/forecast` | `lat`, `lon`, `days` (1–5), `units` | Daily forecast |
| GET | `/api/weather/alerts` | `lat`, `lon` | Government weather alerts |

### Locations

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/locations` | List all saved locations |
| POST | `/api/locations` | Create a location (`{ name, lat, lon }`) |
| GET | `/api/locations/:id` | Get a location by ID |
| PUT | `/api/locations/:id` | Update a location (partial) |
| DELETE | `/api/locations/:id` | Delete a location |
| GET | `/api/locations/:id/weather` | Current weather for a saved location |

## Copilot Custom Instructions

The `.github/` directory contains a layered instruction system for GitHub Copilot:

| File | Scope | Purpose |
|------|-------|---------|
| `copilot-instructions.md` | Always on | Project overview, architecture, conventions |
| `instructions/typescript.instructions.md` | `src/**/*.ts` | TypeScript coding conventions |
| `instructions/testing.instructions.md` | `tests/**/*.ts` | Testing patterns and conventions |
| `instructions/frontend.instructions.md` | `public/**` | Frontend conventions |
| `agents/teacher.agent.md` | On demand | Exercise Tutor that guides without solving |

## Backlog

- [ ] Align test factories with real OWM One Call 3.0 response schema (currently simplified)
- [ ] Add custom threshold-based alerts alongside government alerts
- [ ] Add Playwright e2e tests for full weather search flow (requires mock server)
