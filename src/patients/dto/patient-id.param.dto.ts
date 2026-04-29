import { IsNotEmpty, IsString } from 'class-validator';

export class PatientIdParamDto {
  @IsString()
  @IsNotEmpty()
  id!: string;
}
