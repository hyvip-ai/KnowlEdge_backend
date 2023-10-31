import { Body, Controller, Get, Patch } from '@nestjs/common';
import { UserService } from './user.service';
import { UserId } from 'src/decorators';
import { UpdateProfileDTO } from './dto';

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
}
