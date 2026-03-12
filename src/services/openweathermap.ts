import type { Settings } from '../config.js';
import type { OwmCurrentData, OwmDailyData, OwmAlert, OwmOneCallResponse } from '../models.js';
import { OwmOneCallResponseSchema } from '../models.js';
import {
  WeatherAPIError,
  WeatherAPINotFoundError,
  WeatherAPIConnectionError,
} from './exceptions.js';

export class OpenWeatherMapClient {
  constructor(private settings: Settings) {}

  async getCurrentWeather(
    lat: number,
    lon: number,
  ): Promise<{ current: OwmCurrentData; timezone: string }> {
    const data = await this.fetchOneCall(lat, lon, [
      'minutely',
      'hourly',
      'daily',
      'alerts',
    ]);
    if (!data.current) {
      throw new WeatherAPIError(500, 'No current weather data in API response');
    }
    return { current: data.current, timezone: data.timezone };
  }

  async getDailyForecast(
    lat: number,
    lon: number,
  ): Promise<{ daily: OwmDailyData[]; timezone: string }> {
    const data = await this.fetchOneCall(lat, lon, [
      'current',
      'minutely',
      'hourly',
      'alerts',
    ]);
    return { daily: data.daily ?? [], timezone: data.timezone };
  }

  async getAlerts(lat: number, lon: number): Promise<OwmAlert[]> {
    const data = await this.fetchOneCall(lat, lon, [
      'current',
      'minutely',
      'hourly',
      'daily',
    ]);
    return data.alerts ?? [];
  }

  private async fetchOneCall(
    lat: number,
    lon: number,
    exclude: string[],
  ): Promise<OwmOneCallResponse> {
    const url = new URL(`${this.settings.openWeatherMapBaseUrl}/onecall`);
    url.searchParams.set('lat', lat.toString());
    url.searchParams.set('lon', lon.toString());
    url.searchParams.set('exclude', exclude.join(','));
    url.searchParams.set('units', 'metric');
    url.searchParams.set('appid', this.settings.openWeatherMapApiKey);

    let response: Response;
    try {
      response = await fetch(url.toString(), {
        signal: AbortSignal.timeout(10_000),
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'TimeoutError') {
        throw new WeatherAPIConnectionError('Request to weather API timed out');
      }
      throw new WeatherAPIConnectionError(
        error instanceof Error ? error.message : 'Failed to connect to weather API',
      );
    }

    if (response.status === 404) {
      throw new WeatherAPINotFoundError();
    }
    if (!response.ok) {
      const body = await response.text();
      throw new WeatherAPIError(response.status, body);
    }

    const json: unknown = await response.json();
    return OwmOneCallResponseSchema.parse(json);
  }
}
