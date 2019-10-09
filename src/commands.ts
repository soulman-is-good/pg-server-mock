import { Command } from './types';
import { TypeDef } from './pgType';
import { createBuffer32, createBuffer16 } from './utils';

type BufferCreator = (...args: any[]) => Buffer;

interface ColumnDef {
  name: string;
}

export const Commands: Record<Command, BufferCreator> = {
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
  EmptyQueryResponse() {
    return Buffer.concat([Buffer.from('I'), Buffer.from([0, 0, 0, 4])]);
  },
  NoData() {
    return Buffer.concat([Buffer.from('n'), Buffer.from([0, 0, 0, 4])]);
  },
  RowDescription(columnsDefs: Record<string, TypeDef>) {
    const keys = Object.keys(columnsDefs);
    const fields = Buffer.concat(
      keys.map(key => {
        const def = columnsDefs[key];

        return Buffer.concat([
          Buffer.from(key), // field name
          createBuffer32(0), // field OID if it is column
          createBuffer16(0), // number of column
          def.oid,
          def.length,
          def.modifier,
          createBuffer16(0), // format code 0 - text, 1 - bin
        ]);
      }),
    );

    return Buffer.concat([
      Buffer.from('T'),
      createBuffer32(fields.length + 6),
      createBuffer16(keys.length),
      fields,
    ]);
  },
  DataRow() {},
  CommandComplete() {},
};

// type CommandsCreators = typeof Commands[keyof typeof Commands];

// export type BufferCreatorArguments<T extends Command, R extends typeof Commands[T] = typeof Commands[T]> = R extends (...args: infer U) => Buffer ? U extends string ? U : never : R[];

// const a = <T extends Command>(...args: BufferCreatorArguments<T>) => Buffer.alloc(0);
