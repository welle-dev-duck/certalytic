import type { Request, Response } from 'express';

import { sendJson } from '../../lib/response';
import { sessionResponseSchema } from './users.dto';
import type { UsersService } from './users.service';

export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  getSession = async (req: Request, res: Response) => {
    sendJson(res, sessionResponseSchema, { session: req.session });
  };
}
