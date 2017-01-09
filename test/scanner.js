'use strict';

const _ = require('lodash');
const fs = require('fs');
const assert = require('power-assert');
const util = require('util');

const Scanner = require('../repo').Scanner;
const Repo = require('../repo').Repo;

const FlatDiffsAlgorithms = require('../flat-diffs-algorithms');

const CSVRender = require('../csv-renderer');
const SVGRender = require('../svg-renderer');

const Utils = require('../utils');

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
    let merged = FlatDiffsAlgorithms.merged(scaled);
    /* assert(!_.isEqual(merged, flatDiffs)); */
    assert(!_.isEqual(merged, flatDiffs));
    assert(Object.keys(flatDiffs).length > 1);
    /* console.log(merged); */
    /* console.log(util.inspect(Object.keys(merged), {maxArrayLength: null})); */
    /* console.log(util.inspect(merged, {depth: null, maxArrayLength: null})); */
    /* console.log(merged.length); */
  });

  it('should render into svg', function () {
    let scaled = FlatDiffsAlgorithms.scaledDates(flatDiffs);
    let merged = FlatDiffsAlgorithms.merged(scaled);

    /* console.log(util.inspect(merged, {depth: null, maxArrayLength: null})); */

    let what = _(merged)
        .flatten()
        .groupBy((el) => el.mergedCriteria)
        .mapValues((values, key) =>
                   _.map(values, (el) => {
                     /* create new objects */
                     return { x: el.date.value,
                              y: (el.additions.value + el.deletions.value),
                              title: ``,
                              description: `${el.sha}` };
                   }))
        .value();

    let rendered = _.mapValues(what, (v, k) => SVGRender.render(800, 600, v));

    console.log(Object.values(rendered)[0]);

    _.forIn(rendered, (v, k) => {
      fs.writeFileSync(`lang-${Utils.slugify(k)}.svg`, v);
    });
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
