import pino from 'pino';
import { randomUUID } from 'crypto';
import { config } from './config';

export const logger = pino({
  level: config.logLevel,
  formatters: {
    level: (label) => ({ level: label })
  },
  timestamp: pino.stdTimeFunctions.isoTime
});

export function newTraceId(): string {
  return randomUUID();
}
