import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HousekeepingTask } from './housekeeping-task.entity';
import { CreateHousekeepingTaskDto } from './dto/create-housekeeping-task.dto';
import { UpdateHousekeepingTaskDto } from './dto/update-housekeeping-task.dto';

@Injectable()
export class HousekeepingService {
  constructor(
    @InjectRepository(HousekeepingTask)
    private readonly taskRepository: Repository<HousekeepingTask>,
  ) {}

  create(dto: CreateHousekeepingTaskDto): Promise<HousekeepingTask> {
    const task = this.taskRepository.create(dto);
    return this.taskRepository.save(task);
  }

  findAll(): Promise<HousekeepingTask[]> {
    return this.taskRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: number): Promise<HousekeepingTask> {
    const task = await this.taskRepository.findOneBy({ id });
    if (!task) throw new NotFoundException(`Housekeeping task #${id} not found`);
    return task;
  }

  async update(id: number, dto: UpdateHousekeepingTaskDto): Promise<HousekeepingTask> {
    const task = await this.findOne(id);
    Object.assign(task, dto);
    return this.taskRepository.save(task);
  }

  async remove(id: number): Promise<void> {
    const task = await this.findOne(id);
    await this.taskRepository.remove(task);
  }

  async getStats(): Promise<Record<string, number>> {
    const tasks = await this.taskRepository.find();
    return {
      total: tasks.length,
      pending: tasks.filter((t) => t.status === 'PENDING').length,
      inProgress: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
      cleaned: tasks.filter((t) => t.status === 'CLEANED').length,
      inspected: tasks.filter((t) => t.status === 'INSPECTED').length,
    };
  }
}
