import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HousekeepingService } from './housekeeping.service';
import {
  HousekeepingTask,
  HousekeepingStatus,
  RoomCondition,
  HousekeepingTaskType,
  Priority,
} from './housekeeping-task.entity';
import { Staff, StaffRole } from '../staff/staff.entity';
import { CreateHousekeepingTaskDto } from './dto/create-housekeeping-task.dto';
import { NotFoundException } from '@nestjs/common';

describe('HousekeepingService', () => {
  let service: HousekeepingService;
  let taskRepository: Repository<HousekeepingTask>;
  let staffRepository: Repository<Staff>;

  const mockTaskRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    remove: jest.fn(),
  };

  const mockStaffRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HousekeepingService,
        {
          provide: getRepositoryToken(HousekeepingTask),
          useValue: mockTaskRepository,
        },
        {
          provide: getRepositoryToken(Staff),
          useValue: mockStaffRepository,
        },
      ],
    }).compile();

    service = module.get<HousekeepingService>(HousekeepingService);
    taskRepository = module.get<Repository<HousekeepingTask>>(
      getRepositoryToken(HousekeepingTask),
    );
    staffRepository = module.get<Repository<Staff>>(getRepositoryToken(Staff));

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should successfully create a new housekeeping task', async () => {
      const createTaskDto: CreateHousekeepingTaskDto = {
        roomNumber: '101',
        floor: 1,
        roomCondition: RoomCondition.OCCUPIED,
        taskType: HousekeepingTaskType.CLEANING,
        notes: 'Guest requested extra towels',
        priority: Priority.MEDIUM,
        status: HousekeepingStatus.PENDING,
      };

      const expectedTask = {
        id: 1,
        ...createTaskDto,
        createdAt: new Date(),
        updatedAt: new Date(),
        staffId: null,
        staff: null as any,
      } as unknown as HousekeepingTask;

      mockTaskRepository.create.mockReturnValue(expectedTask);
      mockTaskRepository.save.mockResolvedValue(expectedTask);

      const result = await service.create(createTaskDto);

      expect(mockTaskRepository.create).toHaveBeenCalledWith(createTaskDto);
      expect(mockTaskRepository.save).toHaveBeenCalledWith(expectedTask);
      expect(result).toEqual(expectedTask);
    });

    it('should create task with CHECKOUT_CLEANING type', async () => {
      const createTaskDto: CreateHousekeepingTaskDto = {
        roomNumber: '205',
        floor: 2,
        roomCondition: RoomCondition.CHECKOUT,
        taskType: HousekeepingTaskType.CLEANING,
        notes: 'Deep cleaning required',
        priority: Priority.HIGH,
        status: HousekeepingStatus.PENDING,
      };

      const expectedTask = {
        id: 2,
        ...createTaskDto,
        createdAt: new Date(),
        updatedAt: new Date(),
        staff: null as any,
      } as unknown as HousekeepingTask;

      mockTaskRepository.create.mockReturnValue(expectedTask);
      mockTaskRepository.save.mockResolvedValue(expectedTask);

      const result = await service.create(createTaskDto);

      expect(result.taskType).toBe(HousekeepingTaskType.CLEANING);
      expect(mockTaskRepository.create).toHaveBeenCalledWith(createTaskDto);
    });

    it('should create task with URGENT priority', async () => {
      const createTaskDto: CreateHousekeepingTaskDto = {
        roomNumber: '310',
        floor: 3,
        roomCondition: RoomCondition.OCCUPIED,
        taskType: HousekeepingTaskType.CLEANING,
        notes: 'VIP guest',
        priority: Priority.HIGH,
        status: HousekeepingStatus.PENDING,
      };

      const expectedTask = {
        id: 3,
        ...createTaskDto,
        createdAt: new Date(),
        updatedAt: new Date(),
        staff: null as any,
      } as unknown as HousekeepingTask;

      mockTaskRepository.create.mockReturnValue(expectedTask);
      mockTaskRepository.save.mockResolvedValue(expectedTask);

      const result = await service.create(createTaskDto);

      expect(result.priority).toBe(Priority.HIGH);
    });
  });

  describe('findAll', () => {
    it('should return all housekeeping tasks when no user context provided', async () => {
      const expectedTasks: HousekeepingTask[] = [
        {
          id: 1,
          roomNumber: '101',
          floor: 1,
          roomCondition: RoomCondition.OCCUPIED,
          taskType: HousekeepingTaskType.CLEANING,
          notes: 'Standard cleaning',
          priority: Priority.MEDIUM,
          status: HousekeepingStatus.PENDING,
          createdAt: new Date(),
          updatedAt: new Date(),
          staffId: 1,
          staff: null as any,
        } as HousekeepingTask,
        {
          id: 2,
          roomNumber: '202',
          floor: 2,
          roomCondition: RoomCondition.CHECKOUT,
          taskType: HousekeepingTaskType.CLEANING,
          notes: 'Deep clean required',
          priority: Priority.HIGH,
          status: HousekeepingStatus.IN_PROGRESS,
          createdAt: new Date(),
          updatedAt: new Date(),
          staffId: 3,
          staff: null as any,
        } as HousekeepingTask,
      ];

      mockTaskRepository.find.mockResolvedValue(expectedTasks);

      const result = await service.findAll();

      expect(mockTaskRepository.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(expectedTasks);
    });

    it('should return empty array when no tasks exist', async () => {
      mockTaskRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
      expect(mockTaskRepository.find).toHaveBeenCalled();
    });

    it('should filter tasks by staff when HOUSEKEEPER user provided', async () => {
      const requestUser = {
        email: 'housekeeper@example.com',
        role: 'HOUSEKEEPER',
      };

      const mockStaff = {
        id: 7,
        email: 'housekeeper@example.com',
        role: StaffRole.HOUSEKEEPER,
      };

      const expectedTasks: HousekeepingTask[] = [
        {
          id: 4,
          roomNumber: '303',
          floor: 3,
          roomCondition: RoomCondition.OCCUPIED,
          taskType: HousekeepingTaskType.CLEANING,
          notes: 'Evening service',
          priority: Priority.LOW,
          status: HousekeepingStatus.CLEANED,
          createdAt: new Date(),
          updatedAt: new Date(),
          staffId: 7,
          staff: null as any,
        } as HousekeepingTask,
      ];

      mockStaffRepository.findOne.mockResolvedValue(mockStaff);
      mockTaskRepository.find.mockResolvedValue(expectedTasks);

      const result = await service.findAll(requestUser);

      expect(mockStaffRepository.findOne).toHaveBeenCalledWith({
        where: { email: requestUser.email },
      });
      expect(mockTaskRepository.find).toHaveBeenCalledWith({
        where: { staffId: 7 },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(expectedTasks);
    });

    it('should return empty array when HOUSEKEEPER staff not found', async () => {
      const requestUser = {
        email: 'unknown@example.com',
        role: 'HOUSEKEEPER',
      };

      mockStaffRepository.findOne.mockResolvedValue(null);

      const result = await service.findAll(requestUser);

      expect(result).toEqual([]);
      expect(mockStaffRepository.findOne).toHaveBeenCalledWith({
        where: { email: requestUser.email },
      });
    });

    it('should return all tasks for non-HOUSEKEEPER roles', async () => {
      const requestUser = {
        email: 'manager@example.com',
        role: 'MANAGER',
      };

      const expectedTasks: HousekeepingTask[] = [
        {
          id: 5,
          roomNumber: '401',
          floor: 4,
          roomCondition: RoomCondition.PRE_CHECK_IN,
          taskType: HousekeepingTaskType.INSPECTION,
          notes: 'Final inspection',
          priority: Priority.MEDIUM,
          status: HousekeepingStatus.INSPECTED,
          createdAt: new Date(),
          updatedAt: new Date(),
          staffId: 2,
          staff: null as any,
        } as HousekeepingTask,
      ];

      mockTaskRepository.find.mockResolvedValue(expectedTasks);

      const result = await service.findAll(requestUser);

      expect(mockTaskRepository.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(expectedTasks);
    });
  });

  describe('findOne', () => {
    it('should return a single housekeeping task by id', async () => {
      const expectedTask: HousekeepingTask = {
        id: 1,
        roomNumber: '101',
        floor: 1,
        roomCondition: RoomCondition.OCCUPIED,
        taskType: HousekeepingTaskType.CLEANING,
        notes: 'Morning cleaning',
        priority: Priority.MEDIUM,
        status: HousekeepingStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
        staffId: 1,
        staff: null as any,
      } as HousekeepingTask;

      mockTaskRepository.findOneBy.mockResolvedValue(expectedTask);

      const result = await service.findOne(1);

      expect(mockTaskRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(result).toEqual(expectedTask);
    });

    it('should throw NotFoundException when task not found', async () => {
      mockTaskRepository.findOneBy.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow(
        'Housekeeping task #999 not found',
      );
    });
  });
});
