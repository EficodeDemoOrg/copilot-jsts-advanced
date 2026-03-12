import type { Settings } from './config.js';
import { LocationRepository } from './repositories/location-repo.js';
import { OpenWeatherMapClient } from './services/openweathermap.js';
import { WeatherService } from './services/weather-service.js';

export interface AppContainer {
  settings: Settings;
  locationRepository: LocationRepository;
  weatherService: WeatherService;
  owmClient: OpenWeatherMapClient;
}

export function createContainer(settings: Settings): AppContainer {
  const locationRepository = new LocationRepository();
  const owmClient = new OpenWeatherMapClient(settings);
  const weatherService = new WeatherService(owmClient, settings);
  return { settings, locationRepository, weatherService, owmClient };
}
