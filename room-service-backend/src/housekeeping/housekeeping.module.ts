import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HousekeepingTask } from './housekeeping-task.entity';
import { HousekeepingService } from './housekeeping.service';
import { HousekeepingController } from './housekeeping.controller';

@Module({
  imports: [TypeOrmModule.forFeature([HousekeepingTask])],
  controllers: [HousekeepingController],
  providers: [HousekeepingService],
})
export class HousekeepingModule {}
