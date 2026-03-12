import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createTestApp, createTestSettings } from '../setup.js';
import { OpenWeatherMapClient } from '../../src/services/openweathermap.js';
import { WeatherService } from '../../src/services/weather-service.js';
import {
  makeOwmCurrentWeatherData,
  makeOwmDailyData,
  makeOwmAlert,
} from '../factories.js';
import {
  WeatherAPINotFoundError,
  WeatherAPIConnectionError,
  WeatherAPIError,
} from '../../src/services/exceptions.js';

function createMockedApp() {
  const settings = createTestSettings();
  const mockClient = {
    getCurrentWeather: vi.fn(),
    getDailyForecast: vi.fn(),
    getAlerts: vi.fn(),
  } as unknown as OpenWeatherMapClient;
  const weatherService = new WeatherService(mockClient, settings);

  const { app } = createTestApp({
    settings,
    owmClient: mockClient,
    weatherService,
  });

  return { app, mockClient: mockClient as unknown as {
    getCurrentWeather: ReturnType<typeof vi.fn>;
    getDailyForecast: ReturnType<typeof vi.fn>;
    getAlerts: ReturnType<typeof vi.fn>;
  }};
}

describe('GET /api/weather/current', () => {
  it('returns 200 with valid coordinates', async () => {
    const { app, mockClient } = createMockedApp();
    mockClient.getCurrentWeather.mockResolvedValue({
      current: makeOwmCurrentWeatherData(),
      timezone: 'Europe/London',
    });

    const res = await request(app).get('/api/weather/current?lat=51.51&lon=-0.13');

    expect(res.status).toBe(200);
    expect(res.body.temperature).toBe(15.0);
    expect(res.body.locationName).toBe('London');
    expect(res.body.units).toBe('celsius');
  });

  it('returns 200 with fahrenheit units', async () => {
    const { app, mockClient } = createMockedApp();
    mockClient.getCurrentWeather.mockResolvedValue({
      current: makeOwmCurrentWeatherData({ temp: 0 }),
      timezone: 'Europe/London',
    });

    const res = await request(app).get(
      '/api/weather/current?lat=51.51&lon=-0.13&units=fahrenheit',
    );

    expect(res.status).toBe(200);
    expect(res.body.units).toBe('fahrenheit');
    expect(res.body.temperature).toBeCloseTo(32, 0);
  });

  it('returns 422 for missing params', async () => {
    const { app } = createMockedApp();
    const res = await request(app).get('/api/weather/current');
    expect(res.status).toBe(422);
  });

  it('returns 422 for invalid lat', async () => {
    const { app } = createMockedApp();
    const res = await request(app).get('/api/weather/current?lat=100&lon=0');
    expect(res.status).toBe(422);
  });

  it('returns 404 when OWM returns 404', async () => {
    const { app, mockClient } = createMockedApp();
    mockClient.getCurrentWeather.mockRejectedValue(new WeatherAPINotFoundError());

    const res = await request(app).get('/api/weather/current?lat=51.51&lon=-0.13');
    expect(res.status).toBe(404);
  });

  it('returns 502 on OWM server error', async () => {
    const { app, mockClient } = createMockedApp();
    mockClient.getCurrentWeather.mockRejectedValue(
      new WeatherAPIError(500, 'Internal Server Error'),
    );

    const res = await request(app).get('/api/weather/current?lat=51.51&lon=-0.13');
    expect(res.status).toBe(502);
  });

  it('returns 503 on connection error', async () => {
    const { app, mockClient } = createMockedApp();
    mockClient.getCurrentWeather.mockRejectedValue(
      new WeatherAPIConnectionError('Connection refused'),
    );

    const res = await request(app).get('/api/weather/current?lat=51.51&lon=-0.13');
    expect(res.status).toBe(503);
  });
});

describe('GET /api/weather/forecast', () => {
  it('returns 200 with forecast data', async () => {
    const { app, mockClient } = createMockedApp();
    const dailyData = Array.from({ length: 5 }, (_, i) =>
      makeOwmDailyData({ dt: 1718452800 + i * 86400 }),
    );
    mockClient.getDailyForecast.mockResolvedValue({
      daily: dailyData,
      timezone: 'Europe/London',
    });

    const res = await request(app).get('/api/weather/forecast?lat=51.51&lon=-0.13');

    expect(res.status).toBe(200);
    expect(res.body.days).toHaveLength(5);
    expect(res.body.locationName).toBe('London');
  });

  it('respects days parameter', async () => {
    const { app, mockClient } = createMockedApp();
    const dailyData = Array.from({ length: 5 }, (_, i) =>
      makeOwmDailyData({ dt: 1718452800 + i * 86400 }),
    );
    mockClient.getDailyForecast.mockResolvedValue({
      daily: dailyData,
      timezone: 'Europe/London',
    });

    const res = await request(app).get(
      '/api/weather/forecast?lat=51.51&lon=-0.13&days=2',
    );

    expect(res.status).toBe(200);
    expect(res.body.days).toHaveLength(2);
  });

  it('returns 422 for days out of range', async () => {
    const { app } = createMockedApp();
    const res = await request(app).get(
      '/api/weather/forecast?lat=51.51&lon=-0.13&days=10',
    );
    expect(res.status).toBe(422);
  });

  it('converts forecast to kelvin', async () => {
    const { app, mockClient } = createMockedApp();
    mockClient.getDailyForecast.mockResolvedValue({
      daily: [makeOwmDailyData({ temp: { min: 0, max: 0, day: 0, night: 0, eve: 0, morn: 0 } })],
      timezone: 'Europe/London',
    });

    const res = await request(app).get(
      '/api/weather/forecast?lat=51.51&lon=-0.13&days=1&units=kelvin',
    );

    expect(res.status).toBe(200);
    expect(res.body.days[0].tempMin).toBeCloseTo(273.15, 1);
  });
});

describe('GET /api/weather/alerts', () => {
  it('returns 200 with no alerts', async () => {
    const { app, mockClient } = createMockedApp();
    mockClient.getAlerts.mockResolvedValue([]);

    const res = await request(app).get('/api/weather/alerts?lat=51.51&lon=-0.13');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns 200 with alerts', async () => {
    const { app, mockClient } = createMockedApp();
    mockClient.getAlerts.mockResolvedValue([
      makeOwmAlert({ event: 'Heat Advisory' }),
      makeOwmAlert({ event: 'Flood Warning' }),
    ]);

    const res = await request(app).get('/api/weather/alerts?lat=33.44&lon=-94.04');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].event).toBe('Heat Advisory');
    expect(res.body[1].event).toBe('Flood Warning');
  });

  it('returns 422 for missing coordinates', async () => {
    const { app } = createMockedApp();
    const res = await request(app).get('/api/weather/alerts?lat=51.51');
    expect(res.status).toBe(422);
  });
});
