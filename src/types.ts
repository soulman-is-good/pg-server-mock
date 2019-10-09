import { TableColumnAst } from 'node-sql-parser';

export interface StartupMessage extends Record<string, string> {
  user: string;
  database?: string;
}
export interface Query {
  raw: string;
  ast: TableColumnAst;
}
export const ServerEvent = {
  Session: 'session',
} as const;
export type ServerEvent = typeof ServerEvent[keyof typeof ServerEvent];

export const FrontendEvent = {
  StartupMessage: 'StartupMessage',
  Query: 'Query',
  Terminate: 'Terminate',
} as const;
export type FrontendEvent = typeof FrontendEvent[keyof typeof FrontendEvent];

export const Command = {
  AuthenticationOk() {
    return Buffer.concat([
      Buffer.from('R'),
      Buffer.from([0, 0, 0, 8]),
      Buffer.alloc(4, 0),
    ]);
  },
  ReadyForQuery(transactionState = 'I') {
    return Buffer.concat([
      Buffer.from('Z'),
      Buffer.from([0, 0, 0, 5]),
      Buffer.from(transactionState),
    ]);
  },
  NoData() {
    return Buffer.concat([Buffer.from('n'), Buffer.from([0, 0, 0, 4])]);
  },
} as const;
export type Command = keyof typeof Command;
