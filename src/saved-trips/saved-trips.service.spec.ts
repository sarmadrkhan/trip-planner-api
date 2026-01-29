import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { SavedTripsService } from './saved-trips.service';
import { SavedTrip } from './schemas/saved-trip.schema';
import { SaveTripDto } from './dto/save-trip.dto';

describe('SavedTripsService', () => {
  let service: SavedTripsService;
  let mockModel: {
    findOne: jest.Mock;
    find: jest.Mock;
    findById: jest.Mock;
    findByIdAndDelete: jest.Mock;
    countDocuments: jest.Mock;
  };

  const mockSavedTrip = {
    _id: '507f1f77bcf86cd799439011',
    origin: 'SYD',
    destination: 'GRU',
    cost: 625,
    duration: 5,
    type: 'flight',
    tripId: 'trip-123',
    display_name: 'from SYD to GRU by flight',
    createdAt: new Date('2026-01-28'),
    updatedAt: new Date('2026-01-28'),
  };

  const mockSaveTripDto: SaveTripDto = {
    origin: 'SYD',
    destination: 'GRU',
    cost: 625,
    duration: 5,
    type: 'flight',
    tripId: 'trip-123',
    display_name: 'from SYD to GRU by flight',
  };

  beforeEach(async () => {
    mockModel = {
      findOne: jest.fn(),
      find: jest.fn(),
      findById: jest.fn(),
      findByIdAndDelete: jest.fn(),
      countDocuments: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SavedTripsService,
        {
          provide: getModelToken(SavedTrip.name),
          useValue: mockModel,
        },
      ],
    }).compile();

    service = module.get<SavedTripsService>(SavedTripsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('saveTrip', () => {
    it('should save a trip successfully', async () => {
      // Mock findOne to return null - trip doesn't exist
      mockModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      // Create a mock save function that returns test trip
      const saveMock = jest.fn().mockResolvedValue(mockSavedTrip);

      // Mock the Model constructor to return an object with save()
      const mockConstructor = jest.fn().mockImplementation(() => ({
        save: saveMock,
      }));

      // Add findOne, find, etc. methods to the constructor
      Object.assign(mockConstructor, mockModel);

      // Override the private model property for testing
      (service as unknown as { savedTripModel: unknown }).savedTripModel =
        mockConstructor as unknown as typeof mockModel;

      const result = await service.saveTrip(mockSaveTripDto);

      expect(mockModel.findOne).toHaveBeenCalledWith({ tripId: 'trip-123' });
      expect(mockConstructor).toHaveBeenCalledWith(mockSaveTripDto);
      expect(saveMock).toHaveBeenCalled();
      expect(result).toEqual(mockSavedTrip);
    });

    it('should throw ConflictException if trip already exists', async () => {
      mockModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSavedTrip),
      });

      await expect(service.saveTrip(mockSaveTripDto)).rejects.toThrow(ConflictException);
      await expect(service.saveTrip(mockSaveTripDto)).rejects.toThrow(
        'Trip with ID trip-123 is already saved',
      );
    });
  });

  describe('getAllSavedTrips', () => {
    it('should return paginated saved trips with default pagination', async () => {
      const trips = [mockSavedTrip];
      const total = 25;

      mockModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(trips),
      });

      mockModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(total),
      });

      const result = await service.getAllSavedTrips({ page: 1, limit: 10 });

      expect(result.data).toEqual(trips);
      expect(result.meta).toEqual({
        page: 1,
        limit: 10,
        total: 25,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: false,
      });
      expect(mockModel.find).toHaveBeenCalled();
      expect(mockModel.countDocuments).toHaveBeenCalled();
    });

    it('should calculate pagination metadata correctly for middle page', async () => {
      const trips = [mockSavedTrip];
      const total = 50;

      mockModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(trips),
      });

      mockModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(total),
      });

      const result = await service.getAllSavedTrips({ page: 3, limit: 10 });

      expect(result.meta).toEqual({
        page: 3,
        limit: 10,
        total: 50,
        totalPages: 5,
        hasNextPage: true,
        hasPreviousPage: true,
      });
    });

    it('should return empty data when no trips saved', async () => {
      mockModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      });

      mockModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(0),
      });

      const result = await service.getAllSavedTrips({ page: 1, limit: 10 });

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(0);
      expect(result.meta.hasNextPage).toBe(false);
    });
  });

  describe('getSavedTripById', () => {
    it('should return a trip by id', async () => {
      mockModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSavedTrip),
      });

      const result = await service.getSavedTripById('507f1f77bcf86cd799439011');

      expect(result).toEqual(mockSavedTrip);
      expect(mockModel.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    it('should throw NotFoundException if trip not found', async () => {
      mockModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.getSavedTripById('nonexistent')).rejects.toThrow(NotFoundException);
      await expect(service.getSavedTripById('nonexistent')).rejects.toThrow(
        'Saved trip with ID nonexistent not found',
      );
    });
  });

  describe('deleteSavedTrip', () => {
    it('should delete a trip by id', async () => {
      mockModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSavedTrip),
      });

      const result = await service.deleteSavedTrip('507f1f77bcf86cd799439011');

      expect(result).toEqual(mockSavedTrip);
      expect(mockModel.findByIdAndDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    it('should throw NotFoundException if trip to delete not found', async () => {
      mockModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.deleteSavedTrip('nonexistent')).rejects.toThrow(NotFoundException);
      await expect(service.deleteSavedTrip('nonexistent')).rejects.toThrow(
        'Saved trip with ID nonexistent not found',
      );
    });
  });
});
