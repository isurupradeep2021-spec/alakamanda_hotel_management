import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

export enum StaffRole {
  HOUSEKEEPER = 'HOUSEKEEPER',
  MAINTENANCE_STAFF = 'MAINTENANCE_STAFF',
}

@Entity('staff')
export class Staff {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'enum', enum: StaffRole })
  role: StaffRole;

  @Column({ length: 20, nullable: true })
  contactNumber: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
