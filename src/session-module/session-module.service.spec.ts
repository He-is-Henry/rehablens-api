import { Test, TestingModule } from '@nestjs/testing';
import { SessionModuleService } from './session-module.service';

describe('SessionModuleService', () => {
  let service: SessionModuleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SessionModuleService],
    }).compile();

    service = module.get<SessionModuleService>(SessionModuleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
