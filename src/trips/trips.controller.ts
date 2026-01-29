import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBadRequestResponse, ApiServiceUnavailableResponse } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { TripsService } from './trips.service';
import { SearchTripDto, SortStrategy } from './dto/search-trip.dto';
import { Trip } from '../external-api/interfaces/trip.interface';

@ApiTags('trips')
@Controller('trips')
@UseGuards(ThrottlerGuard)
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Get('search')
  @ApiOperation({
    summary: 'Search for trips',
    description:
      'Search for trips from origin to destination with sorting strategy. ' +
      'Results are cached for better performance.',
  })
  @ApiQuery({
    name: 'origin',
    description: 'IATA 3-letter code of the origin',
    example: 'SYD',
  })
  @ApiQuery({
    name: 'destination',
    description: 'IATA 3-letter code of the destination',
    example: 'GRU',
  })
  @ApiQuery({
    name: 'sort_by',
    enum: SortStrategy,
    description: 'Sorting strategy: "fastest" sorts by duration, "cheapest" sorts by cost',
    example: SortStrategy.FASTEST,
  })
  @ApiResponse({
    status: 200,
    description: 'List of trips sorted by the selected strategy',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          origin: { type: 'string', example: 'SYD' },
          destination: { type: 'string', example: 'GRU' },
          cost: { type: 'number', example: 625 },
          duration: { type: 'number', example: 5 },
          type: { type: 'string', example: 'flight' },
          id: { type: 'string', example: 'a749c866-7928-4d08-9d5c-a6821a583d1a' },
          display_name: { type: 'string', example: 'from SYD to GRU by flight' },
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid request parameters (invalid IATA codes, unsupported places, etc.)',
  })
  @ApiServiceUnavailableResponse({
    description: 'External trip provider is unavailable',
  })
  async searchTrips(@Query() searchDto: SearchTripDto): Promise<Trip[]> {
    return this.tripsService.searchTrips(searchDto);
  }
}
