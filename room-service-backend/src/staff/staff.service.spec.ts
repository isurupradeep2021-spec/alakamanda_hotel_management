import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StaffService } from './staff.service';
import { Staff, StaffRole, EmploymentStatus } from './staff.entity';
import { CreateStaffDto } from './dto/create-staff.dto';
import { NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs');

describe('StaffService', () => {
  let service: StaffService;
  let repository: Repository<Staff>;

  const mockStaffRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StaffService,
        {
          provide: getRepositoryToken(Staff),
          useValue: mockStaffRepository,
        },
      ],
    }).compile();

    service = module.get<StaffService>(StaffService);
    repository = module.get<Repository<Staff>>(getRepositoryToken(Staff));

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should successfully create a new staff member', async () => {
      const createStaffDto: CreateStaffDto = {
        fullName: 'John Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        role: StaffRole.HOUSEKEEPER,
        employeeId: 'EMP001',
      };

      const hashedPassword = 'hashedPassword123';
      const expectedStaff = {
        id: 1,
        ...createStaffDto,
        password: hashedPassword,
        employmentRole: null,
        basicSalary: null,
        joinDate: new Date(),
        employmentStatus: EmploymentStatus.ACTIVE,
        phone: null,
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockStaffRepository.create.mockReturnValue(expectedStaff);
      mockStaffRepository.save.mockResolvedValue(expectedStaff);

      const result = await service.create(createStaffDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(createStaffDto.password, 10);
      expect(mockStaffRepository.create).toHaveBeenCalledWith({
        ...createStaffDto,
        password: hashedPassword,
      });
      expect(mockStaffRepository.save).toHaveBeenCalledWith(expectedStaff);
      expect(result).toEqual(expectedStaff);
    });

    it('should hash the password before saving', async () => {
      const createStaffDto: CreateStaffDto = {
        fullName: 'Jane Smith',
        email: 'jane.smith@example.com',
        password: 'mySecretPass',
        role: StaffRole.MAINTENANCE_STAFF,
      };

      const hashedPassword = 'hashedSecretPass';

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockStaffRepository.create.mockReturnValue({ ...createStaffDto, password: hashedPassword });
      mockStaffRepository.save.mockResolvedValue({ ...createStaffDto, password: hashedPassword });

      await service.create(createStaffDto);

      expect(bcrypt.hash).toHaveBeenCalledWith('mySecretPass', 10);
      expect(mockStaffRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ password: hashedPassword }),
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of staff members', async () => {
      const expectedStaff: Staff[] = [
        {
          id: 1,
          fullName: 'Alice Johnson',
          email: 'alice@example.com',
          password: 'hashedPass1',
          role: StaffRole.HOUSEKEEPER,
          employeeId: 'EMP001',
          employmentRole: 'Cleaner',
          basicSalary: 2000,
          joinDate: new Date('2024-01-01').toDateString(),
          employmentStatus: EmploymentStatus.ACTIVE,
          phone: '1234567890',
        },
        {
          id: 2,
          fullName: 'Bob Wilson',
          email: 'bob@example.com',
          password: 'hashedPass2',
          role: StaffRole.MAINTENANCE_STAFF,
          employeeId: 'EMP002',
          employmentRole: 'Technician',
          basicSalary: 2500,
          joinDate: new Date('2024-02-01').toDateString(),
          employmentStatus: EmploymentStatus.ACTIVE,
          phone: '0987654321',
        },
      ];

      mockStaffRepository.find.mockResolvedValue(expectedStaff);

      const result = await service.findAll();

      expect(mockStaffRepository.find).toHaveBeenCalledWith({
        where: { role: expect.anything() },
        select: [
          'id',
          'fullName',
          'email',
          'password',
          'role',
          'employeeId',
          'employmentRole',
          'basicSalary',
          'joinDate',
          'employmentStatus',
          'phone',
        ],
        order: { fullName: 'ASC' },
      });
      expect(result).toEqual(expectedStaff);
    });

    it('should return an empty array when no staff exist', async () => {
      mockStaffRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
      expect(mockStaffRepository.find).toHaveBeenCalled();
    });

    it('should filter staff by HOUSEKEEPER and MAINTENANCE_STAFF roles', async () => {
      mockStaffRepository.find.mockResolvedValue([]);

      await service.findAll();

      expect(mockStaffRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { role: expect.anything() },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a single staff member by id', async () => {
      const expectedStaff: Staff = {
        id: 1,
        fullName: 'Charlie Brown',
        email: 'charlie@example.com',
        password: 'hashedPass',
        role: StaffRole.HOUSEKEEPER,
        employeeId: 'EMP003',
        employmentRole: 'Senior Cleaner',
        basicSalary: 2200,
        joinDate: new Date('2024-03-01').toDateString(),
        employmentStatus: EmploymentStatus.ACTIVE,
        phone: '1112223333',
      };

      mockStaffRepository.findOne.mockResolvedValue(expectedStaff);

      const result = await service.findOne(1);

      expect(mockStaffRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, role: expect.anything() },
        select: [
          'id',
          'fullName',
          'email',
          'password',
          'role',
          'employeeId',
          'employmentRole',
          'basicSalary',
          'joinDate',
          'employmentStatus',
          'phone',
        ],
      });
      expect(result).toEqual(expectedStaff);
    });

    it('should throw NotFoundException when staff not found', async () => {
      mockStaffRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow('Staff #999 not found');
    });
  });
});
