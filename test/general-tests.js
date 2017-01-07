'use strict';

const _ = require('lodash');

const assert = require('power-assert');
const fs = require('fs');
const path = require('path');
const util = require('util');

const CSVRender = require('../csv-renderer');
const FileDiff = require('../repo').FileDiff;
const FileRef = require('../file-ref').FileRef;
const Repo = require('../repo').Repo;
const Scanner = require('../repo').Scanner;

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


describe('Scanner Categorization Tests', function () {
  let repo;

  beforeEach('should create a repo object', function(done) {
    this.timeout(4000);
    let dir = '../hershal.com';
    repo = new Repo(dir);
    repo.scan().then(() => {
      assert(repo.additions > 0 && repo.deletions > 0);
      done();
    });
  });

  it('should have known classification' , function () {
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
    .map((c) => c.fileDiffs.filter((d) => !d.file.classification || !d.file.classification.category))
    .filter((c) => c.length > 0)
    .reduce((a, c) => a.concat(c), new Array())
    .reduce((a, d) => a.add(d.file.extension), new Set());
}
