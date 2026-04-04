import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { StaffRole } from '../staff.entity';

export class CreateStaffDto {
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password: string;

  @IsEnum(StaffRole, { message: 'role must be HOUSEKEEPER or MAINTENANCE_STAFF' })
  role: StaffRole;

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
  @IsString()
  phone?: string;
}
