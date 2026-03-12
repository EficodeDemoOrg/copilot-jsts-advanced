import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WeatherService } from '../../src/services/weather-service.js';
import { OpenWeatherMapClient } from '../../src/services/openweathermap.js';
import { createTestSettings } from '../setup.js';
import {
  makeOwmCurrentWeatherData,
  makeOwmDailyData,
  makeOwmAlert,
} from '../factories.js';

describe('WeatherService', () => {
  let service: WeatherService;
  let mockClient: {
    getCurrentWeather: ReturnType<typeof vi.fn>;
    getDailyForecast: ReturnType<typeof vi.fn>;
    getAlerts: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockClient = {
      getCurrentWeather: vi.fn(),
      getDailyForecast: vi.fn(),
      getAlerts: vi.fn(),
    };
    const settings = createTestSettings();
    service = new WeatherService(
      mockClient as unknown as OpenWeatherMapClient,
      settings,
    );
  });

  describe('getCurrentWeather', () => {
    it('returns current weather in celsius (default)', async () => {
      mockClient.getCurrentWeather.mockResolvedValue({
        current: makeOwmCurrentWeatherData({ temp: 15.0, feels_like: 13.5 }),
        timezone: 'Europe/London',
      });

      const result = await service.getCurrentWeather(51.51, -0.13);

      expect(result.temperature).toBe(15.0);
      expect(result.feelsLike).toBe(13.5);
      expect(result.units).toBe('celsius');
      expect(result.locationName).toBe('London');
    });

    it('converts to fahrenheit', async () => {
      mockClient.getCurrentWeather.mockResolvedValue({
        current: makeOwmCurrentWeatherData({ temp: 0, feels_like: -5 }),
        timezone: 'Europe/London',
      });

      const result = await service.getCurrentWeather(51.51, -0.13, 'fahrenheit');

      expect(result.temperature).toBeCloseTo(32, 1);
      expect(result.feelsLike).toBeCloseTo(23, 0);
      expect(result.units).toBe('fahrenheit');
    });

    it('converts to kelvin', async () => {
      mockClient.getCurrentWeather.mockResolvedValue({
        current: makeOwmCurrentWeatherData({ temp: 0, feels_like: 0 }),
        timezone: 'Europe/London',
      });

      const result = await service.getCurrentWeather(51.51, -0.13, 'kelvin');

      expect(result.temperature).toBeCloseTo(273.15, 1);
      expect(result.units).toBe('kelvin');
    });

    it('preserves non-temperature fields unchanged', async () => {
      mockClient.getCurrentWeather.mockResolvedValue({
        current: makeOwmCurrentWeatherData({
          humidity: 85,
          pressure: 1020,
          wind_speed: 7.0,
          wind_deg: 180,
        }),
        timezone: 'Europe/London',
      });

      const result = await service.getCurrentWeather(
        51.51,
        -0.13,
        'fahrenheit',
      );

      expect(result.humidity).toBe(85);
      expect(result.pressure).toBe(1020);
      expect(result.windSpeed).toBe(7.0);
      expect(result.windDirection).toBe(180);
    });

    it('uses provided locationName over timezone', async () => {
      mockClient.getCurrentWeather.mockResolvedValue({
        current: makeOwmCurrentWeatherData(),
        timezone: 'Europe/London',
      });

      const result = await service.getCurrentWeather(
        51.51,
        -0.13,
        'celsius',
        'My Custom Name',
      );

      expect(result.locationName).toBe('My Custom Name');
    });

    it('extracts city name from timezone', async () => {
      mockClient.getCurrentWeather.mockResolvedValue({
        current: makeOwmCurrentWeatherData(),
        timezone: 'America/New_York',
      });

      const result = await service.getCurrentWeather(40.7, -74.0);

      expect(result.locationName).toBe('New York');
    });
  });

  describe('getForecast', () => {
    it('returns forecast in celsius', async () => {
      const dailyData = [
        makeOwmDailyData({ dt: 1718452800, temp: { min: 10, max: 20, day: 16, night: 11, eve: 15, morn: 12 } }),
        makeOwmDailyData({ dt: 1718539200, temp: { min: 12, max: 22, day: 18, night: 13, eve: 17, morn: 14 } }),
      ];
      mockClient.getDailyForecast.mockResolvedValue({
        daily: dailyData,
        timezone: 'Europe/London',
      });

      const result = await service.getForecast(51.51, -0.13, 2);

      expect(result.days).toHaveLength(2);
      expect(result.days[0]!.tempMin).toBe(10);
      expect(result.days[0]!.tempMax).toBe(20);
      expect(result.units).toBe('celsius');
    });

    it('converts forecast temperatures to fahrenheit', async () => {
      const dailyData = [
        makeOwmDailyData({ temp: { min: 0, max: 100, day: 50, night: 10, eve: 30, morn: 20 } }),
      ];
      mockClient.getDailyForecast.mockResolvedValue({
        daily: dailyData,
        timezone: 'Europe/London',
      });

      const result = await service.getForecast(51.51, -0.13, 1, 'fahrenheit');

      expect(result.days[0]!.tempMin).toBeCloseTo(32, 0);
      expect(result.days[0]!.tempMax).toBeCloseTo(212, 0);
    });

    it('limits days to requested count', async () => {
      const dailyData = Array.from({ length: 5 }, (_, i) =>
        makeOwmDailyData({ dt: 1718452800 + i * 86400 }),
      );
      mockClient.getDailyForecast.mockResolvedValue({
        daily: dailyData,
        timezone: 'Europe/London',
      });

      const result = await service.getForecast(51.51, -0.13, 3);

      expect(result.days).toHaveLength(3);
    });

    it('converts forecast temperatures to kelvin', async () => {
      const dailyData = [
        makeOwmDailyData({ temp: { min: 0, max: 0, day: 0, night: 0, eve: 0, morn: 0 } }),
      ];
      mockClient.getDailyForecast.mockResolvedValue({
        daily: dailyData,
        timezone: 'Europe/London',
      });

      const result = await service.getForecast(51.51, -0.13, 1, 'kelvin');

      expect(result.days[0]!.tempMin).toBeCloseTo(273.15, 1);
      expect(result.days[0]!.tempMax).toBeCloseTo(273.15, 1);
    });
  });

  describe('getAlerts', () => {
    it('returns empty array when no alerts', async () => {
      mockClient.getAlerts.mockResolvedValue([]);
      const result = await service.getAlerts(51.51, -0.13);
      expect(result).toEqual([]);
    });

    it('maps OWM alerts to domain alerts', async () => {
      const owmAlert = makeOwmAlert({
        sender_name: 'NWS Test',
        event: 'Flood Warning',
        start: 1000,
        end: 2000,
        description: 'Flooding expected',
        tags: ['Flood'],
      });
      mockClient.getAlerts.mockResolvedValue([owmAlert]);

      const result = await service.getAlerts(51.51, -0.13);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        senderName: 'NWS Test',
        event: 'Flood Warning',
        start: 1000,
        end: 2000,
        description: 'Flooding expected',
        tags: ['Flood'],
      });
    });

    it('returns multiple alerts', async () => {
      mockClient.getAlerts.mockResolvedValue([
        makeOwmAlert({ event: 'Alert 1' }),
        makeOwmAlert({ event: 'Alert 2' }),
      ]);

      const result = await service.getAlerts(51.51, -0.13);
      expect(result).toHaveLength(2);
    });
  });
});
