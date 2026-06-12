import pino from 'pino';

import { env } from '../config/env';

export const logger = pino({
  level: env.LOG_LEVEL,
  base: {
    service: 'certalytic-api',
    env: env.NODE_ENV,
  },
  ...(env.NODE_ENV === 'development'
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname,service,env',
          },
        },
      }
    : {}),
});

export function createRequestLogger(requestId: string): pino.Logger {
  return logger.child({ requestId });
}
