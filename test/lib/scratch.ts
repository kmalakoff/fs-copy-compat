import { safeRmSync } from 'fs-remove-compat';
import path from 'path';
import url from 'url';

const ___filename = typeof __filename !== 'undefined' ? __filename : url.fileURLToPath(import.meta.url);
const ___dirname = path.dirname(___filename);

export const PACKAGE_ROOT = path.join(___dirname, '..', '..');
export const TMP_DIR = path.join(PACKAGE_ROOT, '.tmp');

export function cleanTmp() {
  safeRmSync(TMP_DIR, { recursive: true, force: true });
}
