import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Staff, StaffRole } from './staff.entity';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import * as bcrypt from 'bcryptjs';

const STAFF_ROLES = [StaffRole.HOUSEKEEPER, StaffRole.MAINTENANCE_STAFF];

@Injectable()
export class StaffService {
  constructor(
    @InjectRepository(Staff)
    private readonly staffRepository: Repository<Staff>,
  ) {}

  async create(dto: CreateStaffDto): Promise<Staff> {
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const staff = this.staffRepository.create({ ...dto, password: hashedPassword });
    return this.staffRepository.save(staff);
  }

  findAll(): Promise<Staff[]> {
    return this.staffRepository.find({
      where: { role: In(STAFF_ROLES) as any },
      select: ['id', 'fullName', 'email', 'password', 'role', 'employeeId', 'employmentRole',
               'basicSalary', 'joinDate', 'employmentStatus', 'phone'],
      order: { fullName: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Staff> {
    const staff = await this.staffRepository.findOne({
      where: { id, role: In(STAFF_ROLES) as any },
      select: ['id', 'fullName', 'email', 'password', 'role', 'employeeId', 'employmentRole',
               'basicSalary', 'joinDate', 'employmentStatus', 'phone'],
    });
    if (!staff) throw new NotFoundException(`Staff #${id} not found`);
    return staff;
  }

  async update(id: number, dto: UpdateStaffDto): Promise<Staff> {
    const staff = await this.staffRepository.findOne({
      where: { id, role: In(STAFF_ROLES) as any },
    });
    if (!staff) throw new NotFoundException(`Staff #${id} not found`);
    Object.assign(staff, dto);
    return this.staffRepository.save(staff);
  }

  async remove(id: number): Promise<void> {
    const staff = await this.staffRepository.findOne({
      where: { id, role: In(STAFF_ROLES) as any },
    });
    if (!staff) throw new NotFoundException(`Staff #${id} not found`);
    await this.staffRepository.remove(staff);
  }
}
