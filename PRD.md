# Handoff: Reimplement Weather App in JS/TS

This document describes the Python weather app in detail so that an agent can reimplement it as a JS/TS project in a new repository. The goal is a **functionally equivalent** application with the same architecture, the same API surface, the same frontend, and — critically — the same Copilot exercise infrastructure (instructions, agents, exercises).

---

## 1. Purpose of the Project

This is **not** a production application. It is a **GitHub Copilot exercise environment** — a fully working weather service that serves as the substrate for a workshop teaching participants to build agentic workflows with GitHub Copilot: custom agents, skills, subagents, hooks, and MCP integration. The application code is complete and tested; the exercises focus on **extending** the tooling around it.

The JS/TS port must be equally complete and tested before the workshop begins. Participants should never need to fix application bugs — they build Copilot tooling **around** a working codebase.

---

## 2. What the Application Does

- Fetches real-time weather data from the [OpenWeatherMap API](https://openweathermap.org/api) (free tier)
- Manages a collection of saved locations (in-memory, no database)
- Serves a static HTML/JS dashboard with current weather, 5-day forecast charts (Chart.js), and weather alerts
- Provides a clean REST API with full CRUD for locations and weather queries

---

## 3. Architecture — Layered Structure

The Python version uses a strict layered architecture. The JS/TS version must replicate this separation of concerns. The agent may choose any web framework (Express, Fastify, Hono, NestJS, etc.) but **must** preserve these layers:

### 3.1 Layers

| Layer | Python Location | Responsibility |
|-------|-----------------|----------------|
| **Routers** | `src/weather_app/routers/` | HTTP request handling only. Validate input, call services, return responses. **No business logic.** |
| **Services** | `src/weather_app/services/` | Business logic. `WeatherService` orchestrates the API client, handles unit conversion, evaluates weather alerts. `OpenWeatherMapClient` handles all external HTTP communication. |
| **Repositories** | `src/weather_app/repositories/` | Data access. `LocationRepository` provides CRUD over an in-memory object/Map. No database. |
| **Models** | `src/weather_app/models.py` | Type definitions / validation schemas shared across all layers. In TS, use Zod, io-ts, or TypeBox for runtime validation (corresponding to Pydantic in Python). |
| **Utils** | `src/weather_app/utils/` | Pure, stateless helper functions (temperature/wind converters). No side effects, no I/O. |
| **Dependencies / DI** | `src/weather_app/dependencies.py` | Dependency injection wiring. Factory functions for settings, services, repositories. Tests override these. |
| **Config** | `src/weather_app/config.py` | Settings loaded from environment variables / `.env` file. |
| **Static frontend** | `src/weather_app/static/` | Vanilla JS + CSS + HTML dashboard served by the backend. |

### 3.2 Key Architectural Rules

- Routers never contain business logic.
- Services never raise HTTP errors — they throw domain exceptions.
- Routers catch domain exceptions and translate to HTTP errors (or global error handlers do it).
- The repository is synchronous (in-memory Map/object).
- All HTTP-facing code (routers, services, API client) is async.
- Custom domain exceptions form a hierarchy (see §5.5).
- Dependency injection allows tests to swap in mocks without touching production code.

---

## 4. API Surface

### 4.1 Weather Endpoints

| Method | Path | Query Params | Response | Description |
|--------|------|-------------|----------|-------------|
| GET | `/api/weather/current` | `lat` (float, -90..90, required), `lon` (float, -180..180, required), `units` (enum: celsius/fahrenheit/kelvin, default: celsius) | `CurrentWeather` | Current weather for coordinates |
| GET | `/api/weather/forecast` | `lat`, `lon`, `days` (int, 1..5, default: 5), `units` | `Forecast` | Multi-day daily forecast |
| GET | `/api/weather/alerts` | `lat`, `lon` | `WeatherAlert[]` | Weather alerts based on threshold evaluation |

### 4.2 Location Endpoints

| Method | Path | Body / Params | Response | Status |
|--------|------|--------------|----------|--------|
| GET | `/api/locations` | — | `Location[]` | 200 |
| POST | `/api/locations` | `{ name, lat, lon }` | `Location` | 201 |
| GET | `/api/locations/:id` | — | `Location` | 200 / 404 |
| PUT | `/api/locations/:id` | `{ name?, lat?, lon? }` | `Location` | 200 / 404 |
| DELETE | `/api/locations/:id` | — | — | 204 / 404 |
| GET | `/api/locations/:id/weather` | `units` | `CurrentWeather` | 200 / 404 |

### 4.3 Other

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Serves the dashboard HTML |
| GET | `/static/*` | Serves static assets |

The application should also provide interactive API docs (Swagger-like), equivalent to FastAPI's auto-generated `/docs`.

---

## 5. Detailed Module Specifications

### 5.1 Models / Types

These are the data structures used across all layers. In TS, implement as interfaces/types with runtime validation (e.g., Zod schemas).

#### Enums

```
TemperatureUnit: "celsius" | "fahrenheit" | "kelvin"
AlertSeverity: "low" | "medium" | "high" | "extreme"
```

#### Coordinates
```
{ lat: float (-90..90), lon: float (-180..180) }
```

#### Location
```
{
  id: UUID (auto-generated),
  name: string (1..200 chars),
  coordinates: Coordinates,
  created_at: datetime (auto-generated)
}
```

#### LocationCreate (request body)
```
{ name: string (1..200 chars), lat: float (-90..90), lon: float (-180..180) }
```

#### LocationUpdate (request body, all optional)
```
{ name?: string (1..200 chars), lat?: float (-90..90), lon?: float (-180..180) }
```

#### CurrentWeather
```
{
  temperature: float,
  feels_like: float,
  humidity: float (0..100),
  pressure: float,
  wind_speed: float (≥0),
  wind_direction: int (0..360),
  description: string,
  icon: string,
  timestamp: datetime,
  location_name: string,
  units: TemperatureUnit (default: "celsius")
}
```

#### ForecastDay
```
{
  forecast_date: date,
  temp_min: float,
  temp_max: float,
  humidity: float (0..100),
  description: string,
  icon: string
}
```

#### Forecast
```
{
  location_name: string,
  units: TemperatureUnit (default: "celsius"),
  days: ForecastDay[]
}
```

#### WeatherAlert
```
{
  alert_type: string,
  message: string,
  severity: AlertSeverity,
  value: float,
  threshold: float
}
```

### 5.2 Config / Settings

Load from environment variables or `.env` file:

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `OPENWEATHERMAP_API_KEY` | string | `""` | API key (empty for tests) |
| `OPENWEATHERMAP_BASE_URL` | string | `https://api.openweathermap.org/data/2.5` | API base URL |
| `APP_NAME` | string | `"Weather App"` | Application name |
| `DEBUG` | boolean | `false` | Debug mode |
| `ALERT_WIND_SPEED_THRESHOLD` | float | `20.0` | m/s |
| `ALERT_TEMP_HIGH_THRESHOLD` | float | `40.0` | °C |
| `ALERT_TEMP_LOW_THRESHOLD` | float | `-20.0` | °C |
| `ALERT_HUMIDITY_THRESHOLD` | float | `90.0` | % |

### 5.3 OpenWeatherMap Client

An async HTTP client wrapping the OWM API. Key behaviors:

- Calls `/weather` with `units=metric` → returns `CurrentWeather` (Celsius, m/s)
- Calls `/forecast` with `units=metric` → returns `(cityName, ForecastDay[])`. The 3-hour interval data must be **aggregated into daily summaries**: min/max temp, average humidity, most common description/icon per day.
- Adds `appid` query parameter automatically.
- Throws `WeatherAPINotFoundError` on 404.
- Throws `WeatherAPIConnectionError` on network/timeout errors.
- Throws `WeatherAPIError` on other non-200 responses (with status code and message).
- Uses a 10-second timeout.

### 5.4 Weather Service

Business logic layer. Methods:

- `getCurrentWeather(lat, lon, units)` — fetches via client, converts temperatures if units ≠ celsius.
- `getForecast(lat, lon, days, units)` — fetches via client, converts temperatures.
- `getAlerts(lat, lon)` — fetches current weather, evaluates thresholds:
  - **high_wind**: wind_speed ≥ threshold → MEDIUM; wind_speed ≥ threshold × 1.5 → HIGH
  - **extreme_heat**: temp ≥ high_threshold → HIGH; temp ≥ high_threshold + 5 → EXTREME
  - **extreme_cold**: temp ≤ low_threshold → HIGH; temp ≤ low_threshold - 10 → EXTREME
  - **high_humidity**: humidity ≥ threshold → LOW

### 5.5 Exception Hierarchy

```
WeatherAppError (base)
├── WeatherAPIError (status_code, message)
│   └── WeatherAPINotFoundError (404)
├── WeatherAPIConnectionError (message)
└── LocationNotFoundError (location_id)
```

Global error handlers map these to HTTP responses:
- `WeatherAPINotFoundError` → 404
- `WeatherAPIConnectionError` → 503
- `WeatherAPIError` → 502
- `WeatherAppError` → 500

### 5.6 Converter Utilities

Pure functions, all in one file:

| Function | Formula | Rounding |
|----------|---------|----------|
| `celsiusToFahrenheit(c)` | `c * 9/5 + 32` | 2 decimals |
| `celsiusToKelvin(c)` | `c + 273.15` | 2 decimals |
| `fahrenheitToCelsius(f)` | `(f - 32) * 5/9` | 2 decimals |
| `mpsToKmh(mps)` | `mps * 3.6` | 2 decimals |
| `mpsToMph(mps)` | `mps * 2.23694` | 2 decimals |
| `degreesToCompass(deg)` | 16-point compass rose, sectors of 22.5° each, N centered at 0° | — |

Compass points: N, NNE, NE, ENE, E, ESE, SE, SSE, S, SSW, SW, WSW, W, WNW, NW, NNW.

### 5.7 Location Repository

In-memory CRUD using a Map/object keyed by UUID.

| Method | Behavior |
|--------|----------|
| `add(data)` | Creates `Location` with auto-generated UUID and timestamp, stores it. |
| `get(id)` | Returns location or throws `LocationNotFoundError`. |
| `listAll()` | Returns all locations sorted by `created_at`. |
| `delete(id)` | Removes location or throws `LocationNotFoundError`. Returns `true`. |
| `update(id, data)` | Partial update — only non-null/undefined fields. Throws if not found. |

---

## 6. Frontend (Static Dashboard)

The frontend is **vanilla JS + CSS + HTML** — no frameworks, no build step, no bundler. It is served as static files by the backend. **Port it as-is** to the new project.

### Files

- `index.html` — Semantic HTML with `<header>`, `<main>`, `<section>`, `<footer>`. All interactive elements have IDs used by JS.
- `style.css` — CSS custom properties on `:root`, mobile-first, system font stack, BEM-like semantic class names.
- `app.js` — Organized in sections (State, DOM refs, API helpers, rendering, event handlers, initialization). Uses `fetch`, `async/await`, Chart.js 4.x via CDN.

The frontend communicates exclusively with `/api/...` endpoints. It displays:
- Coordinate search bar with unit selector
- Current weather card
- 5-day forecast line chart (Chart.js, high/low temperatures)
- Weather alerts (color-coded by severity)
- Saved locations sidebar with add/delete

**The frontend can be reused verbatim** since it only talks to the API. Just serve the same static files.

---

## 7. Testing Strategy

### 7.1 General Principles

- **No real API calls — ever.** Unit tests mock at the service boundary; integration tests mock outgoing HTTP.
- Tests are complete and passing before the workshop.
- Test data comes from centralized factory functions, not inline raw objects.
- Each test verifies exactly one behavior (AAA pattern: Arrange → Act → Assert).

### 7.2 Test Structure

```
tests/
├── conftest.{ts,js}          — Shared fixtures: app, client, settings
├── factories.{ts,js}         — Test data factories for all models
├── unit/
│   ├── conftest.{ts,js}      — Mock fixtures for unit tests
│   ├── test_converters        — Pure function tests (parametrized)
│   ├── test_location_repo     — Repository CRUD tests
│   ├── test_models            — Validation tests
│   └── test_weather_service   — Service logic with mocked API client
└── integration/
    ├── conftest.{ts,js}       — Integration-specific fixtures
    ├── test_weather_api        — Full /api/weather/* endpoint tests
    └── test_locations_api      — Full /api/locations/* CRUD tests
```

### 7.3 Test Framework

Use **Vitest** (recommended for TS projects, fast, native ESM, built-in mocking) or Jest. The test runner must support:
- Async tests
- Parametrized tests (`.each` or equivalent)
- Filtering by marker/tag (e.g., `unit` vs `integration`)
- HTTP mocking for outgoing requests (e.g., `msw`, `nock`, or framework-specific interceptors)
- Supertest or equivalent for integration tests against the running app

### 7.4 Frontend Testing with Playwright

**Deviation from the Python version:** The JS/TS version should also include **Playwright** end-to-end tests for the frontend dashboard. The Python version has no frontend tests. This is acceptable and encouraged because:
- Playwright has a decent MCP Server, which adds value for the Copilot exercises
- It's straightforward to set up in a JS/TS project
- It demonstrates an additional testing layer

Playwright tests should cover:
- Loading the dashboard
- Searching for coordinates and seeing weather results
- Saving/deleting locations
- Forecast chart rendering
- Alert display

### 7.5 Factory Functions

Port all factories from the Python version. These are crucial for test consistency:

| Factory | Purpose |
|---------|---------|
| `makeCoordinates()` | Default: London (51.51, -0.13) |
| `makeLocation()` | Full location with UUID and timestamp |
| `makeLocationCreate()` | Request body for POST |
| `makeLocationUpdate()` | Request body for PUT (all optional) |
| `makeCurrentWeather()` | Typical London weather defaults |
| `makeForecastDay()` | Single forecast day |
| `makeForecast()` | Multi-day forecast (default 3 days) |
| `makeWeatherAlert()` | High wind alert by default |
| `makeOwmCurrentWeatherResponse()` | Raw OWM `/weather` API response dict |
| `makeOwmForecastResponse()` | Raw OWM `/forecast` API response dict (generates 3-hour intervals) |

All factories accept keyword/option overrides.

### 7.6 Unit Tests — What to Test

| Module | Tests |
|--------|-------|
| Converters | All conversion functions with known pairs, edge cases, rounding, type checks. Parametrized. |
| Models | Valid/invalid inputs, boundary values, enum validation, default values, partial updates. |
| Location Repo | CRUD operations, not-found errors, ordering, multiple entries, idempotency. |
| Weather Service | Unit conversion (all 3 units), non-temp fields unchanged, alert thresholds (all 4 types + severity levels), forecast multi-day conversion. Mock the API client. |

### 7.7 Integration Tests — What to Test

| Endpoint | Tests |
|----------|-------|
| GET /api/weather/current | 200 with valid coords, 200 with fahrenheit, 422 for missing params, 422 for invalid lat, 404 when OWM returns 404, 502 on OWM server error |
| GET /api/weather/forecast | 200 with forecast data, days param limiting, 422 for days out of range, kelvin conversion |
| GET /api/weather/alerts | 200 with no alerts (normal weather), 200 with multiple alerts (extreme conditions) |
| POST /api/locations | 201 valid, 422 invalid lat, 422 empty name, multiple creates with unique IDs |
| GET /api/locations | 200 empty list, 200 after creating |
| GET /api/locations/:id | 200 existing, 404 nonexistent |
| PUT /api/locations/:id | 200 update name, 200 update coords, 404 nonexistent |
| DELETE /api/locations/:id | 204 existing, 404 nonexistent, verify deleted |
| GET /api/locations/:id/weather | 200 with mocked OWM, 404 nonexistent location |

---

## 8. Copilot Infrastructure (CRITICAL)

This is the most important part. The project is a vehicle for teaching Copilot agentic workflows. The following infrastructure **must** be present and adapted for JS/TS.

### 8.1 Directory Structure for Copilot Customization

```
.github/
├── copilot-instructions.md          — Always-on project-level context
├── instructions/
│   ├── typescript.instructions.md   — Coding conventions for TS source (applyTo: src/**/*.ts)
│   ├── testing.instructions.md      — Testing conventions (applyTo: tests/**/*.ts)
│   └── frontend.instructions.md     — Frontend conventions (applyTo: src/**/static/** or public/**)
└── agents/
    └── teacher.agent.md             — Exercise Tutor agent (port as-is, adjust references)
```

### 8.2 `copilot-instructions.md` (Always-on)

Adapt the Python version. Must cover:
- Project overview (Copilot exercise environment, not a production app)
- Architecture description (layers, responsibilities)
- Key conventions (TS-specific syntax, lint/format tool, naming)
- Async patterns
- Custom exceptions
- Testing overview (framework, markers, no real API calls)
- Dependency table (framework, HTTP client, validation lib, test stack)
- Run commands (install, test, lint, format, dev server)

### 8.3 `instructions/typescript.instructions.md`

Adapt from `python.instructions.md`. Must cover:
- Language version (Node.js 20+, TypeScript 5.x+, ESM)
- Type hints (strict TypeScript, no `any`)
- Formatting/linting tool (Biome or ESLint + Prettier — pick one, configure in project)
- Naming conventions (camelCase for functions/vars, PascalCase for classes/types/interfaces, UPPER_SNAKE_CASE for constants)
- Layer responsibilities (same rules as Python version, adapted syntax examples)
- Async patterns (async/await everywhere for HTTP-facing code, sync for repository)
- Error handling (domain exceptions → HTTP exceptions pattern)
- Dependency injection pattern (adapted for chosen framework)
- Validation (Zod/TypeBox schemas, equivalent to Pydantic)

### 8.4 `instructions/testing.instructions.md`

Adapt from Python version. Must cover:
- Test framework and configuration
- Test organization (unit/ vs integration/ vs e2e/)
- How to filter tests by type (tags, file patterns, or config)
- Naming convention: `describe`/`it` blocks with descriptive names
- AAA pattern
- Factory usage
- Mocking strategy: unit tests mock at service boundary, integration tests mock outgoing HTTP
- Dependency overrides for testing
- Running commands

### 8.5 `instructions/frontend.instructions.md`

Port largely as-is (it describes vanilla JS conventions). Adjust any references to FastAPI static file serving — the static serving mechanism will differ by framework. Add a note about Playwright tests if frontend testing instructions are relevant here.

### 8.6 `teacher.agent.md`

Port the Exercise Tutor agent. It must:
- Reference `EXERCISES.md` (which will be customized later by the user with the agent)
- Never write code for participants
- Guide, review, suggest improvements
- Know about skills, hooks, agents concepts
- Reference the correct run commands for the JS/TS stack
- Reference the correct model comparison docs and VS Code customization docs (these are the same regardless of language)

Key: The teacher agent's instructions are **language-agnostic** in most places. The references to `uv run pytest`, `ruff`, etc. need to change to the JS/TS equivalents. The conceptual guidance (skills vs hooks vs instructions, coordinator patterns, etc.) stays the same.

---

## 9. Project Configuration

### 9.1 `package.json`

Must include:
- `"type": "module"` (ESM)
- Scripts: `dev`, `build`, `start`, `test`, `test:unit`, `test:integration`, `test:e2e`, `lint`, `format`
- Dependencies equivalent to [pyproject.toml dependencies table]:

| Python | JS/TS Equivalent |
|--------|-----------------|
| fastapi | Express/Fastify/Hono + OpenAPI generator, **or** NestJS (has built-in Swagger) |
| uvicorn | Node.js built-in or framework's server |
| httpx | `node-fetch`, `undici`, or built-in `fetch` (Node 18+) |
| pydantic-settings | `dotenv` + Zod for validation, or `env-schema` |
| pytest | Vitest or Jest |
| pytest-asyncio | Built-in to Vitest |
| pytest-httpx | `msw`, `nock`, or Vitest's `vi.mock` |
| ruff | Biome or ESLint + Prettier |

### 9.2 `tsconfig.json`

Strict mode, ESM, appropriate target.

### 9.3 `.env.example`

Same variables as Python version (see §5.2).

---

## 10. README.md

The README must mirror the Python version's structure:
- Purpose section (Copilot exercise environment)
- Exercises reference
- What It Does
- Tech Stack table
- Quick Start (get API key, install, configure, run)
- Run Tests
- Lint & Format
- Project Structure (adapted directory tree)
- API Endpoints tables
- Copilot Custom Instructions section explaining the layered instruction system
- Backlog section (same backlog item about aligning test factories with real OWM schema)

---

## 11. What NOT to Do in the Initial Stage

- **Do NOT write or customize EXERCISES.md.** The user will handle exercises customization with the agent later. Include a placeholder or copy the Python version as a starting point, but mark it as "needs customization for JS/TS."
- **Do NOT add a database.** The in-memory repository is intentional — it keeps the project zero-dependency and simple.
- **Do NOT add authentication.** The app is for workshop use only.
- **Do NOT add a build step for the frontend.** The frontend must remain vanilla JS served as static files.

---

## 12. Checklist for the Implementing Agent

- [ ] Initialize a new repository with package.json, tsconfig.json, and chosen framework
- [ ] Implement config/settings loading from env vars
- [ ] Implement model/type definitions with runtime validation (Zod or equivalent)
- [ ] Implement domain exception hierarchy
- [ ] Implement converter utility functions (pure, stateless)
- [ ] Implement `LocationRepository` (in-memory CRUD)
- [ ] Implement `OpenWeatherMapClient` (async HTTP client for OWM API)
- [ ] Implement `WeatherService` (business logic, unit conversion, alerts)
- [ ] Implement weather router (3 endpoints)
- [ ] Implement locations router (6 endpoints)
- [ ] Implement dependency injection / wiring
- [ ] Implement global error handlers
- [ ] Implement app factory with static file serving and root route
- [ ] Set up Swagger/OpenAPI docs endpoint
- [ ] Copy frontend static files (index.html, style.css, app.js) — adjust static path if needed
- [ ] Set up test framework (Vitest/Jest) with unit/integration separation
- [ ] Implement all factory functions
- [ ] Implement all unit tests (converters, models, repository, weather service)
- [ ] Implement all integration tests (weather API, locations API)
- [ ] Set up Playwright for frontend e2e tests
- [ ] Implement Playwright e2e tests
- [ ] Set up linter/formatter (Biome or ESLint+Prettier)
- [ ] Write `.github/copilot-instructions.md`
- [ ] Write `.github/instructions/typescript.instructions.md`
- [ ] Write `.github/instructions/testing.instructions.md`
- [ ] Write `.github/instructions/frontend.instructions.md`
- [ ] Write `.github/agents/teacher.agent.md`
- [ ] Write README.md
- [ ] Copy EXERCISES.md with a note that it needs JS/TS customization
- [ ] Create `.env.example`
- [ ] Verify all tests pass
- [ ] Verify lint passes
- [ ] Verify the app starts and serves the dashboard

---

## Appendix A: File-by-File Reference

Below is the complete list of Python source files and their JS/TS equivalents. Use this as a mapping guide.

| Python File | Purpose | JS/TS Equivalent Path (suggested) |
|------------|---------|-----------------------------------|
| `src/weather_app/__init__.py` | Package marker | Not needed in TS (ESM) |
| `src/weather_app/main.py` | App factory, static mount, error handlers | `src/app.ts` or `src/main.ts` |
| `src/weather_app/config.py` | Settings from env | `src/config.ts` |
| `src/weather_app/models.py` | Pydantic models | `src/models.ts` (Zod schemas + inferred types) |
| `src/weather_app/dependencies.py` | DI wiring | `src/dependencies.ts` or framework-specific DI |
| `src/weather_app/routers/weather.py` | Weather endpoints | `src/routers/weather.ts` |
| `src/weather_app/routers/locations.py` | Location endpoints | `src/routers/locations.ts` |
| `src/weather_app/services/exceptions.py` | Exception hierarchy | `src/services/exceptions.ts` |
| `src/weather_app/services/openweathermap.py` | OWM API client | `src/services/openweathermap.ts` |
| `src/weather_app/services/weather_service.py` | Business logic | `src/services/weather-service.ts` |
| `src/weather_app/repositories/location_repo.py` | In-memory CRUD | `src/repositories/location-repo.ts` |
| `src/weather_app/utils/converters.py` | Pure converters | `src/utils/converters.ts` |
| `src/weather_app/static/*` | Frontend files | `src/static/*` or `public/*` |
| `tests/conftest.py` | Shared fixtures | `tests/setup.ts` or `tests/helpers.ts` |
| `tests/factories.py` | Test data factories | `tests/factories.ts` |
| `tests/unit/conftest.py` | Unit mock fixtures | `tests/unit/setup.ts` |
| `tests/unit/test_converters.py` | Converter tests | `tests/unit/converters.test.ts` |
| `tests/unit/test_models.py` | Model validation tests | `tests/unit/models.test.ts` |
| `tests/unit/test_location_repo.py` | Repo CRUD tests | `tests/unit/location-repo.test.ts` |
| `tests/unit/test_weather_service.py` | Service tests | `tests/unit/weather-service.test.ts` |
| `tests/integration/test_weather_api.py` | Weather endpoint tests | `tests/integration/weather-api.test.ts` |
| `tests/integration/test_locations_api.py` | Location endpoint tests | `tests/integration/locations-api.test.ts` |
| — (new) | Playwright e2e tests | `tests/e2e/dashboard.spec.ts` |

---

## Appendix B: OpenWeatherMap API Response Shapes

The client must parse these raw JSON structures. Test factories must produce them.

### `/weather` response (abbreviated)
```json
{
  "coord": { "lon": -0.13, "lat": 51.51 },
  "weather": [{ "id": 802, "main": "Clouds", "description": "scattered clouds", "icon": "03d" }],
  "main": { "temp": 15.0, "feels_like": 13.5, "temp_min": 13.0, "temp_max": 17.0, "pressure": 1013, "humidity": 72 },
  "wind": { "speed": 5.5, "deg": 220 },
  "dt": 1718452800,
  "name": "London"
}
```

### `/forecast` response (abbreviated)
```json
{
  "cod": "200",
  "message": 0,
  "cnt": 40,
  "list": [
    {
      "dt": 1718452800,
      "main": { "temp": 15.0, "feels_like": 13.5, "temp_min": 14.0, "temp_max": 16.0, "pressure": 1013, "humidity": 65 },
      "weather": [{ "id": 500, "main": "Rain", "description": "light rain", "icon": "10d" }],
      "dt_txt": "2025-06-15 00:00:00"
    }
  ],
  "city": { "id": 2643743, "name": "London", "coord": { "lat": 51.51, "lon": -0.13 }, "country": "GB" }
}
```

The forecast data arrives in 3-hour intervals (up to 40 entries for 5 days). The service must aggregate these into daily summaries: min/max temperature, average humidity, most frequent description and icon per day.
