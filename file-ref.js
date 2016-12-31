'use strict';

const FileClassifier = require('./file-classifier');

class FileRef {
  get name() { return this._filepath.split('/').slice(-1).pop(); }
  get path() { return this._filepath; }
  get extension() { return this._filepath.split('.').slice(-1).pop(); }
  get classification() { return this._classification; }

  constructor(filepath) {
    this._filepath = filepath;
    this._classification = FileClassifier.classify(this);
  }
}
module.exports.FileRef = FileRef;
