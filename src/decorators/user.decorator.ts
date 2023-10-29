import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from 'src/auth/types';

export const User = createParamDecorator(
  (
    data: keyof JwtPayload | undefined,
    context: ExecutionContext,
  ): string | JwtPayload => {
    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload;
    if (!data) {
      return user;
    }
    return user[data];
  },
);
