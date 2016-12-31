'use strict';

const assert = require('power-assert');
const FileDiff = require('../index').FileDiff;

describe('FileDiff Tests', function () {

  it('should create a valid FileDiff object', function () {
    const singleLineDiffStat = '12       49      board-progs/autonomous-racer/common/ir.cpp';
    const ds = new FileDiff(singleLineDiffStat);
    assert(ds.additions == 12);
    assert(ds.deletions == 49);
    assert(ds.filename == 'ir.cpp');
    assert(ds.filepath == 'board-progs/autonomous-racer/common/ir.cpp');

  });
});
