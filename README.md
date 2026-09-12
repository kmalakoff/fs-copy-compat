# fs-copy-compat

Cross-platform file copy utilities with Node.js 0.8+ compatibility. It provides asynchronous and synchronous file copies, plus recursive directory copying.

## Install

```sh
npm install fs-copy-compat
```

## Use

Copy a file and check the destination in the callback:

```js
var fs = require('fs');
var os = require('os');
var path = require('path');
var copyFile = require('fs-copy-compat').copyFile;

var input = path.join(os.tmpdir(), 'fs-copy-compat-input.txt');
var output = path.join(os.tmpdir(), 'fs-copy-compat-output.txt');
fs.writeFileSync(input, 'temporary file');
copyFile(input, output, function (error) {
  if (error) throw error;
  console.log(fs.readFileSync(output, 'utf8')); // temporary file
  fs.unlinkSync(input);
  fs.unlinkSync(output);
});
```

`copyFile` and `copyFileSync` copy one file. `cpSync` copies a file or directory; pass `recursive: true` for directories. It preserves symlinks by default. Set `dereference: true` to copy symlink targets, or `verbatimSymlinks: true` to keep link targets unchanged.

The asynchronous function uses a Node-style callback. The package uses native copy APIs when available and fallbacks on older Node versions.

## API

- `copyFile(src, dest, callback)` copies one file asynchronously.
- `copyFileSync(src, dest)` copies one file synchronously.
- `cpSync(src, dest, options)` copies a file or directory synchronously.

## License

MIT
