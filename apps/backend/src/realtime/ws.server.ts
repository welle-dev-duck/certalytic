import { fromNodeHeaders } from 'better-auth/node';
import type { Server } from 'node:http';
import { WebSocketServer, type WebSocket } from 'ws';

import type { Auth } from '../modules/auth/auth';
import type { OrganizationsService } from '../modules/organizations/organizations.service';
import type { RealtimeMessage } from './channels';

type ClientState = {
  organizationId: string | null;
};

export class RealtimeServer {
  private readonly wss: WebSocketServer;
  private readonly clients = new Map<WebSocket, ClientState>();

  constructor(
    server: Server,
    private readonly auth: Auth,
    private readonly organizationsService: OrganizationsService,
  ) {
    this.wss = new WebSocketServer({ server, path: '/api/realtime' });

    this.wss.on('connection', (socket, request) => {
      void this.handleConnection(socket, request.headers);
    });
  }

  broadcast(message: RealtimeMessage): void {
    const payload = JSON.stringify(message);

    for (const [socket, state] of this.clients.entries()) {
      if (
        socket.readyState === socket.OPEN &&
        state.organizationId === message.organizationId
      ) {
        socket.send(payload);
      }
    }
  }

  async close(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.wss.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }

  private async handleConnection(
    socket: WebSocket,
    headers: Record<string, string | string[] | undefined>,
  ): Promise<void> {
    const session = await this.auth.instance.api.getSession({
      headers: fromNodeHeaders(headers),
    });

    if (!session) {
      socket.close(4401, 'Unauthorized');
      return;
    }

    this.clients.set(socket, { organizationId: null });
    socket.send(JSON.stringify({ type: 'connected' }));

    socket.on('message', (raw) => {
      void this.handleMessage(socket, session.user.id, raw.toString());
    });

    socket.on('close', () => {
      this.clients.delete(socket);
    });
  }

  private async handleMessage(
    socket: WebSocket,
    userId: string,
    raw: string,
  ): Promise<void> {
    let parsed: unknown;

    try {
      parsed = JSON.parse(raw);
    } catch {
      socket.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
      return;
    }

    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('type' in parsed) ||
      parsed.type !== 'subscribe' ||
      !('organizationId' in parsed) ||
      typeof parsed.organizationId !== 'string'
    ) {
      socket.send(
        JSON.stringify({
          type: 'error',
          message: 'Expected { type: "subscribe", organizationId }',
        }),
      );
      return;
    }

    const context = await this.organizationsService.resolveActiveContext(
      userId,
      parsed.organizationId,
    );

    if (!context) {
      socket.send(JSON.stringify({ type: 'error', message: 'Forbidden' }));
      return;
    }

    const state = this.clients.get(socket);

    if (state) {
      state.organizationId = context.id;
    }

    socket.send(
      JSON.stringify({
        type: 'subscribed',
        organizationId: context.id,
      }),
    );
  }
}
