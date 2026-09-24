import { Injectable } from '@nestjs/common';

export interface LeaderboardEntry {
  patientId: string;
  name: string;
  customId: string;
  points: number;
}

export interface LeaderboardHospital {
  hospitalId: string;
  hospitalName: string;
  patients: LeaderboardEntry[];
}

export type Leaderboard = LeaderboardHospital[];

@Injectable()
export class LeaderboardService {
  private cache = new Map<string, LeaderboardHospital>();

  private makeKey(
    hospitalId: string,
    timeframe: 'weekly' | 'lifetime',
  ): string {
    return `${hospitalId}:${timeframe}`;
  }

  get(
    hospitalId: string,
    timeframe: 'weekly' | 'lifetime',
  ): LeaderboardHospital | undefined {
    return this.cache.get(this.makeKey(hospitalId, timeframe));
  }

  set(
    hospitalId: string,
    timeframe: 'weekly' | 'lifetime',
    data: LeaderboardHospital,
  ): void {
    this.cache.set(this.makeKey(hospitalId, timeframe), data);
  }

  invalidate(hospitalIds: string[]): void {
    for (const id of hospitalIds) {
      this.cache.delete(this.makeKey(id, 'weekly'));
      this.cache.delete(this.makeKey(id, 'lifetime'));
    }
  }

  getRank(
    patientId: string,
    hospitalId: string,
    timeframe: 'weekly' | 'lifetime',
  ): number {
    const cached = this.cache.get(this.makeKey(hospitalId, timeframe));
    if (!cached) return -1;
    const index = cached.patients.findIndex((p) => p.patientId === patientId);
    return index !== -1 ? index + 1 : -1;
  }
}
