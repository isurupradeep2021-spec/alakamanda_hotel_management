import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Staff } from '../staff/staff.entity';
import { Priority } from '../housekeeping/housekeeping-task.entity';

export enum FacilityType {
  AC = 'AC',
  PLUMBING = 'PLUMBING',
  ELECTRICAL = 'ELECTRICAL',
  FURNITURE = 'FURNITURE',
  OTHER = 'OTHER',
}

export enum MaintenanceStatus {
  OPEN = 'OPEN',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

@Entity('maintenance_tickets')
export class MaintenanceTicket {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 20 })
  roomNumber: string;

  @Column({ nullable: true })
  floor: number;

  @Column({ type: 'enum', enum: FacilityType })
  facilityType: FacilityType;

  @Column({ type: 'text' })
  issueDescription: string;

  @Column({
    type: 'enum',
    enum: MaintenanceStatus,
    default: MaintenanceStatus.OPEN,
  })
  status: MaintenanceStatus;

  @Column({ type: 'enum', enum: Priority, default: Priority.MEDIUM })
  priority: Priority;

  @ManyToOne(() => Staff, { nullable: true, eager: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'staffId' })
  staff: Staff;

  @Column({ nullable: true })
  staffId: number;

  @Column({ type: 'datetime', nullable: true })
  deadline: Date;

  @Column({ type: 'text', nullable: true })
  resolutionNotes: string;

  @Column({ type: 'text', nullable: true })
  partsUsed: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
