import type { DurationUnit } from './duration-unit';

export interface RateLimiter {
  readonly route: string;
  readonly allowedRequests: number;
  readonly duration: number;
  readonly durationUnit: DurationUnit;
  consumePoint(indentifier: string): Promise<number>;
  getRemainingPoints(identifier: string): Promise<number>;
  resetPoints(identifier: string): Promise<void>;
}
