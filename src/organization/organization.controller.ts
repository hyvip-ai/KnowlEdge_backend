import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles, User } from 'src/decorators';
import { RolesGuard } from 'src/guards';
import { OrganizationService } from './organization.service';
import { UpdateOrganizationDTO } from './dto/updateOrganization.dto';

@UseGuards(RolesGuard)
@Roles(Role.ADMIN)
@Controller('/organization')
export class OrganizationController {
  constructor(private organizationService: OrganizationService) {}

  @Get('/')
  organizationInfo(@User('organizationId') organizationId: string) {
    return this.organizationService.organizationInfo(organizationId);
  }
  @Patch('/')
  updateOrganization(
    @User('organizationId') organizationId: string,
    @Body() data: UpdateOrganizationDTO,
  ) {
    return this.organizationService.updateOrganization(organizationId, data);
  }
}
