import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Staff } from './staff/staff.entity';
import { HousekeepingTask } from './housekeeping/housekeeping-task.entity';
import { MaintenanceTicket } from './maintenance/maintenance-ticket.entity';
import { StaffModule } from './staff/staff.module';
import { HousekeepingModule } from './housekeeping/housekeeping.module';
import { MaintenanceModule } from './maintenance/maintenance.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '123456789',
      database: process.env.DB_NAME || 'hotel_management',
      entities: [Staff, HousekeepingTask, MaintenanceTicket],
      synchronize: true,
    }),
    StaffModule,
    HousekeepingModule,
    MaintenanceModule,
  ],
})
export class AppModule {}
