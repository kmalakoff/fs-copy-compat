import fs from 'fs';

const BUFFER_SIZE = 65536; // 64KB chunks

/**
 * Chunked file copy fallback for Node < 8.5.0
 * Memory efficient - reads and writes in 64KB chunks using file descriptors
 */
function chunkedCopyFileSync(src: string, dest: string): void {
  const srcFd = fs.openSync(src, 'r');
  try {
    const destFd = fs.openSync(dest, 'w');
    try {
      const buffer = Buffer.alloc ? Buffer.alloc(BUFFER_SIZE) : new Buffer(BUFFER_SIZE);
      let pos = 0;
      let bytesRead = fs.readSync(srcFd, buffer, 0, BUFFER_SIZE, pos);

      while (bytesRead > 0) {
        fs.writeSync(destFd, buffer, 0, bytesRead);
        pos += bytesRead;
        bytesRead = fs.readSync(srcFd, buffer, 0, BUFFER_SIZE, pos);
      }
    } finally {
      fs.closeSync(destFd);
    }
  } finally {
    fs.closeSync(srcFd);
  }
}

/**
 * Copy a file synchronously.
 * Uses native fs.copyFileSync when available (Node 8.5+), falls back to chunked copy.
 *
 * @param src - Source file path
 * @param dest - Destination file path
 */
const copyFileSync: (src: string, dest: string) => void = fs.copyFileSync || chunkedCopyFileSync;

export default copyFileSync;
