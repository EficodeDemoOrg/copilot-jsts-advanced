import { randomUUID } from 'node:crypto';
import type { Location, LocationCreate, LocationUpdate } from '../models.js';
import { LocationNotFoundError } from '../services/exceptions.js';

export class LocationRepository {
  private locations = new Map<string, Location>();

  add(data: LocationCreate): Location {
    const location: Location = {
      id: randomUUID(),
      name: data.name,
      coordinates: { lat: data.lat, lon: data.lon },
      createdAt: new Date().toISOString(),
    };
    this.locations.set(location.id, location);
    return location;
  }

  get(id: string): Location {
    const location = this.locations.get(id);
    if (!location) throw new LocationNotFoundError(id);
    return location;
  }

  listAll(): Location[] {
    return [...this.locations.values()].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }

  delete(id: string): boolean {
    if (!this.locations.has(id)) throw new LocationNotFoundError(id);
    this.locations.delete(id);
    return true;
  }

  update(id: string, data: LocationUpdate): Location {
    const location = this.get(id);
    if (data.name !== undefined) location.name = data.name;
    if (data.lat !== undefined) location.coordinates.lat = data.lat;
    if (data.lon !== undefined) location.coordinates.lon = data.lon;
    this.locations.set(id, location);
    return location;
  }
}
