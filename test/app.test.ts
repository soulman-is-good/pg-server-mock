import { assert } from 'chai';
import pg from 'pg';
import {
  PgServer,
  Commands,
  ServerEvent,
  PgSession,
  FrontendEvent,
  Query,
} from '../src/server';

const waitFor = <T>(obj: any, event: string) =>
  new Promise<T>(resolve => obj.once(event, resolve));

describe('Application test', () => {
  describe('Connection and authentication', () => {
    let pgsrv: PgServer;
    let port: number;

    before(async () => {
      pgsrv = new PgServer();
      port = await pgsrv.listen();
    });
    after(done => {
      pgsrv.close(done);
    });

    it('should connect', async () => {
      if (!pgsrv) throw new Error('Server not initialized');
      const cli = new pg.Client(`postgres://user:pass@127.0.0.1:${port}/db`);

      cli.connect();
      const session = await waitFor<PgSession>(pgsrv, ServerEvent.Session);

      assert.strictEqual(session.user, 'user');
      assert.strictEqual(session.database, 'db');

      cli.end();
      const length = await waitFor(session, FrontendEvent.Terminate);

      assert.equal(length, 4);
    });

    it('should authenticate', async () => {
      if (!pgsrv) throw new Error('Server not initialized');
      const cli = new pg.Client(`postgres://user:pass@127.0.0.1:${port}/db`);

      cli.connect();
      const session = await waitFor<PgSession>(pgsrv, ServerEvent.Session);

      await session.send(Commands.AuthenticationOk());
      await session.send(Commands.ReadyForQuery());

      cli.end();
    });

    it('should run SELECT query properly', async () => {
      if (!pgsrv) throw new Error('Server not initialized');
      const cli = new pg.Client(`postgres://user:pass@127.0.0.1:${port}/db`);

      cli.connect();
      const session = await waitFor<PgSession>(pgsrv, ServerEvent.Session);

      await session.send(Commands.AuthenticationOk());
      await session.send(Commands.ReadyForQuery());
      const query =
        "SELECT COUNT(*) FROM information_schema.tables WHERE table_type = 'BASE TABLE' AND table_type = 1";

      cli.query(query);
      // wait for query on server
      const parsed = (await waitFor(session, FrontendEvent.Query)) as Query;

      console.log(parsed.tableColumnAst.ast);
      assert.strictEqual(query, parsed.raw);
      await session.send(Commands.EmptyQueryResponse());
      await session.send(Commands.ReadyForQuery());

      cli.end();
      const length = await waitFor(session, FrontendEvent.Terminate);

      assert.equal(length, 4);
    });
  });
});
