import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './user.schema';
import { CounterModule } from 'src/counter/counter.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    CounterModule,
  ],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
