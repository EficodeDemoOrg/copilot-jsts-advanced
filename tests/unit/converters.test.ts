import { describe, it, expect } from 'vitest';
import {
  celsiusToFahrenheit,
  celsiusToKelvin,
  fahrenheitToCelsius,
  mpsToKmh,
  mpsToMph,
  degreesToCompass,
} from '../../src/utils/converters.js';

describe('celsiusToFahrenheit', () => {
  it.each([
    [0, 32],
    [100, 212],
    [-40, -40],
    [37, 98.6],
    [15, 59],
  ])('converts %f°C to %f°F', (celsius, expected) => {
    expect(celsiusToFahrenheit(celsius)).toBeCloseTo(expected, 1);
  });
});

describe('celsiusToKelvin', () => {
  it.each([
    [0, 273.15],
    [100, 373.15],
    [-273.15, 0],
    [25, 298.15],
  ])('converts %f°C to %fK', (celsius, expected) => {
    expect(celsiusToKelvin(celsius)).toBeCloseTo(expected, 1);
  });
});

describe('fahrenheitToCelsius', () => {
  it.each([
    [32, 0],
    [212, 100],
    [-40, -40],
    [98.6, 37],
  ])('converts %f°F to %f°C', (fahrenheit, expected) => {
    expect(fahrenheitToCelsius(fahrenheit)).toBeCloseTo(expected, 1);
  });
});

describe('mpsToKmh', () => {
  it.each([
    [1, 3.6],
    [0, 0],
    [10, 36],
    [5.5, 19.8],
  ])('converts %f m/s to %f km/h', (mps, expected) => {
    expect(mpsToKmh(mps)).toBeCloseTo(expected, 1);
  });
});

describe('mpsToMph', () => {
  it.each([
    [1, 2.24],
    [0, 0],
    [10, 22.37],
  ])('converts %f m/s to %f mph', (mps, expected) => {
    expect(mpsToMph(mps)).toBeCloseTo(expected, 1);
  });
});

describe('degreesToCompass', () => {
  it.each([
    [0, 'N'],
    [360, 'N'],
    [45, 'NE'],
    [90, 'E'],
    [135, 'SE'],
    [180, 'S'],
    [225, 'SW'],
    [270, 'W'],
    [315, 'NW'],
    [22.5, 'NNE'],
    [337.5, 'NNW'],
    [11.25, 'NNE'],
    [168.75, 'S'],
  ])('converts %f° to %s', (degrees, expected) => {
    expect(degreesToCompass(degrees)).toBe(expected);
  });

  it('handles negative degrees', () => {
    expect(degreesToCompass(-90)).toBe('W');
  });

  it('handles degrees > 360', () => {
    expect(degreesToCompass(450)).toBe('E');
  });
});
