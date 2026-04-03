import { IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { StaffRole } from '../staff.entity';

export class UpdateStaffDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @IsOptional()
  @IsEnum(StaffRole)
  role?: StaffRole;

  @IsOptional()
  @IsString()
  @Length(0, 20)
  contactNumber?: string;
}
