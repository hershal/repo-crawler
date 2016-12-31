'use strict';

class FileRef {
  get name() { return this._filepath.split('/').slice(-1).pop(); }
  get path() { return this._filepath; }
  get extension() { return this._filepath.split('.').slice(-1).pop(); }

  constructor(filepath) {
    this._filepath = filepath;
  }
}
module.exports.FileRef = FileRef;
