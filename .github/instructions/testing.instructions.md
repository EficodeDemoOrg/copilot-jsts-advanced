---
applyTo: "tests/**/*.ts"
---

# Testing Conventions

## Framework & Configuration

- **Vitest** for unit and integration tests (`vitest.config.ts`)
- **Playwright** for end-to-end tests (`playwright.config.ts`)
- **supertest** for integration tests against the Express app
- Globals enabled: `describe`, `it`, `expect`, `vi`, `beforeEach` available without imports

## Test Organization

```
tests/
├── setup.ts           — Shared test helpers: createTestSettings, createTestApp
├── factories.ts       — Test data factories for all models & OWM responses
├── unit/
│   ├── converters.test.ts
│   ├── models.test.ts
│   ├── location-repo.test.ts
│   └── weather-service.test.ts
├── integration/
│   ├── weather-api.test.ts
│   └── locations-api.test.ts
└── e2e/
    └── dashboard.spec.ts
```

## Running Tests

```bash
npm test                    # All unit + integration tests
npm run test:unit           # Unit tests only
npm run test:integration    # Integration tests only
npm run test:e2e            # Playwright e2e tests
npm run test:watch          # Watch mode
```

## Test Naming

Use `describe`/`it` blocks with descriptive names:
```typescript
describe('WeatherService', () => {
  describe('getCurrentWeather', () => {
    it('converts temperatures to fahrenheit', async () => { ... });
  });
});
```

## AAA Pattern

Every test follows **Arrange → Act → Assert**:
```typescript
it('creates a location with an id', () => {
  // Arrange
  const data = makeLocationCreate({ name: 'London' });

  // Act
  const location = repo.add(data);

  // Assert
  expect(location.id).toBeDefined();
  expect(location.name).toBe('London');
});
```

## Factory Usage

**Always** use factories from `tests/factories.ts` instead of inline objects:
- `makeCurrentWeather()`, `makeLocation()`, `makeForecastDay()`, etc.
- All factories accept partial overrides: `makeLocation({ name: 'Custom' })`
- OWM response factories: `makeOwmCurrentWeatherData()`, `makeOwmOneCallResponse()`
- Specialized helpers: `makeOwmOneCallCurrentOnly()`, `makeOwmOneCallAlertsOnly()`

## Mocking Strategy

### Unit Tests
- Mock at the service boundary using `vi.fn()`
- Create mock objects that satisfy the interface
- Example: mock `OpenWeatherMapClient` methods for `WeatherService` tests

### Integration Tests
- Create a full Express app via `createTestApp()`
- Mock the `OpenWeatherMapClient` to avoid real API calls
- Use `supertest` to make HTTP requests against the app
- Each test function creates its own app instance (fresh state)

### No Real API Calls — Ever
Tests must never make real HTTP requests to OpenWeatherMap. The mock client is injected via the dependency container.

## Dependency Overrides

```typescript
import { createTestApp } from '../setup.js';

const mockClient = {
  getCurrentWeather: vi.fn().mockResolvedValue({ ... }),
  getDailyForecast: vi.fn(),
  getAlerts: vi.fn(),
};

const { app } = createTestApp({ owmClient: mockClient });
```

## Parametrized Tests

Use `it.each` for testing multiple inputs:
```typescript
it.each([
  [0, 32],
  [100, 212],
  [-40, -40],
])('converts %f°C to %f°F', (celsius, expected) => {
  expect(celsiusToFahrenheit(celsius)).toBeCloseTo(expected, 1);
});
```
