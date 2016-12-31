'use strict';

const classification = require('./filetypes.json');

class FileClassifier {
  constructor() { }
  static classify(fileRef) {
    return classification[fileRef.extension];
  }
}
module.exports = FileClassifier;
