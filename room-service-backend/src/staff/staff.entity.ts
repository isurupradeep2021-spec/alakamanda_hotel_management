import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Maps to the shared `users` table managed by the Spring Boot backend.
 * synchronize: false ensures NestJS never alters this table's schema.
 */

export enum StaffRole {
  HOUSEKEEPER = 'HOUSEKEEPER',
  MAINTENANCE_STAFF = 'MAINTENANCE_STAFF',
}

export enum EmploymentStatus {
  ACTIVE = 'ACTIVE',
  ON_LEAVE = 'ON_LEAVE',
  INACTIVE = 'INACTIVE',
}

@Entity({ name: 'users', synchronize: false })
export class Staff {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ type: 'varchar' })
  role: StaffRole;

  @Column({ name: 'employee_id', unique: true, nullable: true })
  employeeId: string;

  @Column({ name: 'employment_role', nullable: true })
  employmentRole: string;

  @Column({
    name: 'basic_salary',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  basicSalary: number;

  @Column({ name: 'join_date', type: 'date', nullable: true })
  joinDate: string;

  @Column({
    name: 'employment_status',
    type: 'varchar',
    default: EmploymentStatus.ACTIVE,
  })
  employmentStatus: EmploymentStatus;

  @Column({ nullable: true })
  phone: string;
}
