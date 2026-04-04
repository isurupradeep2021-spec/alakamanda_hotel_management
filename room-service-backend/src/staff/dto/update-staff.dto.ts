import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { EmploymentStatus, StaffRole } from '../staff.entity';

export class UpdateStaffDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsEnum(StaffRole, { message: 'role must be HOUSEKEEPER or MAINTENANCE_STAFF' })
  role?: StaffRole;

  @IsOptional()
  @IsString()
  employeeId?: string;

  @IsOptional()
  @IsString()
  employmentRole?: string;

  @IsOptional()
  @IsNumber()
  basicSalary?: number;

  @IsOptional()
  @IsString()
  joinDate?: string;

  @IsOptional()
  @IsEnum(EmploymentStatus)
  employmentStatus?: EmploymentStatus;

  @IsOptional()
  @IsString()
  phone?: string;
}
