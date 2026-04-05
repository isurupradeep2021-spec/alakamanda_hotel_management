import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceTicket, MaintenanceStatus, FacilityType } from './maintenance-ticket.entity';
import { Staff, StaffRole } from '../staff/staff.entity';
import { CreateMaintenanceTicketDto } from './dto/create-maintenance-ticket.dto';
import { NotFoundException } from '@nestjs/common';
import { Priority } from '../housekeeping/housekeeping-task.entity';

describe('MaintenanceService', () => {
  let service: MaintenanceService;
  let ticketRepository: Repository<MaintenanceTicket>;
  let staffRepository: Repository<Staff>;

  const mockTicketRepository = {
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
        MaintenanceService,
        {
          provide: getRepositoryToken(MaintenanceTicket),
          useValue: mockTicketRepository,
        },
        {
          provide: getRepositoryToken(Staff),
          useValue: mockStaffRepository,
        },
      ],
    }).compile();

    service = module.get<MaintenanceService>(MaintenanceService);
    ticketRepository = module.get<Repository<MaintenanceTicket>>(
      getRepositoryToken(MaintenanceTicket),
    );
    staffRepository = module.get<Repository<Staff>>(getRepositoryToken(Staff));

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should successfully create a new maintenance ticket', async () => {
      const createTicketDto: CreateMaintenanceTicketDto = {
        roomNumber: '101',
        floor: 1,
        facilityType: FacilityType.PLUMBING,
        issueDescription: 'Leaking faucet in bathroom',
        priority: Priority.HIGH,
        status: MaintenanceStatus.OPEN,
        deadline: new Date('2026-04-10').toDateString(),
      };

      const expectedTicket = {
        id: 1,
        ...createTicketDto,
        createdAt: new Date(),
        staffId: null,
      };

      mockTicketRepository.create.mockReturnValue(expectedTicket);
      mockTicketRepository.save.mockResolvedValue(expectedTicket);

      const result = await service.create(createTicketDto);

      expect(mockTicketRepository.create).toHaveBeenCalledWith(createTicketDto);
      expect(mockTicketRepository.save).toHaveBeenCalledWith(expectedTicket);
      expect(result).toEqual(expectedTicket);
    });

    it('should create ticket with HVAC facility type', async () => {
      const createTicketDto: CreateMaintenanceTicketDto = {
        roomNumber: '205',
        floor: 2,
        facilityType: FacilityType.AC,
        issueDescription: 'Air conditioning not working',
        priority: Priority.HIGH,
        status: MaintenanceStatus.OPEN,
        deadline: new Date('2026-04-06').toDateString(),
      };

      const expectedTicket = {
        id: 2,
        ...createTicketDto,
        createdAt: new Date(),
      };

      mockTicketRepository.create.mockReturnValue(expectedTicket);
      mockTicketRepository.save.mockResolvedValue(expectedTicket);

      const result = await service.create(createTicketDto);

      expect(result.facilityType).toBe(FacilityType.AC);
      expect(mockTicketRepository.create).toHaveBeenCalledWith(createTicketDto);
    });
  });

  describe('findAll', () => {
    it('should return all maintenance tickets when no user context provided', async () => {
      const expectedTickets: MaintenanceTicket[] = [
        {
          id: 1,
          roomNumber: '101',
          floor: 1,
          facilityType: FacilityType.ELECTRICAL,
          issueDescription: 'Power outlet not working',
          priority: Priority.MEDIUM,
          status: MaintenanceStatus.OPEN,
          deadline: new Date('2026-04-10'),
          createdAt: new Date(),
          staffId: 1,
        },
        {
          id: 2,
          roomNumber: '202',
          floor: 2,
          facilityType: FacilityType.PLUMBING,
          issueDescription: 'Toilet running',
          priority: Priority.LOW,
          status: MaintenanceStatus.ASSIGNED,
          deadline: new Date('2026-04-11'),
          createdAt: new Date(),
          staffId: 1,
        },
      ];

      mockTicketRepository.find.mockResolvedValue(expectedTickets);

      const result = await service.findAll();

      expect(mockTicketRepository.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(expectedTickets);
    });

    it('should return empty array when no tickets exist', async () => {
      mockTicketRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
      expect(mockTicketRepository.find).toHaveBeenCalled();
    });

    it('should filter tickets by staff when MAINTENANCE_STAFF user provided', async () => {
      const requestUser = {
        email: 'maintenance@example.com',
        role: 'MAINTENANCE_STAFF',
      };

      const mockStaff = {
        id: 5,
        email: 'maintenance@example.com',
        role: StaffRole.MAINTENANCE_STAFF,
      };

      const expectedTickets: MaintenanceTicket[] = [
        {
          id: 3,
          roomNumber: '303',
          floor: 3,
          facilityType: FacilityType.AC,
          issueDescription: 'Cracked wall',
          priority: Priority.HIGH,
          status: MaintenanceStatus.IN_PROGRESS,
          deadline: new Date('2026-04-08'),
          createdAt: new Date(),
          staffId: 5,
        },
      ];

      mockStaffRepository.findOne.mockResolvedValue(mockStaff);
      mockTicketRepository.find.mockResolvedValue(expectedTickets);

      const result = await service.findAll(requestUser);

      expect(mockStaffRepository.findOne).toHaveBeenCalledWith({
        where: { email: requestUser.email },
      });
      expect(mockTicketRepository.find).toHaveBeenCalledWith({
        where: { staffId: 5 },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(expectedTickets);
    });

    it('should return empty array when MAINTENANCE_STAFF not found', async () => {
      const requestUser = {
        email: 'nonexistent@example.com',
        role: 'MAINTENANCE_STAFF',
      };

      mockStaffRepository.findOne.mockResolvedValue(null);

      const result = await service.findAll(requestUser);

      expect(result).toEqual([]);
      expect(mockStaffRepository.findOne).toHaveBeenCalledWith({
        where: { email: requestUser.email },
      });
    });
  });

  describe('findOne', () => {
    it('should return a single maintenance ticket by id', async () => {
      const expectedTicket: MaintenanceTicket = {
        id: 1,
        roomNumber: '101',
        floor: 1,
        facilityType: FacilityType.PLUMBING,
        issueDescription: 'Leaking sink',
        priority: Priority.HIGH,
        status: MaintenanceStatus.OPEN,
        deadline: new Date('2026-04-10'),
        createdAt: new Date(),
        staffId: 1,
      };

      mockTicketRepository.findOneBy.mockResolvedValue(expectedTicket);

      const result = await service.findOne(1);

      expect(mockTicketRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(result).toEqual(expectedTicket);
    });

    it('should throw NotFoundException when ticket not found', async () => {
      mockTicketRepository.findOneBy.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow(
        'Maintenance ticket #999 not found',
      );
    });
  });
});
