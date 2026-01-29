import { Injectable, Logger, Inject, BadRequestException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ExternalApiService } from '../external-api/external-api.service';
import { Trip } from '../external-api/interfaces/trip.interface';
import { SearchTripDto, SortStrategy } from './dto/search-trip.dto';
import { SUPPORTED_PLACES } from './constants/places.constant';

@Injectable()
export class TripsService {
  private readonly logger = new Logger(TripsService.name);

  constructor(
    private readonly externalApiService: ExternalApiService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Search for trips based on origin, destination, and sorting strategy
   * @param searchDto - Search parameters including origin, destination, and sort_by
   * @returns Sorted array of trips
   */
  async searchTrips(searchDto: SearchTripDto): Promise<Trip[]> {
    const { origin, destination, sort_by } = searchDto;

    // Validate if the places are supported
    this.validatePlaces(origin, destination);

    // Generate cache key
    const cacheKey = `trips:${origin}:${destination}:${sort_by}`;

    // Check cache first
    const cachedResult = await this.cacheManager.get<Trip[]>(cacheKey);
    if (cachedResult) {
      this.logger.debug(`Cache hit for key: ${cacheKey}`);
      return cachedResult;
    }

    this.logger.debug(`Cache miss for key: ${cacheKey}`);

    // Fetch trips from external API
    const trips = await this.externalApiService.searchTrips({
      origin,
      destination,
    });

    if (trips.length === 0) {
      this.logger.warn(`No trips found from ${origin} to ${destination}`);
      return [];
    }

    // Sort trips based on strategy
    const sortedTrips = this.sortTrips(trips, sort_by);

    // Cache the result
    await this.cacheManager.set(cacheKey, sortedTrips);
    this.logger.debug(`Cached result for key: ${cacheKey}`);

    return sortedTrips;
  }

  /**
   * Sort trips based on the selected strategy
   * @param trips - Array of trips to sort
   * @param strategy - Sorting strategy (fastest or cheapest)
   * @returns Sorted array of trips
   */
  private sortTrips(trips: Trip[], strategy: SortStrategy): Trip[] {
    const tripsCopy = [...trips];

    switch (strategy) {
      case SortStrategy.FASTEST:
        return tripsCopy.sort((a, b) => a.duration - b.duration);

      case SortStrategy.CHEAPEST:
        return tripsCopy.sort((a, b) => a.cost - b.cost);

      default:
        this.logger.warn(`Unknown sort strategy: ${strategy}, returning unsorted`);
        return tripsCopy;
    }
  }

  /**
   * Validate that the provided places are supported
   * @param origin - Origin place code
   * @param destination - Destination place code
   * @throws BadRequestException if places are not supported
   */
  private validatePlaces(origin: string, destination: string): void {
    const unsupportedPlaces: string[] = [];

    if (!SUPPORTED_PLACES.includes(origin as never)) { 
      unsupportedPlaces.push(origin);
    }

    if (!SUPPORTED_PLACES.includes(destination as never)) {
      unsupportedPlaces.push(destination);
    }

    if (unsupportedPlaces.length > 0) {
      throw new BadRequestException(
        `The following places are not supported: ${unsupportedPlaces.join(', ')}. ` +
          `Supported places: ${SUPPORTED_PLACES.join(', ')}`,
      );
    }

    if (origin === destination) {
      throw new BadRequestException('Origin and destination cannot be the same');
    }
  }
}