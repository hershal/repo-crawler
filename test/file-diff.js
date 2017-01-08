'use strict';

const assert = require('power-assert');

const FileDiff = require('../repo').FileDiff;

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
