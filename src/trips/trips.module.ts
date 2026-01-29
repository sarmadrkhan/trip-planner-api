import { Module } from '@nestjs/common';
import { ExternalApiModule } from '../external-api/external-api.module';
import { TripsController } from './trips.controller';
import { TripsService } from './trips.service';

@Module({
  imports: [ExternalApiModule],
  controllers: [TripsController],
  providers: [TripsService],
  exports: [TripsService],
})
export class TripsModule {}