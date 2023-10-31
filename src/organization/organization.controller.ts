import { Controller, Get, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles, User } from 'src/decorators';
import { RolesGuard } from 'src/guards';
import { OrganizationService } from './organization.service';

@UseGuards(RolesGuard)
@Roles(Role.ADMIN)
@Controller('/organization')
export class OrganizationController {
  constructor(private organizationService: OrganizationService) {}

  @Get('/')
  organizationInfo(@User('organizationId') organizationId: string) {
    return this.organizationService.organizationInfo(organizationId);
  }
}
