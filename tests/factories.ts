import { randomUUID } from 'node:crypto';
import type {
  Location,
  LocationCreate,
  LocationUpdate,
  CurrentWeather,
  ForecastDay,
  Forecast,
  WeatherAlert,
  OwmCurrentData,
  OwmDailyData,
  OwmAlert,
  OwmOneCallResponse,
} from '../src/models.js';

// ── Domain Factories ──────────────────────────────────────────────────────────

export function makeCoordinates(overrides: { lat?: number; lon?: number } = {}) {
  return {
    lat: overrides.lat ?? 51.51,
    lon: overrides.lon ?? -0.13,
  };
}

export function makeLocation(overrides: Partial<Location> = {}): Location {
  const coords = makeCoordinates(overrides.coordinates);
  return {
    id: overrides.id ?? randomUUID(),
    name: overrides.name ?? 'London',
    coordinates: coords,
    createdAt: overrides.createdAt ?? new Date().toISOString(),
  };
}

export function makeLocationCreate(
  overrides: Partial<LocationCreate> = {},
): LocationCreate {
  return {
    name: overrides.name ?? 'London',
    lat: overrides.lat ?? 51.51,
    lon: overrides.lon ?? -0.13,
  };
}

export function makeLocationUpdate(
  overrides: Partial<LocationUpdate> = {},
): LocationUpdate {
  return { ...overrides };
}

export function makeCurrentWeather(
  overrides: Partial<CurrentWeather> = {},
): CurrentWeather {
  return {
    temperature: overrides.temperature ?? 15.0,
    feelsLike: overrides.feelsLike ?? 13.5,
    humidity: overrides.humidity ?? 72,
    pressure: overrides.pressure ?? 1013,
    windSpeed: overrides.windSpeed ?? 5.5,
    windDirection: overrides.windDirection ?? 220,
    description: overrides.description ?? 'scattered clouds',
    icon: overrides.icon ?? '03d',
    timestamp: overrides.timestamp ?? 1718452800,
    locationName: overrides.locationName ?? 'London',
    units: overrides.units ?? 'celsius',
  };
}

export function makeForecastDay(
  overrides: Partial<ForecastDay> = {},
): ForecastDay {
  return {
    date: overrides.date ?? '2025-06-15',
    tempMin: overrides.tempMin ?? 12.0,
    tempMax: overrides.tempMax ?? 18.0,
    humidity: overrides.humidity ?? 65,
    description: overrides.description ?? 'light rain',
    icon: overrides.icon ?? '10d',
  };
}

export function makeForecast(overrides: Partial<Forecast> = {}): Forecast {
  return {
    locationName: overrides.locationName ?? 'London',
    units: overrides.units ?? 'celsius',
    days: overrides.days ?? [
      makeForecastDay({ date: '2025-06-15' }),
      makeForecastDay({ date: '2025-06-16', tempMin: 11.0, tempMax: 17.0 }),
      makeForecastDay({ date: '2025-06-17', tempMin: 13.0, tempMax: 20.0 }),
    ],
  };
}

export function makeWeatherAlert(
  overrides: Partial<WeatherAlert> = {},
): WeatherAlert {
  return {
    senderName: overrides.senderName ?? 'NWS Philadelphia',
    event: overrides.event ?? 'Heat Advisory',
    start: overrides.start ?? 1597341600,
    end: overrides.end ?? 1597366800,
    description:
      overrides.description ??
      'Heat index values of 105 to 109 degrees expected.',
    tags: overrides.tags ?? ['Extreme temperature value'],
  };
}

// ── OWM API Response Factories ────────────────────────────────────────────────

export function makeOwmCurrentWeatherData(
  overrides: Partial<OwmCurrentData> = {},
): OwmCurrentData {
  return {
    dt: overrides.dt ?? 1718452800,
    temp: overrides.temp ?? 15.0,
    feels_like: overrides.feels_like ?? 13.5,
    pressure: overrides.pressure ?? 1013,
    humidity: overrides.humidity ?? 72,
    wind_speed: overrides.wind_speed ?? 5.5,
    wind_deg: overrides.wind_deg ?? 220,
    weather: overrides.weather ?? [
      { id: 802, main: 'Clouds', description: 'scattered clouds', icon: '03d' },
    ],
  };
}

export function makeOwmDailyData(
  overrides: Partial<OwmDailyData> = {},
): OwmDailyData {
  return {
    dt: overrides.dt ?? 1718452800,
    temp: overrides.temp ?? {
      min: 12.0,
      max: 18.0,
      day: 16.0,
      night: 12.5,
      eve: 15.0,
      morn: 13.0,
    },
    humidity: overrides.humidity ?? 65,
    weather: overrides.weather ?? [
      { id: 500, main: 'Rain', description: 'light rain', icon: '10d' },
    ],
  };
}

export function makeOwmAlert(overrides: Partial<OwmAlert> = {}): OwmAlert {
  return {
    sender_name: overrides.sender_name ?? 'NWS Philadelphia',
    event: overrides.event ?? 'Heat Advisory',
    start: overrides.start ?? 1597341600,
    end: overrides.end ?? 1597366800,
    description:
      overrides.description ??
      'Heat index values of 105 to 109 degrees expected.',
    tags: overrides.tags ?? ['Extreme temperature value'],
  };
}

export function makeOwmOneCallResponse(
  overrides: Partial<OwmOneCallResponse> = {},
): OwmOneCallResponse {
  return {
    lat: overrides.lat ?? 51.51,
    lon: overrides.lon ?? -0.13,
    timezone: overrides.timezone ?? 'Europe/London',
    current: overrides.current ?? makeOwmCurrentWeatherData(),
    daily: overrides.daily ?? [
      makeOwmDailyData({ dt: 1718452800 }),
      makeOwmDailyData({ dt: 1718539200 }),
      makeOwmDailyData({ dt: 1718625600 }),
      makeOwmDailyData({ dt: 1718712000 }),
      makeOwmDailyData({ dt: 1718798400 }),
    ],
    alerts: overrides.alerts ?? undefined,
  };
}

export function makeOwmOneCallCurrentOnly(
  currentOverrides: Partial<OwmCurrentData> = {},
): OwmOneCallResponse {
  return {
    lat: 51.51,
    lon: -0.13,
    timezone: 'Europe/London',
    current: makeOwmCurrentWeatherData(currentOverrides),
  };
}

export function makeOwmOneCallForecastOnly(
  dailyOverrides: OwmDailyData[] | undefined = undefined,
): OwmOneCallResponse {
  return {
    lat: 51.51,
    lon: -0.13,
    timezone: 'Europe/London',
    daily: dailyOverrides ?? [
      makeOwmDailyData({ dt: 1718452800 }),
      makeOwmDailyData({ dt: 1718539200 }),
      makeOwmDailyData({ dt: 1718625600 }),
      makeOwmDailyData({ dt: 1718712000 }),
      makeOwmDailyData({ dt: 1718798400 }),
    ],
  };
}

export function makeOwmOneCallAlertsOnly(
  alerts: OwmAlert[] = [makeOwmAlert()],
): OwmOneCallResponse {
  return {
    lat: 51.51,
    lon: -0.13,
    timezone: 'Europe/London',
    alerts,
  };
}
