import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { HousekeepingService } from './housekeeping.service';
import { CreateHousekeepingTaskDto } from './dto/create-housekeeping-task.dto';
import { UpdateHousekeepingTaskDto } from './dto/update-housekeeping-task.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('housekeeping')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HousekeepingController {
  constructor(private readonly housekeepingService: HousekeepingService) {}

  @Post()
  @Roles('ADMIN', 'MANAGER')
  create(@Body() dto: CreateHousekeepingTaskDto) {
    return this.housekeepingService.create(dto);
  }

  @Get()
  @Roles('ADMIN', 'MANAGER', 'HOUSEKEEPER')
  findAll(@Request() req: any) {
    return this.housekeepingService.findAll(req.user);
  }

  @Get('stats')
  @Roles('ADMIN', 'MANAGER', 'HOUSEKEEPER', 'MAINTENANCE_STAFF')
  getStats() {
    return this.housekeepingService.getStats();
  }

  @Get(':id')
  @Roles('ADMIN', 'MANAGER', 'HOUSEKEEPER')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.housekeepingService.findOne(id);
  }

  @Put(':id')
  @Roles('ADMIN', 'MANAGER')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateHousekeepingTaskDto,
  ) {
    return this.housekeepingService.update(id, dto);
  }

  @Patch(':id/status')
  @Roles('HOUSEKEEPER')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: string,
    @Request() req: any,
  ) {
    return this.housekeepingService.updateStatus(id, status, req.user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('ADMIN', 'MANAGER')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.housekeepingService.remove(id);
  }
}
