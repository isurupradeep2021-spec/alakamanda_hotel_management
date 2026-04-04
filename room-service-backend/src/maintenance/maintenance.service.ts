import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MaintenanceTicket, MaintenanceStatus } from './maintenance-ticket.entity';
import { Staff } from '../staff/staff.entity';
import { CreateMaintenanceTicketDto } from './dto/create-maintenance-ticket.dto';
import { UpdateMaintenanceTicketDto } from './dto/update-maintenance-ticket.dto';

interface RequestUser {
  email: string;
  role: string;
}

const MAINTENANCE_ALLOWED_STATUSES = [
  MaintenanceStatus.IN_PROGRESS,
  MaintenanceStatus.RESOLVED,
  MaintenanceStatus.CLOSED,
];

@Injectable()
export class MaintenanceService {
  constructor(
    @InjectRepository(MaintenanceTicket)
    private readonly ticketRepository: Repository<MaintenanceTicket>,
    @InjectRepository(Staff)
    private readonly staffRepository: Repository<Staff>,
  ) {}

  create(dto: CreateMaintenanceTicketDto): Promise<MaintenanceTicket> {
    const ticket = this.ticketRepository.create(dto);
    return this.ticketRepository.save(ticket);
  }

  async findAll(requestUser?: RequestUser): Promise<MaintenanceTicket[]> {
    if (requestUser?.role === 'MAINTENANCE_STAFF') {
      const staff = await this.staffRepository.findOne({ where: { email: requestUser.email } });
      if (!staff) return [];
      return this.ticketRepository.find({
        where: { staffId: Number(staff.id) },
        order: { createdAt: 'DESC' },
      });
    }
    return this.ticketRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: number): Promise<MaintenanceTicket> {
    const ticket = await this.ticketRepository.findOneBy({ id });
    if (!ticket) throw new NotFoundException(`Maintenance ticket #${id} not found`);
    return ticket;
  }

  async update(id: number, dto: UpdateMaintenanceTicketDto): Promise<MaintenanceTicket> {
    const ticket = await this.findOne(id);
    Object.assign(ticket, dto);
    return this.ticketRepository.save(ticket);
  }

  async remove(id: number): Promise<void> {
    const ticket = await this.findOne(id);
    await this.ticketRepository.remove(ticket);
  }

  async updateStatus(id: number, status: string, requestUser: RequestUser): Promise<MaintenanceTicket> {
    if (!MAINTENANCE_ALLOWED_STATUSES.includes(status as MaintenanceStatus)) {
      throw new ForbiddenException(`Status must be one of: ${MAINTENANCE_ALLOWED_STATUSES.join(', ')}`);
    }
    const ticket = await this.findOne(id);
    const staff = await this.staffRepository.findOne({ where: { email: requestUser.email } });
    if (!staff || Number(ticket.staffId) !== Number(staff.id)) {
      throw new ForbiddenException('You can only update tickets assigned to you.');
    }
    ticket.status = status as MaintenanceStatus;
    return this.ticketRepository.save(ticket);
  }

  async getStats(): Promise<Record<string, number>> {
    const tickets = await this.ticketRepository.find();
    return {
      total: tickets.length,
      open: tickets.filter((t) => t.status === 'OPEN').length,
      assigned: tickets.filter((t) => t.status === 'ASSIGNED').length,
      inProgress: tickets.filter((t) => t.status === 'IN_PROGRESS').length,
      resolved: tickets.filter((t) => t.status === 'RESOLVED').length,
      closed: tickets.filter((t) => t.status === 'CLOSED').length,
    };
  }
}
