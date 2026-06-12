import type { Request } from 'express';
import morgan from 'morgan';

import { logger } from '../lib/logger';

morgan.token('request-id', (req) => (req as Request).id ?? '-');

export const httpLogger = morgan(
  ':request-id :method :url HTTP/:http-version :status :res[content-length] - :response-time ms',
  {
    stream: {
      write: (message) => {
        logger.info(message.trim());
      },
    },
  },
);
