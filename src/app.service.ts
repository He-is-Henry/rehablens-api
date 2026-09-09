import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  wake(): string {
    return 'Awake';
  }
}
