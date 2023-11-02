import { ArrayMaxSize, ArrayMinSize, IsEmail } from 'class-validator';

export class InviteUserDTO {
  @ArrayMinSize(1, { message: 'List should contains at least one emails' })
  @ArrayMaxSize(3, { message: 'You can invite 3 people maximum at one time' })
  @IsEmail({}, { each: true })
  emails: string[];
}
