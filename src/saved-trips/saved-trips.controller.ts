import { Controller, Get, Post, Delete, Body, Param, Query, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBadRequestResponse, ApiNotFoundResponse, ApiConflictResponse } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { SavedTripsService } from './saved-trips.service';
import { SaveTripDto } from './dto/save-trip.dto';
import { PaginationDto } from './dto/pagination.dto';
import { SavedTrip } from './schemas/saved-trip.schema';
import { PaginatedSavedTrips } from './interfaces/pagination.interface';

@ApiTags('saved-trips')
@Controller('trips/saved')
@UseGuards(ThrottlerGuard)
export class SavedTripsController {
  constructor(private readonly savedTripsService: SavedTripsService) {}

  @Post()
  @ApiOperation({
    summary: 'Save a trip',
    description: 'Save a trip from search results to collection',
  })
  @ApiResponse({
    status: 201,
    description: 'Trip saved successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        origin: { type: 'string', example: 'SYD' },
        destination: { type: 'string', example: 'GRU' },
        cost: { type: 'number', example: 625 },
        duration: { type: 'number', example: 5 },
        type: { type: 'string', example: 'flight' },
        tripId: { type: 'string', example: 'a749c866-7928-4d08-9d5c-a6821a583d1a' },
        display_name: { type: 'string', example: 'from SYD to GRU by flight' },
        createdAt: { type: 'string', example: '2026-01-28T00:00:00.000Z' },
        updatedAt: { type: 'string', example: '2026-01-28T00:00:00.000Z' },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid trip data' })
  @ApiConflictResponse({ description: 'Trip already saved' })
  async saveTrip(@Body() saveTripDto: SaveTripDto): Promise<SavedTrip> {
    return this.savedTripsService.saveTrip(saveTripDto);
  }

  @Get()
  @ApiOperation({
    summary: 'List all saved trips',
    description:
      'Get all trips saved in collection with pagination support, sorted by most recent first',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (starts from 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page (max 100)',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of saved trips',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              origin: { type: 'string' },
              destination: { type: 'string' },
              cost: { type: 'number' },
              duration: { type: 'number' },
              type: { type: 'string' },
              tripId: { type: 'string' },
              display_name: { type: 'string' },
              createdAt: { type: 'string' },
              updatedAt: { type: 'string' },
            },
          },
        },
        meta: {
          type: 'object',
          properties: {
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 10 },
            total: { type: 'number', example: 45 },
            totalPages: { type: 'number', example: 5 },
            hasNextPage: { type: 'boolean', example: true },
            hasPreviousPage: { type: 'boolean', example: false },
          },
        },
      },
    },
  })
  async getAllSavedTrips(@Query() paginationDto: PaginationDto): Promise<PaginatedSavedTrips> {
    return this.savedTripsService.getAllSavedTrips(paginationDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a saved trip by ID',
    description: 'Retrieve a specific saved trip by its MongoDB ID',
  })
  @ApiParam({
    name: 'id',
    description: 'MongoDB document ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Saved trip details',
  })
  @ApiNotFoundResponse({ description: 'Saved trip not found' })
  async getSavedTripById(@Param('id') id: string): Promise<SavedTrip> {
    return this.savedTripsService.getSavedTripById(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a saved trip',
    description: 'Remove a trip from saved collection',
  })
  @ApiParam({
    name: 'id',
    description: 'MongoDB document ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Trip deleted successfully',
  })
  @ApiNotFoundResponse({ description: 'Saved trip not found' })
  async deleteSavedTrip(@Param('id') id: string): Promise<SavedTrip> {
    return this.savedTripsService.deleteSavedTrip(id);
  }
}
