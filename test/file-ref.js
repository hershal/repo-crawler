'use strict';

const assert = require('power-assert');

const FileRef = require('../file-ref').FileRef;

describe('FileRef Tests', function () {
  let file;
  before('construct a FileRef object', function () {
    file = new FileRef('/tmp/data.json');
  });

  it('should have proper structures', function () {
    assert(file.path == '/tmp/data.json');
    assert(file.name == 'data.json');
    assert(file.extension == 'json');
    assert(file.classification.category = 'web');
  });
});
