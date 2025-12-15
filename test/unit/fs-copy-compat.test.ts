import assert from 'assert';
import fs from 'fs';
import { copyFile, copyFileSync, cpSync } from 'fs-copy-compat';
import { safeRmSync } from 'fs-remove-compat';
import mkdirp from 'mkdirp-classic';
import path from 'path';
import url from 'url';

const ___filename = typeof __filename !== 'undefined' ? __filename : url.fileURLToPath(import.meta.url);
const ___dirname = path.dirname(___filename);

const TMP_DIR = path.join(___dirname, '..', '..', '.tmp');

const isWindows = process.platform === 'win32' || /^(msys|cygwin)$/.test(process.env.OSTYPE);

function cleanTmp() {
  try {
    safeRmSync(TMP_DIR, { recursive: true, force: true });
  } catch (_e) {
    // ignore
  }
}

describe('fs-copy-compat', () => {
  beforeEach(cleanTmp);
  after(cleanTmp);

  describe('copyFile', () => {
    it('should copy a file asynchronously', (done) => {
      const src = path.join(___dirname, '..', '..', 'package.json');
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

  describe('copyFileSync', () => {
    it('should copy a file synchronously', () => {
      const src = path.join(___dirname, '..', '..', 'package.json');
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
      const src = path.join(___dirname, '..', '..', 'package.json');
      const dest = path.join(TMP_DIR, 'overwrite.json');

      mkdirp.sync(TMP_DIR);
      fs.writeFileSync(dest, 'original content');

      copyFileSync(src, dest);

      const srcContent = fs.readFileSync(src, 'utf8');
      const destContent = fs.readFileSync(dest, 'utf8');
      assert.equal(srcContent, destContent, 'file should be overwritten');
    });
  });

  describe('cpSync', () => {
    it('should copy a single file', () => {
      const src = path.join(___dirname, '..', '..', 'package.json');
      const dest = path.join(TMP_DIR, 'cp-file.json');

      mkdirp.sync(TMP_DIR);

      cpSync(src, dest);

      assert.ok(fs.existsSync(dest), 'dest file should exist');
      const srcContent = fs.readFileSync(src, 'utf8');
      const destContent = fs.readFileSync(dest, 'utf8');
      assert.equal(srcContent, destContent, 'file contents should match');
    });

    it('should error on directory without recursive option', () => {
      const srcDir = path.join(TMP_DIR, 'src-dir');
      const destDir = path.join(TMP_DIR, 'dest-dir');

      mkdirp.sync(srcDir);
      fs.writeFileSync(path.join(srcDir, 'file.txt'), 'content');

      try {
        cpSync(srcDir, destDir);
        assert.fail('should have thrown');
      } catch (err: unknown) {
        const code = (err as NodeJS.ErrnoException).code;
        // Native uses ERR_FS_EISDIR, polyfill uses EISDIR
        assert.ok(code === 'EISDIR' || code === 'ERR_FS_EISDIR', `expected EISDIR error, got ${code}`);
      }
    });

    it('should copy directory recursively', () => {
      const srcDir = path.join(TMP_DIR, 'src-recursive');
      const destDir = path.join(TMP_DIR, 'dest-recursive');

      // Create source structure
      mkdirp.sync(path.join(srcDir, 'subdir'));
      fs.writeFileSync(path.join(srcDir, 'file1.txt'), 'content1');
      fs.writeFileSync(path.join(srcDir, 'subdir', 'file2.txt'), 'content2');

      cpSync(srcDir, destDir, { recursive: true });

      assert.ok(fs.existsSync(destDir), 'dest dir should exist');
      assert.ok(fs.existsSync(path.join(destDir, 'file1.txt')), 'file1 should exist');
      assert.ok(fs.existsSync(path.join(destDir, 'subdir', 'file2.txt')), 'nested file should exist');
      assert.equal(fs.readFileSync(path.join(destDir, 'file1.txt'), 'utf8'), 'content1');
      assert.equal(fs.readFileSync(path.join(destDir, 'subdir', 'file2.txt'), 'utf8'), 'content2');
    });

    it('should preserve symlinks', function () {
      // Skip on Windows due to symlink permissions
      if (isWindows) return this.skip();

      const srcDir = path.join(TMP_DIR, 'src-symlink');
      const destDir = path.join(TMP_DIR, 'dest-symlink');

      mkdirp.sync(srcDir);
      fs.writeFileSync(path.join(srcDir, 'target.txt'), 'target content');
      fs.symlinkSync('target.txt', path.join(srcDir, 'link.txt'));

      cpSync(srcDir, destDir, { recursive: true });

      assert.ok(fs.existsSync(destDir), 'dest dir should exist');
      const linkStat = fs.lstatSync(path.join(destDir, 'link.txt'));
      assert.ok(linkStat.isSymbolicLink(), 'symlink should be preserved');
      // Native cpSync may resolve relative symlinks to absolute paths
      // Just verify the symlink target contains the target filename
      const linkTarget = fs.readlinkSync(path.join(destDir, 'link.txt'));
      assert.ok(linkTarget.indexOf('target.txt') !== -1, `symlink target should reference target.txt, got ${linkTarget}`);
    });

    it('should create parent directories', () => {
      const src = path.join(___dirname, '..', '..', 'package.json');
      const dest = path.join(TMP_DIR, 'deep', 'nested', 'path', 'file.json');

      cpSync(src, dest);

      assert.ok(fs.existsSync(dest), 'dest file should exist');
    });

    it('should copy symlinks verbatim when verbatimSymlinks is true', function () {
      // Skip on Windows due to symlink permissions
      if (isWindows) return this.skip();

      const srcDir = path.join(TMP_DIR, 'src-verbatim');
      const destDir = path.join(TMP_DIR, 'dest-verbatim');

      mkdirp.sync(srcDir);
      fs.writeFileSync(path.join(srcDir, 'target.txt'), 'target content');
      fs.symlinkSync('target.txt', path.join(srcDir, 'link.txt'));

      cpSync(srcDir, destDir, { recursive: true, verbatimSymlinks: true });

      const linkStat = fs.lstatSync(path.join(destDir, 'link.txt'));
      assert.ok(linkStat.isSymbolicLink(), 'symlink should be preserved');
      // With verbatimSymlinks, the target should be exactly as in source
      const linkTarget = fs.readlinkSync(path.join(destDir, 'link.txt'));
      assert.equal(linkTarget, 'target.txt', 'symlink target should be verbatim');
    });

    it('should dereference symlinks when dereference is true', function () {
      // Skip on Windows due to symlink permissions
      if (isWindows) return this.skip();

      const srcDir = path.join(TMP_DIR, 'src-deref');
      const destDir = path.join(TMP_DIR, 'dest-deref');

      mkdirp.sync(srcDir);
      fs.writeFileSync(path.join(srcDir, 'target.txt'), 'target content');
      fs.symlinkSync('target.txt', path.join(srcDir, 'link.txt'));

      cpSync(srcDir, destDir, { recursive: true, dereference: true });

      // With dereference, link.txt should be a regular file, not a symlink
      const linkStat = fs.lstatSync(path.join(destDir, 'link.txt'));
      assert.ok(linkStat.isFile(), 'symlink should be dereferenced to a file');
      assert.ok(!linkStat.isSymbolicLink(), 'should not be a symlink');
      assert.equal(fs.readFileSync(path.join(destDir, 'link.txt'), 'utf8'), 'target content');
    });

    it('should dereference directory symlinks when dereference is true', function () {
      // Skip on Windows due to symlink permissions
      if (isWindows) return this.skip();

      const srcDir = path.join(TMP_DIR, 'src-deref-dir');
      const destDir = path.join(TMP_DIR, 'dest-deref-dir');

      mkdirp.sync(path.join(srcDir, 'realdir'));
      fs.writeFileSync(path.join(srcDir, 'realdir', 'file.txt'), 'file content');
      fs.symlinkSync('realdir', path.join(srcDir, 'linkdir'));

      cpSync(srcDir, destDir, { recursive: true, dereference: true });

      // linkdir should be a real directory, not a symlink
      const linkStat = fs.lstatSync(path.join(destDir, 'linkdir'));
      assert.ok(linkStat.isDirectory(), 'symlink should be dereferenced to a directory');
      assert.ok(!linkStat.isSymbolicLink(), 'should not be a symlink');
      assert.ok(fs.existsSync(path.join(destDir, 'linkdir', 'file.txt')), 'contents should be copied');
    });
  });
});
