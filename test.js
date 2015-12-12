'use strict';

const rethrow = require('./index.js');
const assert = require('assert');

const SAMPLE_ERROR = new Error('Something bad happened - but not Postgres!');

const SAMPLE_PG_ERROR = new Error('null value in column "name" violates not-null constraint');

Object.assign(SAMPLE_PG_ERROR, {
  name: 'error',
  length: 245,
  severity: 'ERROR',
  code: '23502',
  detail: 'Failing row contains (something bad).',
  hint: undefined,
  position: undefined,
  internalPosition: undefined,
  internalQuery: undefined,
  where: undefined,
  schema: 'public',
  table: 'users',
  column: 'name',
  dataType: undefined,
  constraint: undefined,
  file: 'execMain.c',
  line: '1611',
  routine: 'ExecConstraints'
});

describe('pg-rethrow', () => {
  it('re-throws known PostgreSQL errors', (done) => {
    Promise.reject(SAMPLE_PG_ERROR).catch(rethrow).catch((err) => {
      assert(err instanceof rethrow.ERRORS.NotNullViolation);
      assert(err instanceof Error);

      assert(err.message === SAMPLE_PG_ERROR.message);
      assert(err.detail === SAMPLE_PG_ERROR.detail);
      done();
    }).catch(err => done(err));
  });

  it('passes through unknown errors verbatim', (done) => {
    Promise.reject(SAMPLE_ERROR).catch(rethrow).catch((err) => {
      assert(err === SAMPLE_ERROR);
      done();
    });
  });

  it('returns non-errors verbatim', () => {
    assert(rethrow('Not an Error') === 'Not an Error');
  });
});
