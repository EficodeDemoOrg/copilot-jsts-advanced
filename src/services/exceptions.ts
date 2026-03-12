export class WeatherAppError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WeatherAppError';
  }
}

export class WeatherAPIError extends WeatherAppError {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'WeatherAPIError';
  }
}

export class WeatherAPINotFoundError extends WeatherAPIError {
  constructor(message = 'Weather data not found for the given location') {
    super(404, message);
    this.name = 'WeatherAPINotFoundError';
  }
}

export class WeatherAPIConnectionError extends WeatherAppError {
  constructor(message = 'Failed to connect to weather API') {
    super(message);
    this.name = 'WeatherAPIConnectionError';
  }
}

export class LocationNotFoundError extends WeatherAppError {
  constructor(public readonly locationId: string) {
    super(`Location not found: ${locationId}`);
    this.name = 'LocationNotFoundError';
  }
}
