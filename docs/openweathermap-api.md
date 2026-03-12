# OpenWeatherMap One Call API 3.0 — Quick Reference

This app uses the **One Call API 3.0** endpoint. This document covers only the parts used by the weather service.

## Endpoint

```
GET https://api.openweathermap.org/data/3.0/onecall
```

## Required Parameters

| Parameter | Description |
|-----------|-------------|
| `lat` | Latitude (-90 to 90) |
| `lon` | Longitude (-180 to 180) |
| `appid` | Your API key |

## Optional Parameters

| Parameter | Description | Used by this app |
|-----------|-------------|-----------------|
| `units` | `standard`, `metric`, `imperial` | Always `metric` |
| `exclude` | Comma-separated: `current`, `minutely`, `hourly`, `daily`, `alerts` | Yes — excludes unused sections per endpoint |

## Response Structure (metric units)

```json
{
  "lat": 51.51,
  "lon": -0.13,
  "timezone": "Europe/London",
  "timezone_offset": 3600,
  "current": {
    "dt": 1718452800,
    "temp": 15.0,
    "feels_like": 13.5,
    "pressure": 1013,
    "humidity": 72,
    "wind_speed": 5.5,
    "wind_deg": 220,
    "weather": [
      { "id": 802, "main": "Clouds", "description": "scattered clouds", "icon": "03d" }
    ]
  },
  "daily": [
    {
      "dt": 1718452800,
      "temp": { "min": 10.0, "max": 18.0 },
      "humidity": 65,
      "weather": [
        { "id": 500, "main": "Rain", "description": "light rain", "icon": "10d" }
      ]
    }
  ],
  "alerts": [
    {
      "sender_name": "Met Office",
      "event": "Yellow Wind Warning",
      "start": 1718452800,
      "end": 1718496000,
      "description": "Strong winds expected...",
      "tags": ["Wind"]
    }
  ]
}
```

## Key Differences from API 2.5

| Aspect | 2.5 (`/weather`, `/forecast`) | 3.0 (`/onecall`) |
|--------|-------------------------------|-------------------|
| Endpoints | Separate for current/forecast | Single endpoint with `exclude` |
| City name | Returned in response (`name`) | Not returned — use `timezone` field |
| Daily forecast | 3-hour intervals, must aggregate | Pre-aggregated daily data |
| Alerts | Not available | Government alerts included |
| Free tier | 1,000,000 calls/month | 1,000 calls/day |

## How This App Uses the API

| App endpoint | OWM `exclude` parameter | Data used |
|-------------|------------------------|-----------|
| `/api/weather/current` | `minutely,hourly,daily,alerts` | `current` section |
| `/api/weather/forecast` | `current,minutely,hourly,alerts` | `daily` section |
| `/api/weather/alerts` | `current,minutely,hourly,daily` | `alerts` section |

## Unit Conversion

The app always requests `units=metric` (Celsius, m/s). Temperature conversion to fahrenheit/kelvin is handled in the service layer.

## Error Responses

| HTTP Status | Meaning |
|------------|---------|
| 401 | Invalid API key |
| 404 | Location not found |
| 429 | Rate limit exceeded |
| 5xx | OWM server error |
