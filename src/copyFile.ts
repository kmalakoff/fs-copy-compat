import fs from 'fs';
import pump from 'pump';

export type CopyFileCallback = (err?: NodeJS.ErrnoException | null) => void;

/**
 * Stream-based file copy fallback for Node < 8.5.0
 * Memory efficient - doesn't load entire file into memory
 */
function streamCopyFile(src: string, dest: string, callback: CopyFileCallback) {
  fs.stat(src, (err) => {
    if (err) return callback(err);
    pump(fs.createReadStream(src), fs.createWriteStream(dest), callback);
  });
}

/**
 * Copy a file asynchronously.
 * Uses native fs.copyFile when available (Node 8.5+), falls back to stream-based copy.
 *
 * @param src - Source file path
 * @param dest - Destination file path
 * @param callback - Callback function
 */
const copyFile: (src: string, dest: string, callback: CopyFileCallback) => void = fs.copyFile ? (src, dest, callback) => fs.copyFile(src, dest, callback) : streamCopyFile;

export default copyFile;
