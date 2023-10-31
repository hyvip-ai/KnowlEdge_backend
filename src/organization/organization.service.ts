import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class OrganizationService {
  constructor(private prisma: PrismaService) {}

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
}
