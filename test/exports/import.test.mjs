import assert from 'assert';
import { copyFile, copyFileSync, cpSync } from 'fs-copy-compat';

describe('exports .mjs', () => {
  it('copyFile', () => {
    assert.equal(typeof copyFile, 'function');
  });
  it('copyFileSync', () => {
    assert.equal(typeof copyFileSync, 'function');
  });
  it('cpSync', () => {
    assert.equal(typeof cpSync, 'function');
  });
});
