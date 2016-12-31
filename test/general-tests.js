'use strict';

const assert = require('power-assert');
const FileDiff = require('../repo').FileDiff;
const Repo = require('../repo').Repo;
const FileRef = require('../file-ref').FileRef;

describe('FileDiff Tests', function () {
  it('should create a valid FileDiff object', function () {
    const singleLineDiffStat = '12       49      board-progs/autonomous-racer/common/ir.cpp';
    const ds = new FileDiff(singleLineDiffStat);
    assert(ds.additions == 12);
    assert(ds.deletions == 49);
    assert(ds.file.name == 'ir.cpp');
    assert(ds.file.path == 'board-progs/autonomous-racer/common/ir.cpp');
    assert(ds.file.extension == 'cpp');
  });
});


describe('FileRef Tests', function () {
  let file;
  before('construct a FileRef object', function () {
      file = new FileRef('/tmp/data.json');
  });

  it('should have proper structures', function () {
    assert(file.path == '/tmp/data.json');
    assert(file.name == 'data.json');
    assert(file.extension == 'json');
  });
});


describe('Repo Categorization Tests', function () {
  let repo;

  before('should create a repo object', function(done) {
    let dir = '../hershal.com';
    repo = new Repo(dir);
    repo.traverse().then(function () {
      assert(repo.additions > 0 && repo.deletions > 0);
      done();
    });
  });

  it('', function () {

  });
});
