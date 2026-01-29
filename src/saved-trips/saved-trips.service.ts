import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SavedTrip, SavedTripDocument } from './schemas/saved-trip.schema';
import { SaveTripDto } from './dto/save-trip.dto';
import { PaginationDto } from './dto/pagination.dto';
import { PaginatedSavedTrips } from './interfaces/pagination.interface';

@Injectable()
export class SavedTripsService {
  private readonly logger = new Logger(SavedTripsService.name);

  constructor(
    @InjectModel(SavedTrip.name)
    private savedTripModel: Model<SavedTripDocument>,
  ) {}

  /**
   * Save a trip to the database
   * @param saveTripDto - Trip data to save
   * @returns Saved trip document
   */
  async saveTrip(saveTripDto: SaveTripDto): Promise<SavedTrip> {
    try {
      this.logger.log(`Saving trip with ID: ${saveTripDto.tripId}`);

      const existingTrip = await this.savedTripModel.findOne({ tripId: saveTripDto.tripId }).exec();

      if (existingTrip) {
        throw new ConflictException(`Trip with ID ${saveTripDto.tripId} is already saved`);
      }

      const savedTrip = new this.savedTripModel(saveTripDto);
      const result = await savedTrip.save();

      this.logger.log(`Successfully saved trip with ID: ${saveTripDto.tripId}`);
      return result;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Error saving trip: ${error}`);
      throw error;
    }
  }

  /**
   * Get all saved trips with pagination
   * @param paginationDto - Pagination parameters (page, limit)
   * @returns Paginated saved trips with metadata
   */
  async getAllSavedTrips(paginationDto: PaginationDto): Promise<PaginatedSavedTrips> {
    const { page = 1, limit = 10 } = paginationDto;

    this.logger.log(`Fetching saved trips - page: ${page}, limit: ${limit}`);

    // Calculate skip value
    const skip = (page - 1) * limit;

    // Execute query with pagination
    const [trips, total] = await Promise.all([
      this.savedTripModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.savedTripModel.countDocuments().exec(),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    this.logger.log(`Found ${trips.length} trips (page ${page}/${totalPages}, total: ${total})`);

    return {
      data: trips,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    };
  }

  /**
   * Get a saved trip by its MongoDB ID
   * @param id - MongoDB document ID
   * @returns Saved trip document
   */
  async getSavedTripById(id: string): Promise<SavedTrip> {
    this.logger.log(`Fetching saved trip with ID: ${id}`);

    const trip = await this.savedTripModel.findById(id).exec();

    if (!trip) {
      throw new NotFoundException(`Saved trip with ID ${id} not found`);
    }

    return trip;
  }

  /**
   * Delete a saved trip by its MongoDB ID
   * @param id - MongoDB document ID
   * @returns Deleted trip document
   */
  async deleteSavedTrip(id: string): Promise<SavedTrip> {
    this.logger.log(`Deleting saved trip with ID: ${id}`);

    const deletedTrip = await this.savedTripModel.findByIdAndDelete(id).exec();

    if (!deletedTrip) {
      throw new NotFoundException(`Saved trip with ID ${id} not found`);
    }

    this.logger.log(`Successfully deleted trip with ID: ${id}`);
    return deletedTrip;
  }
}
