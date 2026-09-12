import assert from 'assert';
import fs from 'fs';
import { copyFile } from 'fs-copy-compat';
import mkdirp from 'mkdirp-classic';
import path from 'path';
import { cleanTmp, PACKAGE_ROOT, TMP_DIR } from '../lib/scratch.ts';

describe('copyFile', () => {
  beforeEach(cleanTmp);
  after(cleanTmp);

  it('should copy a file asynchronously', (done) => {
    const src = path.join(PACKAGE_ROOT, 'package.json');
    const dest = path.join(TMP_DIR, 'package.json');

    mkdirp.sync(TMP_DIR);

    copyFile(src, dest, (err) => {
      if (err) return done(err);

      assert.ok(fs.existsSync(dest), 'dest file should exist');
      const srcContent = fs.readFileSync(src, 'utf8');
      const destContent = fs.readFileSync(dest, 'utf8');
      assert.equal(srcContent, destContent, 'file contents should match');
      done();
    });
  });

  it('should error when source does not exist', (done) => {
    const src = path.join(TMP_DIR, 'nonexistent.txt');
    const dest = path.join(TMP_DIR, 'dest.txt');

    mkdirp.sync(TMP_DIR);

    copyFile(src, dest, (err) => {
      assert.ok(err, 'should error');
      assert.equal(err?.code, 'ENOENT');
      done();
    });
  });
});
