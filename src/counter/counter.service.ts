import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Counter } from './counter.schema';
import { Model } from 'mongoose';

@Injectable()
export class CounterService {
  constructor(
    @InjectModel(Counter.name) private counterModel: Model<Counter>,
  ) {}

  async createCount(resource: string) {
    const id = `${resource}_sequence`;

    const counter = await this.counterModel.findOneAndUpdate(
      { id },
      { $inc: { count: 1 } },
      { returnDocument: 'after', upsert: true },
    );

    const paddedSequence = String(counter.count).padStart(4, '0');
    return paddedSequence;
  }
}
