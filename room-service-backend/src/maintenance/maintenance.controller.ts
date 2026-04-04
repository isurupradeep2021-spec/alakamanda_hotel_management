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
import { MaintenanceService } from './maintenance.service';
import { CreateMaintenanceTicketDto } from './dto/create-maintenance-ticket.dto';
import { UpdateMaintenanceTicketDto } from './dto/update-maintenance-ticket.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('maintenance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Post()
  @Roles('ADMIN', 'MANAGER')
  create(@Body() dto: CreateMaintenanceTicketDto) {
    return this.maintenanceService.create(dto);
  }

  @Get()
  @Roles('ADMIN', 'MANAGER', 'MAINTENANCE_STAFF')
  findAll(@Request() req: any) {
    return this.maintenanceService.findAll(req.user);
  }

  @Get('stats')
  @Roles('ADMIN', 'MANAGER', 'HOUSEKEEPER', 'MAINTENANCE_STAFF')
  getStats() {
    return this.maintenanceService.getStats();
  }

  @Get(':id')
  @Roles('ADMIN', 'MANAGER', 'MAINTENANCE_STAFF')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.maintenanceService.findOne(id);
  }

  @Put(':id')
  @Roles('ADMIN', 'MANAGER')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMaintenanceTicketDto,
  ) {
    return this.maintenanceService.update(id, dto);
  }

  @Patch(':id/status')
  @Roles('MAINTENANCE_STAFF')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: string,
    @Request() req: any,
  ) {
    return this.maintenanceService.updateStatus(id, status, req.user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('ADMIN', 'MANAGER')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.maintenanceService.remove(id);
  }
}
