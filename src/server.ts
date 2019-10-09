/**
 * PgServer mock
 * This mock implements postgres Frontend & backend protocol
 *
 * @see https://www.postgresql.org/docs/11/protocol-flow.html
 * @see https://www.postgresql.org/docs/11/protocol-message-formats.html
 *
 * @copyright Maxim Savin <soulman.is.good@gmail.com> (c) 2019.
 */
import net from 'net';
import { EventEmitter } from 'events';
import { PgSession } from './session';
import {
  ServerEvent,
  FrontendEvent,
  Command,
  Query,
  StartupMessage,
} from './types';
import { readStartupData } from './utils';

export class PgServer extends EventEmitter {
  private _server: net.Server;

  private _sessions: WeakMap<net.Socket, PgSession>;

  constructor() {
    super();
    this._server = net.createServer();
    this._server.on('error', this._onError.bind(this));
    this._server.on('connection', this._onConnection.bind(this));
    this._server.on('close', this._onClose.bind(this));
    this._sessions = new WeakMap();
  }

  listen() {
    return new Promise<number>(resolve => {
      this._server.listen(() => {
        resolve((this._server.address() as net.AddressInfo).port);
      });
    });
  }

  close(done: () => void) {
    this._server.close(done);
  }

  _onConnection(client = new net.Socket()) {
    console.log('CONNECTION');
    client.setTimeout(1000);
    client.on('data', data => {
      this._onData(client, data);
    });
    client.on('error', () => this._onClientClose(client));
    client.on('close', () => this._onClientClose(client));
    client.on('timeout', () => this._onClientClose(client));
  }

  _onData(client: net.Socket, data: Buffer) {
    console.log('DATA', data);
    this.emit('data', client, data);
    if (!this._sessions.has(client)) {
      const startData = readStartupData(data);
      const session = new PgSession(client, startData.parameters);

      this._sessions.set(client, session);
      this.emit(ServerEvent.Session, session);
      client.setTimeout(0);
    } else {
      const session = this._sessions.get(client);

      session.process(data);
    }
  }

  _onClientClose(client: net.Socket) {
    this._sessions.delete(client);
  }

  _onError(err: Error) {
    console.error(err);
  }

  _onClose() {
    console.log('closed');
  }
}

export {
  ServerEvent,
  FrontendEvent,
  Command,
  Query,
  StartupMessage,
  PgSession,
};
