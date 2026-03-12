import type { Settings } from '../config.js';
import type {
  CurrentWeather,
  Forecast,
  ForecastDay,
  TemperatureUnit,
  WeatherAlert,
} from '../models.js';
import { celsiusToFahrenheit, celsiusToKelvin } from '../utils/converters.js';
import type { OpenWeatherMapClient } from './openweathermap.js';

function timezoneToLocationName(timezone: string): string {
  const parts = timezone.split('/');
  return (parts[parts.length - 1] ?? timezone).replace(/_/g, ' ');
}

function convertTemperature(celsius: number, units: TemperatureUnit): number {
  switch (units) {
    case 'fahrenheit':
      return celsiusToFahrenheit(celsius);
    case 'kelvin':
      return celsiusToKelvin(celsius);
    case 'celsius':
    default:
      return celsius;
  }
}

export class WeatherService {
  constructor(
    private client: OpenWeatherMapClient,
    private settings: Settings,
  ) {}

  async getCurrentWeather(
    lat: number,
    lon: number,
    units: TemperatureUnit = 'celsius',
    locationName?: string,
  ): Promise<CurrentWeather> {
    const { current, timezone } = await this.client.getCurrentWeather(lat, lon);

    return {
      temperature: convertTemperature(current.temp, units),
      feelsLike: convertTemperature(current.feels_like, units),
      humidity: current.humidity,
      pressure: current.pressure,
      windSpeed: current.wind_speed,
      windDirection: current.wind_deg,
      description: current.weather[0]!.description,
      icon: current.weather[0]!.icon,
      timestamp: current.dt,
      locationName: locationName ?? timezoneToLocationName(timezone),
      units,
    };
  }

  async getForecast(
    lat: number,
    lon: number,
    days: number = 5,
    units: TemperatureUnit = 'celsius',
    locationName?: string,
  ): Promise<Forecast> {
    const { daily, timezone } = await this.client.getDailyForecast(lat, lon);

    const forecastDays: ForecastDay[] = daily.slice(0, days).map((day) => ({
      date: new Date(day.dt * 1000).toISOString().split('T')[0]!,
      tempMin: convertTemperature(day.temp.min, units),
      tempMax: convertTemperature(day.temp.max, units),
      humidity: day.humidity,
      description: day.weather[0]!.description,
      icon: day.weather[0]!.icon,
    }));

    return {
      locationName: locationName ?? timezoneToLocationName(timezone),
      units,
      days: forecastDays,
    };
  }

  async getAlerts(lat: number, lon: number): Promise<WeatherAlert[]> {
    const alerts = await this.client.getAlerts(lat, lon);
    return alerts.map((alert) => ({
      senderName: alert.sender_name,
      event: alert.event,
      start: alert.start,
      end: alert.end,
      description: alert.description,
      tags: alert.tags,
    }));
  }
}
