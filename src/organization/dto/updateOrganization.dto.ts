import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateOrganizationDTO {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  openAIApiKey?: string;
}
