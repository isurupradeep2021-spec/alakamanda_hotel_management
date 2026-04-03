import { IsEnum, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';
import { StaffRole } from '../staff.entity';

export class CreateStaffDto {
  @IsNotEmpty()
  @IsString()
  @Length(1, 100)
  name: string;

  @IsEnum(StaffRole)
  role: StaffRole;

  @IsOptional()
  @IsString()
  @Length(0, 20)
  contactNumber?: string;
}
