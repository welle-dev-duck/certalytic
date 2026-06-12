import { describe, expect, it } from 'vitest';

import {
  createMockRequest,
  createMockResponse,
  getJsonBody,
} from '../../test/helpers/express';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  it('returns the request session payload', async () => {
    const controller = new UsersController(new UsersService({} as never));
    const session = {
      session: { id: '01932f5a-7b2a-7000-8000-000000000010' },
      user: { id: testUserId(), email: 'user@example.com', name: 'User' },
    };
    const req = createMockRequest({ session: session as never });
    const res = createMockResponse();

    await controller.getSession(req, res);

    expect(getJsonBody(res)).toEqual({ session });
  });
});

function testUserId() {
  return '01932f5a-7b2a-7000-8000-000000000001';
}
