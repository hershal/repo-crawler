'use strict';

const assert = require('power-assert');

const FileDiff = require('../repo').FileDiff;
const FileRef = require('../file-ref').FileRef;

describe('FlatDiff tests', function () {
  function createFakeObject(filepath, date, sha) {
    sha = sha ? sha : 'abc';
    const singleLineDiffStat = '1        1      ' + filepath;
    const ds = new FileDiff(singleLineDiffStat);
    ds._commit = { sha: sha,
                   date: date,
                   repo: { dir: new FileRef('somewhere') }};
    return ds.flatten();
  }

  it('should be able to merge mergable elements', function () {
    let flat0 = createFakeObject('ir.cpp', 10, 'abc');
    let flat1 = createFakeObject('test.cpp', 10, 'def');
    assert(flat0.canMerge(flat1));
  });

  describe('multiple FlatDiff merge tests', function () {
    let flat0, flat1;
    beforeEach(function () {
      flat0 = createFakeObject('ir.cpp', 10, 'abc');
      flat1 = createFakeObject('test.cpp', 10, 'def');

    });

    it('should merge multiple elements', function () {
      assert(flat0.merge(flat1));
      assert(flat0.additions.value == 2 && flat0.deletions.value == 2);
      assert(flat0.file.length == 2 && flat0.sha.length == 2);
    });

    it('should merge multiple elements with same time, sha, and type', function () {
      flat1._sha = new Set(['abc']);
      assert(flat0.merge(flat1));
      assert(flat0.additions.value == 2 && flat0.deletions.value == 2);
      assert(flat0.file.length == 2 && flat0.sha.length == 1);
    });

    it('should merge a third element', function () {
      assert(flat0.merge(flat1));
      let flat2 = createFakeObject('array.hpp', 10, 'hgi');
      assert(flat0.merge(flat2));
      assert(flat0.additions.value == 3 && flat0.deletions.value == 3);
      assert(flat0.file.length == 3 && flat0.sha.length == 3);
    });

    it('should not merge an element with differing date', function () {
      assert(flat0.merge(flat1));
      let flat2 = createFakeObject('array.hpp', 11);
      assert(!flat0.merge(flat2));
    });

    it('should not merge an element with differing classification', function () {
      assert(flat0.merge(flat1));
      let flat2 = createFakeObject('array.js', 10);
      assert(!flat0.merge(flat2));
    });
  });

  it('should not be able to merge elements with differing dates', function () {
    let flat0 = createFakeObject('ir.cpp', 11);
    let flat1 = createFakeObject('test.cpp', 10);
    assert(!flat0.canMerge(flat1));
  });

  it('should not be able to merge elements with differing classification', function () {
    let flat0 = createFakeObject('ir.js', 10);
    let flat1 = createFakeObject('test.cpp', 10);
    assert(!flat0.canMerge(flat1));
  });

  it('should not be able to merge elements with differing classification and date', function () {
    let flat0 = createFakeObject('ir.js', 11);
    let flat1 = createFakeObject('test.cpp', 10);
    assert(!flat0.canMerge(flat1));
  });
});
