import { Payload } from 'src/auth/dto/create-auth.dto';

declare module 'express' {
  interface Request {
    user?: Payload;
  }
}
