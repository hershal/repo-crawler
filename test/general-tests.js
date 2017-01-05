'use strict';

const _ = require('lodash');

const assert = require('power-assert');
const util = require('util');
const fs = require('fs');
const path = require('path');

const FileDiff = require('../repo').FileDiff;
const Repo = require('../repo').Repo;
const FileRef = require('../file-ref').FileRef;
const CSVRender = require('../csv-renderer');

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


describe('Repo Categorization Tests', function () {
  let repo;

  beforeEach('should create a repo object', function(done) {
    this.timeout(4000);
    let dir = '../hershal.com';
    repo = new Repo();
    repo.traverse(dir).then(() => {
      assert(repo.additions > 0 && repo.deletions > 0);
      done();
    });
  });

  it('should have known classification' , function () {
    assert(repo.commits.length > 0);
    repo.commits.forEach((c) => {
      assert(c.date > 0);
      assert(c.sha.length == 40);
      c.fileDiffs.forEach((d) => {
        assert(!isNaN(d.additions) && d.additions >= 0);
        assert(!isNaN(d.deletions) && d.deletions >= 0);
        assert(d.file.classification);
        assert(d.file.classification.language);
        assert(d.file.classification.category);
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
    const sorted = _.sortBy(repo.commits, 'date');
    const rendered = CSVRender.render(sorted);
    fs.writeFileSync('rendered.csv', rendered);
  });
});

describe('Repositories Directory Full Generation Tests', function () {
  let repo;
  let dirs;
  beforeEach(function () {
    let dir = '../';
    repo = new Repo();
    dirs = fs.readdirSync(dir)
      .map((file => path.join(dir, file)))
      .filter((file) => fs.statSync(file).isDirectory());
  });

  const i = 3;
  it(`should traverse all repos in dir with ${i} threads`, function (done) {
    this.timeout(360000);

    let queue = new OperationQueue(i);

    dirs.forEach((d) => {
      queue.addOperation(new Operation((done) => {
        /* console.log(`starting ${d}`); */
        repo.traverse(d)
          .then(() => {
            /* console.log(`finished ${d}`); */
            done();
          });
      }));
    });

    queue
      .start()
      .then(() => {
        const sorted = _.sortBy(repo.commits, 'date');
        const rendered = CSVRender.render(sorted);
        fs.writeFileSync('rendered-full.csv', rendered);
        done();
      });
  });
});
