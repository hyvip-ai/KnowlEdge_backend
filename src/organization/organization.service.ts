import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateOrganizationDTO } from './dto/updateOrganization.dto';
import { CommonService } from 'src/common/common.service';

@Injectable()
export class OrganizationService {
  constructor(private prisma: PrismaService, private common: CommonService) {}

  async organizationInfo(organizationId: string) {
    const organization = await this.prisma.organization.findUnique({
      where: {
        id: organizationId,
      },
      select: {
        name: true,
        email: true,
        openAIApiKey: true,
        subscription: true,
      },
    });

    return { data: organization, statusCode: 200, message: 'SUCCESS' };
  }

  async updateOrganization(
    organizationId: string,
    data: UpdateOrganizationDTO,
  ) {
    try {
      await this.prisma.organization.update({
        where: {
          id: organizationId,
        },
        data: {
          openAIApiKey: data.openAIApiKey,
        },
      });
      return { data: {}, message: 'SUCCESS', statusCode: 200 };
    } catch (err) {
      this.common.generateErrorResponse(err, 'Organization');
    }
  }
}
