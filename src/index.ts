/**
 * Cross-platform file copy utilities with Node.js 0.8+ compatibility.
 *
 * - copyFile: Async file copy (uses streams on Node < 8.5)
 * - copyFileSync: Sync file copy (uses chunked fd on Node < 8.5)
 * - cpSync: Recursive directory copy (polyfill on Node < 16.7)
 */

export { type CopyFileCallback, default as copyFile } from './copyFile.ts';
export { default as copyFileSync } from './copyFileSync.ts';
export { type CpSyncOptions, default as cpSync } from './cpSync.ts';
