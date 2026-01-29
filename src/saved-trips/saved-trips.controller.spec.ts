import { Test, TestingModule } from '@nestjs/testing';
import { SavedTripsController } from './saved-trips.controller';
import { SavedTripsService } from './saved-trips.service';
import { SaveTripDto } from './dto/save-trip.dto';
import { SavedTrip } from './schemas/saved-trip.schema';

describe('SavedTripsController', () => {
  let controller: SavedTripsController;
  let service: SavedTripsService;

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
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SavedTripsController],
      providers: [
        {
          provide: SavedTripsService,
          useValue: {
            saveTrip: jest.fn(),
            getAllSavedTrips: jest.fn(),
            getSavedTripById: jest.fn(),
            deleteSavedTrip: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(require('@nestjs/throttler').ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<SavedTripsController>(SavedTripsController);
    service = module.get<SavedTripsService>(SavedTripsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('saveTrip', () => {
    it('should save a trip', async () => {
      const saveTripSpy = jest
        .spyOn(service, 'saveTrip')
        .mockResolvedValue(mockSavedTrip as SavedTrip);

      const result = await controller.saveTrip(mockSaveTripDto);

      expect(result).toEqual(mockSavedTrip);
      expect(saveTripSpy).toHaveBeenCalledWith(mockSaveTripDto);
    });
  });

  describe('getAllSavedTrips', () => {
    it('should return paginated saved trips', async () => {
      const paginatedResponse = {
        data: [mockSavedTrip],
        meta: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };

      const getAllSpy = jest
        .spyOn(service, 'getAllSavedTrips')
        .mockResolvedValue(paginatedResponse);

      const result = await controller.getAllSavedTrips({ page: 1, limit: 10 });

      expect(result).toEqual(paginatedResponse);
      expect(getAllSpy).toHaveBeenCalledWith({ page: 1, limit: 10 });
    });

    it('should use default pagination when no params provided', async () => {
      const paginatedResponse = {
        data: [],
        meta: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };

      const getAllSpy = jest
        .spyOn(service, 'getAllSavedTrips')
        .mockResolvedValue(paginatedResponse);

      const result = await controller.getAllSavedTrips({});

      expect(result).toEqual(paginatedResponse);
      expect(getAllSpy).toHaveBeenCalled();
    });
  });

  describe('getSavedTripById', () => {
    it('should return a saved trip by id', async () => {
      const getByIdSpy = jest
        .spyOn(service, 'getSavedTripById')
        .mockResolvedValue(mockSavedTrip as SavedTrip);

      const result = await controller.getSavedTripById('507f1f77bcf86cd799439011');

      expect(result).toEqual(mockSavedTrip);
      expect(getByIdSpy).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });
  });

  describe('deleteSavedTrip', () => {
    it('should delete a saved trip', async () => {
      const deleteSpy = jest
        .spyOn(service, 'deleteSavedTrip')
        .mockResolvedValue(mockSavedTrip as SavedTrip);

      const result = await controller.deleteSavedTrip('507f1f77bcf86cd799439011');

      expect(result).toEqual(mockSavedTrip);
      expect(deleteSpy).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });
  });
});
