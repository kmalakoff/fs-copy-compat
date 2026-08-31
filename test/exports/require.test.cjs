const assert = require('assert');
const { copyFile, copyFileSync, cpSync } = require('fs-copy-compat');

describe('exports .cjs', () => {
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
