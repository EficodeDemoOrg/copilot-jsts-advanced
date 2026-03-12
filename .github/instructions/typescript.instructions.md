---
applyTo: "src/**/*.ts"
---

# TypeScript Coding Conventions

## Language & Runtime

- **Node.js 20+**, **TypeScript 5.x**, **ESM** (`"type": "module"` in package.json)
- Strict TypeScript — `strict: true` in tsconfig, **no `any`**
- Use `.js` extensions in all import paths (ESM requirement for TypeScript)
- Use `node:` protocol for Node.js built-in imports (`import { readFileSync } from 'node:fs'`)

## Naming

- `camelCase` for functions, variables, parameters
- `PascalCase` for classes, types, interfaces, enums, Zod schemas
- `UPPER_SNAKE_CASE` for module-level constants
- File names: `kebab-case.ts` (e.g., `weather-service.ts`, `location-repo.ts`)

## Architecture Layers

### Routers (`src/routers/`)
- HTTP handling only: validate input (Zod `.parse()`), call services, send responses
- No business logic — delegate everything to services
- Use `asyncHandler` wrapper for async route handlers (Express 4 doesn't catch async rejections)
- Return appropriate HTTP status codes (200, 201, 204, etc.)

### Services (`src/services/`)
- Business logic lives here
- Throw domain exceptions (`WeatherAppError` hierarchy), never HTTP errors
- Accept typed parameters, return typed domain objects
- `WeatherService` handles unit conversion and data transformation
- `OpenWeatherMapClient` handles all external HTTP communication

### Repositories (`src/repositories/`)
- Data access only — currently in-memory Map
- Synchronous methods (no async needed for in-memory)
- Throw `LocationNotFoundError` when entity doesn't exist

### Models (`src/models.ts`)
- Zod schemas for request validation (use `z.coerce` for query params)
- TypeScript interfaces for domain types
- Zod schemas for OWM API response validation
- Export both the schema and the inferred type

### Utils (`src/utils/`)
- Pure functions, no side effects, no I/O
- Round numeric results to 2 decimal places

## Async Patterns

- `async`/`await` for all HTTP-facing code (routers, services, API client)
- Synchronous for repository operations (in-memory)
- Use `AbortSignal.timeout()` for HTTP request timeouts
- Wrap Express async handlers to catch rejections: `fn(req, res, next).catch(next)`

## Error Handling

Domain exceptions (in `src/services/exceptions.ts`):
```
WeatherAppError (base)
├── WeatherAPIError (statusCode, message)
│   └── WeatherAPINotFoundError (404)
├── WeatherAPIConnectionError (message)
└── LocationNotFoundError (locationId)
```

Global error handler maps these to HTTP responses. Zod validation errors → 422.

## Dependency Injection

- `createContainer(settings)` builds all dependencies
- Router factory functions accept the container: `createWeatherRouter(container)`
- Tests create their own containers with mock dependencies
- No global singletons — everything flows through the container
