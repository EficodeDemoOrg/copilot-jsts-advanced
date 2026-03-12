# Weather App — Copilot Project Instructions

## Project Overview

This is a **GitHub Copilot exercise environment** — a fully working weather service that serves as the substrate for a workshop teaching participants to build agentic workflows with GitHub Copilot: custom agents, skills, subagents, hooks, and MCP integration.

The application code is complete and tested. **Participants should never need to fix application bugs.** They build Copilot tooling **around** a working codebase.

## Architecture

The project follows a strict **layered architecture**:

| Layer | Location | Responsibility |
|-------|----------|----------------|
| **Routers** | `src/routers/` | HTTP request handling only. Validate input (Zod), call services, return responses. **No business logic.** |
| **Services** | `src/services/` | Business logic. `WeatherService` orchestrates the API client, handles unit conversion. `OpenWeatherMapClient` handles external HTTP communication. |
| **Repositories** | `src/repositories/` | Data access. `LocationRepository` provides CRUD over an in-memory Map. No database. |
| **Models** | `src/models.ts` | Zod schemas for validation + TypeScript type definitions shared across all layers. |
| **Utils** | `src/utils/` | Pure, stateless helper functions (temperature/wind converters). No side effects, no I/O. |
| **Dependencies** | `src/dependencies.ts` | Dependency injection wiring. Factory functions for settings, services, repositories. Tests override these. |
| **Config** | `src/config.ts` | Settings loaded from environment variables / `.env` file. |
| **Static frontend** | `public/` | Vanilla JS + CSS + HTML dashboard served by the backend. |

### Key Rules

- Routers **never** contain business logic
- Services **never** raise HTTP errors — they throw domain exceptions
- Routers/error handlers catch domain exceptions and translate to HTTP responses
- The repository is synchronous (in-memory Map)
- All HTTP-facing code (routers, services, API client) is async
- Custom domain exceptions form a hierarchy (`WeatherAppError` base)
- Dependency injection allows tests to swap in mocks

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

## Conventions

- **TypeScript**: Strict mode, no `any`, ESM imports with `.js` extensions
- **Naming**: camelCase for functions/variables, PascalCase for classes/types/interfaces, UPPER_SNAKE_CASE for constants
- **Async**: `async`/`await` everywhere for HTTP-facing code, sync for repository
- **Error handling**: Domain exceptions → HTTP response mapping via global error handler
- **Testing**: No real API calls ever. Unit tests mock at service boundary; integration tests mock the OWM client.

## Run Commands

```bash
npm run dev          # Start dev server with hot reload
npm run build        # Compile TypeScript
npm run start        # Run compiled JS
npm test             # Run all tests
npm run test:unit    # Run unit tests only
npm run test:integration  # Run integration tests only
npm run test:e2e     # Run Playwright e2e tests
npm run lint         # Run ESLint
npm run format       # Format with Prettier
```

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `express` | Web framework |
| `zod` | Runtime validation schemas |
| `swagger-jsdoc` | OpenAPI spec generation from JSDoc |
| `swagger-ui-express` | Swagger UI at `/docs` |

## Weather API

The app uses the **OpenWeatherMap One Call API 3.0** (`/data/3.0/onecall`). Key points:
- All requests use `units=metric` (Celsius, m/s)
- The service layer handles unit conversion to fahrenheit/kelvin
- Government weather alerts are passed through from the API
- The `exclude` parameter is used to request only the data needed per endpoint
