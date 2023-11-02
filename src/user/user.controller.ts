import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { Roles, User, UserId } from 'src/decorators';
import { InviteUserDTO, SetBasicDTO, UpdateProfileDTO } from './dto';
import { Public, RolesGuard } from 'src/guards';
import { Role } from '@prisma/client';

@Controller('/user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('/me')
  me(@UserId() userId: string) {
    return this.userService.me(userId);
  }

  @Patch('/me')
  updateProfile(@UserId() userId: string, @Body() data: UpdateProfileDTO) {
    return this.userService.updateProfile(userId, data);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get('/all')
  allUser(@User('organizationId') organizationId: string) {
    return this.userService.allUsers(organizationId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post('/invite')
  inviteUsers(
    @UserId() userId: string,
    @User('organizationId') organizationId: string,
    @Body() data: InviteUserDTO,
  ) {
    return this.userService.inviteUsers(userId, organizationId, data);
  }

  @Public()
  @Patch('/set-basic')
  setBasic(@Body() data: SetBasicDTO) {
    return this.userService.setBasic(data);
  }
}
