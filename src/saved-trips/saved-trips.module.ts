import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SavedTripsController } from './saved-trips.controller';
import { SavedTripsService } from './saved-trips.service';
import { SavedTrip, SavedTripSchema } from './schemas/saved-trip.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: SavedTrip.name, schema: SavedTripSchema }]),
  ],
  controllers: [SavedTripsController],
  providers: [SavedTripsService],
  exports: [SavedTripsService],
})
export class SavedTripsModule {}