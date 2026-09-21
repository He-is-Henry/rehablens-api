export class CreateSessionDto {
  refreshToken!: string;
  userId!: string;
  pushToken?: string;
}
