import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserSchema } from '../src/user/user.schema';
import { Counter, CounterSchema } from '../src/counter/counter.schema';
import { UserRole } from '../src/user/dto/create-user.dto';
import * as dotenv from 'dotenv';
dotenv.config();

import * as dns from 'dns';

// Fix Node v22/v24 Windows SRV lookup issue in dev only
if (process.env.NODE_ENV !== 'production') {
  dns.setServers(['1.1.1.1', '8.8.8.8']);
}

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set in .env');

  await mongoose.connect(uri);
  const UserModel = mongoose.model(User.name, UserSchema);
  const CounterModel = mongoose.model(Counter.name, CounterSchema);

  const email = 'henries90+admin@gmail.com';
  const existing = await UserModel.findOne({ email });
  if (existing) {
    console.log('Admin already exists:', existing.customId);
    process.exit(0);
  }

  const counter = await CounterModel.findOneAndUpdate(
    { id: 'admin_sequence' },
    { $inc: { count: 1 } },
    { returnDocument: 'after', upsert: true },
  );
  const customId = `ADM-${String(counter.count).padStart(4, '0')}`;

  const password = 'Oluwanifemi';
  const hashed = await bcrypt.hash(password, 10);

  await UserModel.create({
    name: 'Super Admin',
    email,
    password: hashed,
    role: UserRole.ADMIN,
    customId,
  });

  console.log('Admin created:', customId, email);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
