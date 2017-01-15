'use strict';

const _ = require('lodash');
const fs = require('fs');
const assert = require('power-assert');
const util = require('util');

const Scanner = require('../repo').Scanner;
const Repo = require('../repo').Repo;

const FlatDiffsAlgorithms = require('../flat-diffs-algorithms');
const FlatDiff = require('../flat-diff').FlatDiff;

describe('Scanner Categorization Tests', function () {
  let repo, flatDiffs;

  before('should create a repo object', function(done) {
    this.timeout(10000);
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
      assert(c.date >= date);
      date = c.date;
    });
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
    let merged = FlatDiffsAlgorithms.merged(scaled);
    /* assert(!_.isEqual(merged, flatDiffs)); */
    assert(!_.isEqual(merged, flatDiffs));
    assert(Object.keys(flatDiffs).length > 1);
    /* console.log(merged); */
    /* console.log(util.inspect(Object.keys(merged), {maxArrayLength: null})); */
    /* console.log(util.inspect(merged, {depth: null, maxArrayLength: null})); */
    /* console.log(merged.length); */
  });
});
