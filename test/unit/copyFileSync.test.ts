import assert from 'assert';
import fs from 'fs';
import { copyFileSync } from 'fs-copy-compat';
import mkdirp from 'mkdirp-classic';
import path from 'path';
import { cleanTmp, PACKAGE_ROOT, TMP_DIR } from '../lib/scratch.ts';

describe('copyFileSync', () => {
  beforeEach(cleanTmp);
  after(cleanTmp);

  it('should copy a file synchronously', () => {
    const src = path.join(PACKAGE_ROOT, 'package.json');
    const dest = path.join(TMP_DIR, 'package-sync.json');

    mkdirp.sync(TMP_DIR);

    copyFileSync(src, dest);

    assert.ok(fs.existsSync(dest), 'dest file should exist');
    const srcContent = fs.readFileSync(src, 'utf8');
    const destContent = fs.readFileSync(dest, 'utf8');
    assert.equal(srcContent, destContent, 'file contents should match');
  });

  it('should error when source does not exist', () => {
    const src = path.join(TMP_DIR, 'nonexistent.txt');
    const dest = path.join(TMP_DIR, 'dest.txt');

    mkdirp.sync(TMP_DIR);

    try {
      copyFileSync(src, dest);
      assert.fail('should have thrown');
    } catch (err: unknown) {
      assert.equal((err as NodeJS.ErrnoException).code, 'ENOENT');
    }
  });

  it('should overwrite existing destination', () => {
    const src = path.join(PACKAGE_ROOT, 'package.json');
    const dest = path.join(TMP_DIR, 'overwrite.json');

    mkdirp.sync(TMP_DIR);
    fs.writeFileSync(dest, 'original content');

    copyFileSync(src, dest);

    const srcContent = fs.readFileSync(src, 'utf8');
    const destContent = fs.readFileSync(dest, 'utf8');
    assert.equal(srcContent, destContent, 'file should be overwritten');
  });
});
