import { EventEmitter } from 'events';
import { Socket } from 'net';
import { Parser } from 'node-sql-parser';
import { StartupMessage, FrontendEvent, Query } from './types';

export class PgSession extends EventEmitter {
  private _client: Socket;

  readonly user: string;

  database?: string;

  constructor(client: Socket, params: StartupMessage) {
    super();
    this.user = params.user;
    this.database = params.database;
    this._client = client;
    this.emit(FrontendEvent.StartupMessage, params.parameters);
  }

  process(data: Buffer) {
    const firstByte = data.slice(0, 1).toString();

    if (firstByte === 'X') {
      this.emit(FrontendEvent.Terminate, data.readInt32BE(1));
      return;
    }
    if (firstByte === 'Q') {
      const size = data.readInt32BE(1);
      const query = data.slice(5, size).toString();
      const parser = new Parser();
      const ast = parser.parse(query);

      this.emit(FrontendEvent.Query, { raw: query, ast } as Query);
      return;
    }
    console.log(data, data.toString());
  }

  send(buffer: Buffer) {
    return new Promise(resolve => {
      this._client.write(buffer, resolve);
    });
  }
}
