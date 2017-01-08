'use strict';

const _ = require('lodash');

const assert = require('power-assert');
const fs = require('fs');
const path = require('path');
const util = require('util');

const CSVRender = require('../csv-renderer');
const FileDiff = require('../repo').FileDiff;
const FileRef = require('../file-ref').FileRef;
const FlatDiff = require('../flat-diff').FlatDiff;
const Repo = require('../repo').Repo;
const ScalableNumber = require('../flat-diff').ScalableNumber;
const Scanner = require('../repo').Scanner;
const FlatDiffsAlgorithms = require('../flat-diffs-algorithms');

const SVGRender = require('../svg-renderer');

const {Operation,OperationQueue} = require('../../adjustable-operation-queue');

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
    assert(file.classification.category = 'web');
  });
});


describe('ScalableNumber tests', function () {
  let number;
  let value = 10.0;

  beforeEach(function () {
    number = new ScalableNumber(value);
  });

  it('should have proper structures', function () {
    assert(number.value == value);
  });

  it('should scale a number', function () {
    assert(number.value == value);
    let scaled = number.scaled(0.5);
    assert(scaled.value == value * 0.5);
    assert(scaled.value != number.value);
  });

  it('should snap a number', function () {
    assert(number.value == value);
    let snapped = number.snapped(0.5);
    assert(snapped.value == value);

    const interval = 0.4;

    /* Addition causes roundoff errors which lead to an incorrect assertion even
     * though the numbers are *roughly* equal. Hence we use a multiplier. */
    let multiplier = 0;
    while (((multiplier + 1) * interval) < value) { multiplier++; }

    snapped = number.snapped(interval);
    assert(snapped.value == (interval * multiplier));
  });

  it('should round a number', function () {
    const interval = 1/6;
    let rounded = number.scaled(interval).rounded();
    assert(rounded.value != number.value);
    assert(rounded.value == Math.round(interval * value));
  });

  it('should floor a number', function () {
    const interval = 1/6;
    let floored = number.scaled(interval).floored();
    assert(floored.value != number.value);
    assert(floored.value == Math.floor(interval * value));
  });
});


describe('FlatDiff tests', function () {
  function createFakeObject(filepath, date) {
    const singleLineDiffStat = '1        1      ' + filepath;
    const ds = new FileDiff(singleLineDiffStat);
    ds._commit = { sha: 'abc',
                   date: date,
                   repo: { dir: new FileRef('somewhere') }};
    return ds.flatten();
  }

  it('should be able to merge mergable elements', function () {
    let flat0 = createFakeObject('ir.cpp', 10);
    let flat1 = createFakeObject('test.cpp', 10);
    assert(flat0.canMerge(flat1));
  });

  describe('multiple FlatDiff merge tests', function () {
    let flat0, flat1;
    beforeEach(function () {
      flat0 = createFakeObject('ir.cpp', 10);
      flat1 = createFakeObject('test.cpp', 10);

    });

    it('should merge multiple elements', function () {
      assert(flat0.merge(flat1));
      assert(flat0.additions.value == 2 && flat0.deletions.value == 2);
      assert(flat0.file.length == 2 && flat0.sha.length == 2);
    });

    it('should merge a third element', function () {
      assert(flat0.merge(flat1));
      let flat2 = createFakeObject('array.hpp', 10);
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


describe('Scanner Categorization Tests', function () {
  let repo, flatDiffs;

  before('should create a repo object', function(done) {
    this.timeout(4000);
    let dir = '../hershal.com';
    repo = new Repo(dir);
    repo.scan().then(() => {
      assert(repo.additions > 0 && repo.deletions > 0);
      /* equivalent to a flatMap */
      flatDiffs = repo.commits
        .map((c) => c.fileDiffs.map((d) => d.flatten()))
        .reduce((a, c) => a.concat(c), []);
      done();
    });
  });

  it('should have all relevant properties' , function () {
    assert(repo.commits.length > 0);
    repo.commits.forEach((c) => {
      assert(c.date > 0);
      assert(c.sha.length == 40);
      assert(c.repo);
      c.fileDiffs.forEach((d) => {
        assert(!isNaN(d.additions) && d.additions >= 0);
        assert(!isNaN(d.deletions) && d.deletions >= 0);
        assert(d.file.classification);
        assert(d.file.classification.language);
        assert(d.file.classification.category);
        assert(d.commit);
      });
    });
  });

  it('repo commits sorted by date', function () {
    const sorted = _.sortBy(repo.commits, 'date');
    let date = 0;
    sorted.forEach(function (c) {
      assert(c.date > date);
      date = c.date;
    });
  });

  it('put repo commits in buckets', function () {
    const rendered = CSVRender.render([repo]);
    fs.writeFileSync('rendered.csv', rendered);
  });

  it('should flatten FileDiffs into FlatDiffs', function () {
    assert(flatDiffs.length > 0);
    flatDiffs.forEach((d) => {
      assert(d.root);
      assert(d.sha);
      assert(d.file);
      assert(d.additions);
      assert(d.deletions);
      assert(d.date);
    });
  });

  it('should merge cleanly', function () {
    let scaled = FlatDiffsAlgorithms.scaledDates(flatDiffs);
    let what = FlatDiffsAlgorithms.merged(scaled);
    /* console.log(util.inspect(what, {depth: null, maxArrayLength: null})); */
    /* console.log(what.length); */
  });

  it('should render into svg', function () {
    /* let diffs = FlatDiffsAlgorithms.merge(flatDiffs); */
    /* let rendered = SVGRender.render(800, 600, diffs); */
    /* console.log(rendered); */
  });
});

describe('Scanning Directory Full of Repos', function () {
  let scanner;
  before(function (done) {
    this.timeout(36000);
    scanner = new Scanner();
    scanner.scan(process.env.HOME + '/tmp/repos/').then(() => done());
  });

  it('should scan a whole dir of repos', function () {
    assert(scanner.repos.length > 0);
  });

  it('should render repos', function () {
    let rendered = CSVRender.render(scanner.repos);
    fs.writeFileSync('rendered-tmp.csv', rendered);
  });

});

function unknownFileTypesFromCommits(commits) {
  return commits
    .map((c) => c.fileDiffs.filter((d) => !d.file.classification
                                   || !d.file.classification.category))
    .filter((c) => c.length > 0)
    .reduce((a, c) => a.concat(c), [])
    .reduce((a, d) => a.add(d.file.extension), new Set());
}
