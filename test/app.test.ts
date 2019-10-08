import { assert } from 'chai';
import { run } from '../src/app';

describe('Application test', () => {
  it('should start', () => {
    const result = run();

    assert.strictEqual(result, 'Application');
  });
});
