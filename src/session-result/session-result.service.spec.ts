import { Test, TestingModule } from '@nestjs/testing';
import { SessionResultService } from './session-result.service';

describe('SessionResultService', () => {
  let service: SessionResultService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SessionResultService],
    }).compile();

    service = module.get<SessionResultService>(SessionResultService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
