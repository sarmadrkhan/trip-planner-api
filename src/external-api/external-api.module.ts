import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ExternalApiService } from './external-api.service';

@Module({
  imports: [ConfigModule],
  providers: [ExternalApiService],
  exports: [ExternalApiService],
})
export class ExternalApiModule {}