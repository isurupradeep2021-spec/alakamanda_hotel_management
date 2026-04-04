import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MaintenanceTicket } from './maintenance-ticket.entity';
import { CreateMaintenanceTicketDto } from './dto/create-maintenance-ticket.dto';
import { UpdateMaintenanceTicketDto } from './dto/update-maintenance-ticket.dto';

@Injectable()
export class MaintenanceService {
  constructor(
    @InjectRepository(MaintenanceTicket)
    private readonly ticketRepository: Repository<MaintenanceTicket>,
  ) {}

  create(dto: CreateMaintenanceTicketDto): Promise<MaintenanceTicket> {
    const ticket = this.ticketRepository.create(dto);
    return this.ticketRepository.save(ticket);
  }

  findAll(): Promise<MaintenanceTicket[]> {
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
