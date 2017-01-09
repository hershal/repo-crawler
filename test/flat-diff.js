'use strict';

const assert = require('power-assert');

const FileDiff = require('../repo').FileDiff;
const FileRef = require('../file-ref').FileRef;

describe('FlatDiff tests', function () {
  function createFakeObject(filepath, date, sha) {
    sha = sha ? sha : ['abc'];
    if (!Array.isArray(sha)) {
      sha = [sha];
    }
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
      const merged = flat0.merged(flat1);
      assert(merged != flat0);
      assert(merged.additions.value == 2 && merged.deletions.value == 2);
      assert(merged.file.length == 2 && merged.sha.length == 2);
    });

    it('should not touch the elements which merged', function () {
      /* didn't touch flat0 and flat1 */
      const merged = flat0.merged(flat1);

      assert(flat0.additions.value == 1 && flat0.deletions.value == 1);
      assert(flat0.file.length == 1 && flat0.sha.length == 1);
      assert(flat1.additions.value == 1 && flat1.deletions.value == 1);
      assert(flat1.file.length == 1 && flat1.sha.length == 1);
    });

    it('should merge multiple elements with same time, sha, and type', function () {
      flat1._sha = new Set(['abc']);
      const merged = flat0.merged(flat1);
      assert(merged);
      assert(merged.additions.value == 2 && merged.deletions.value == 2);
      assert(merged.file.length == 2 && merged.sha.length == 1);
    });

    it('should merge a third element', function () {
      const merged0 = flat0.merged(flat1);
      assert(merged0);
      let flat2 = createFakeObject('array.hpp', 10, 'hgi');
      console.log(merged0);
      let merged1 = merged0.merged(flat2);
      assert(merged1);
      assert(merged1.additions.value == 3 && merged1.deletions.value == 3);
      assert(merged1.file.length == 3 && merged1.sha.length == 3);
    });

    it('should not merge an element with differing date', function () {
      const merged0 = flat0.merged(flat1);
      assert(merged0);
      let flat2 = createFakeObject('array.hpp', 11);
      const merged1 = flat0.merged(flat2);
      assert(!merged1);
    });

    it('should not merge an element with differing classification', function () {
      let merged0 = flat0.merged(flat1);
      assert(merged0);
      let flat2 = createFakeObject('array.js', 10);
      let merged1 = flat0.merged(flat2);
      assert(!merged1);
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
