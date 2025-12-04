import fs from 'fs';
import isAbsolute from 'is-absolute';
import mkdirp from 'mkdirp-classic';
import path from 'path';

import copyFileSync from './copyFileSync.ts';

export interface CpSyncOptions {
  recursive?: boolean;
  verbatimSymlinks?: boolean;
  dereference?: boolean;
}

/**
 * Get symlink type for Windows compatibility
 * On Windows, symlinks need a type: 'file', 'dir', or 'junction'
 */
function getSymlinkType(targetPath: string, srcPath: string): 'file' | 'dir' | 'junction' {
  if (process.platform !== 'win32') {
    return 'file'; // Ignored on non-Windows
  }

  // Try to resolve the target and check if it's a directory
  try {
    // If target is relative, resolve it relative to the symlink's directory
    const resolvedTarget = isAbsolute(targetPath) ? targetPath : path.resolve(path.dirname(srcPath), targetPath);

    const stat = fs.statSync(resolvedTarget);
    return stat.isDirectory() ? 'dir' : 'file';
  } catch (_e) {
    // If target doesn't exist or can't be accessed, default to 'file'
    return 'file';
  }
}

/**
 * Recursive directory copy fallback for Node < 16.7.0
 * Handles files, directories, and symlinks
 */
function polyfillCpSync(src: string, dest: string, options?: CpSyncOptions): void {
  const verbatimSymlinks = options?.verbatimSymlinks ?? false;
  const dereference = options?.dereference ?? false;

  // Use lstatSync to detect symlinks (doesn't follow them)
  const lstat = fs.lstatSync(src);

  // Handle symlinks
  if (lstat.isSymbolicLink()) {
    if (dereference) {
      // Follow the symlink and copy the target
      const realPath = fs.realpathSync(src);
      const realStat = fs.statSync(realPath);
      if (realStat.isDirectory()) {
        polyfillCpSync(realPath, dest, options);
      } else {
        const parentDir = path.dirname(dest);
        if (parentDir && !fs.existsSync(parentDir)) {
          mkdirp.sync(parentDir);
        }
        copyFileSync(realPath, dest);
      }
      return;
    }

    const parentDir = path.dirname(dest);
    if (parentDir && !fs.existsSync(parentDir)) {
      mkdirp.sync(parentDir);
    }

    const linkTarget = fs.readlinkSync(src);

    // Determine the new link target
    let newLinkTarget: string;
    if (verbatimSymlinks) {
      // Keep the symlink target as-is
      newLinkTarget = linkTarget;
    } else {
      // Adjust symlink target to point to the same resolved location
      // This matches Node.js default behavior
      const resolvedTarget = isAbsolute(linkTarget) ? linkTarget : path.resolve(path.dirname(src), linkTarget);
      newLinkTarget = path.relative(path.dirname(dest), resolvedTarget);
      // If relative path is empty, use '.'
      if (!newLinkTarget) {
        newLinkTarget = '.';
      }
    }

    // Remove existing file/symlink at dest if it exists
    if (fs.existsSync(dest)) {
      fs.unlinkSync(dest);
    }

    // Get symlink type for Windows compatibility
    const symlinkType = getSymlinkType(linkTarget, src);
    fs.symlinkSync(newLinkTarget, dest, symlinkType);
  } else if (lstat.isFile()) {
    const parentDir = path.dirname(dest);
    if (parentDir && !fs.existsSync(parentDir)) {
      mkdirp.sync(parentDir);
    }
    copyFileSync(src, dest);
  } else if (lstat.isDirectory()) {
    if (!options || !options.recursive) {
      const err = new Error(`EISDIR: illegal operation on a directory, read '${src}'`) as NodeJS.ErrnoException;
      err.code = 'EISDIR';
      throw err;
    }
    if (!fs.existsSync(dest)) {
      mkdirp.sync(dest);
    }
    const entries = fs.readdirSync(src);
    for (let i = 0; i < entries.length; i++) {
      polyfillCpSync(path.join(src, entries[i]), path.join(dest, entries[i]), options);
    }
  }
}

// Node 22.17+ has a bug where dereference option is ignored
// https://github.com/nodejs/node/issues/59168
const nodeVersion = process.versions.node.split('.').map(Number);
const hasNativeDereferenceBug = (nodeVersion[0] === 22 && nodeVersion[1] >= 17) || nodeVersion[0] > 22;

/**
 * Copy a file or directory synchronously.
 * Uses native fs.cpSync when available (Node 16.7+), falls back to polyfill.
 * Uses polyfill when native has known bugs (dereference on Node 22.17+).
 *
 * @param src - Source path
 * @param dest - Destination path
 * @param options - Copy options
 *   - recursive: Copy directories recursively (default: false)
 *   - verbatimSymlinks: Keep symlink targets as-is (default: false)
 *   - dereference: Follow symlinks and copy targets (default: false)
 */
function cpSync(src: string, dest: string, options?: CpSyncOptions): void {
  // Use polyfill if native doesn't exist or has dereference bug
  if (!fs.cpSync || (hasNativeDereferenceBug && options?.dereference)) {
    polyfillCpSync(src, dest, options);
  } else {
    fs.cpSync(src, dest, options);
  }
}

export default cpSync;
