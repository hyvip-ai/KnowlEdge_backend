import { Controller, Get } from '@nestjs/common';
import { UserService } from './user.service';
import { UserId } from 'src/decorators';

@Controller('/user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('/me')
  me(@UserId() userId: string) {
    return this.userService.me(userId);
  }
}
