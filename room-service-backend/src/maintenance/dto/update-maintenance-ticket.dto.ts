import { IsEnum, IsOptional, IsString, IsInt, IsDateString, Length } from 'class-validator';
import { FacilityType, MaintenanceStatus } from '../maintenance-ticket.entity';
import { Priority } from '../../housekeeping/housekeeping-task.entity';

export class UpdateMaintenanceTicketDto {
  @IsOptional()
  @IsString()
  @Length(1, 20)
  roomNumber?: string;

  @IsOptional()
  @IsInt()
  floor?: number;

  @IsOptional()
  @IsEnum(FacilityType)
  facilityType?: FacilityType;

  @IsOptional()
  @IsString()
  issueDescription?: string;

  @IsOptional()
  @IsEnum(MaintenanceStatus)
  status?: MaintenanceStatus;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsOptional()
  @IsInt()
  staffId?: number;

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsOptional()
  @IsString()
  resolutionNotes?: string;

  @IsOptional()
  @IsString()
  partsUsed?: string;
}
