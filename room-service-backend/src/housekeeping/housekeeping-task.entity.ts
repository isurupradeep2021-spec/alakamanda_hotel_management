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

export enum RoomCondition {
  OCCUPIED = 'OCCUPIED',
  CHECKOUT = 'CHECKOUT',
  PRE_CHECK_IN = 'PRE_CHECK_IN',
}

export enum HousekeepingTaskType {
  CLEANING = 'CLEANING',
  INSPECTION = 'INSPECTION',
  TURNDOWN = 'TURNDOWN',
}

export enum HousekeepingStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  CLEANED = 'CLEANED',
  INSPECTED = 'INSPECTED',
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

@Entity('housekeeping_tasks')
export class HousekeepingTask {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 20 })
  roomNumber: string;

  @Column({ nullable: true })
  floor: number;

  @Column({ type: 'enum', enum: RoomCondition })
  roomCondition: RoomCondition;

  @Column({ type: 'enum', enum: HousekeepingTaskType })
  taskType: HousekeepingTaskType;

  @Column({
    type: 'enum',
    enum: HousekeepingStatus,
    default: HousekeepingStatus.PENDING,
  })
  status: HousekeepingStatus;

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
  notes: string;

  @Column({ type: 'text', nullable: true })
  cleaningNotes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
