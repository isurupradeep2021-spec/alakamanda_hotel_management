import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  IsDateString,
  Length,
} from 'class-validator';
import {
  RoomCondition,
  HousekeepingTaskType,
  HousekeepingStatus,
  Priority,
} from '../housekeeping-task.entity';

export class CreateHousekeepingTaskDto {
  @IsNotEmpty()
  @IsString()
  @Length(1, 20)
  roomNumber: string;

  @IsOptional()
  @IsInt()
  floor?: number;

  @IsEnum(RoomCondition)
  roomCondition: RoomCondition;

  @IsEnum(HousekeepingTaskType)
  taskType: HousekeepingTaskType;

  @IsOptional()
  @IsEnum(HousekeepingStatus)
  status?: HousekeepingStatus;

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
  notes?: string;

  @IsOptional()
  @IsString()
  cleaningNotes?: string;
}
