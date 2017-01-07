'use strict';

const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const util = require('util');
const shell = require('shelljs');

const {Operation,OperationQueue} = require('../adjustable-operation-queue');
const FileRef = require('./file-ref').FileRef;

const parallelism = 2;

function arr(output) {
  return _(output.split('\n'))
    .map((i) => i.trim())
    .filter((i) => i.length > 0)
    .value();
};

class FileDiff {
  get additions() { return this._add; }
  get deletions() { return this._del; }
  get file() { return this._file; }
  get commit() { return this._commit; }

  constructor(diffstat, commit) {
    const d = diffstat.replace(/\s+/g, ' ').trim().split(' ');
    this._add = Number.parseInt(d[0]);
    this._del = Number.parseInt(d[1]);
    this._file = new FileRef(d[2]);
    this._commit = commit;
  }

  toString(){
    return `FileDiff: (${this.file.path}: ${this.additions}+ ${this.deletions}-)`;
  };
}
module.exports.FileDiff = FileDiff;

class Commit {
  get sha() { return this._sha; }
  get date() { return this._date; }
  get fileDiffs() { return this._fileDiffs; }
  get additions() { return this._add; }
  get deletions() { return this._del; }
  get repo() { return this._repo; }

  constructor(sha, date, commitstat, repo) {
    this._sha = sha;
    this._date = new Date(date);
    this._fileDiffs = new Array();
    this._add = 0;
    this._del = 0;
    this._repo = repo;
    if (Array.isArray(commitstat)) {
      this._scan(commitstat);
    } else {
      /* just give up */
      console.log(`commitstat not an array:\n${commitstat}`);
      process.exit(1);
    }
  }

  /* where commitStats is an array of commit info */
  _scan(commitstats) {
    for (let stat of commitstats) {
      let filediff = new FileDiff(stat, this.sha, this);
      if (filediff.additions > 0 || filediff.deletions > 0) {
        this. _fileDiffs. push (filediff);
        this. _add += filediff. additions;
        this. _del += filediff. deletions;
      }
    }
  }

  toString() {
    return this._fileDiffs.map((d) => d.toString()).join('\n');
  }
}

class Repo {
  get dir() { return this._dir; }
  get commits() { return this._commits; }
  get additions() { return this._add; }
  get deletions() { return this._del; }

  constructor(dir) {
    this._commits = new Array();
    this._add = 0;
    this._del = 0;
    this._dir = new FileRef(dir);
  }

  scan() {
    let dir = this.dir.path;
    let gitCommand = shell.exec(`git -C ${dir} log --author Hershal --format='%H' --no-merges`,
                                {silent: true});
    let commitLines = arr(gitCommand.stdout);

    let queue = new OperationQueue(parallelism);

    for (let line of commitLines) {
      queue.addOperation(new Operation((done) => {
        const sha = line;
        shell
          .exec(`git -C ${dir} show -w --numstat --diff-filter=ADMR ${sha} --date=iso-strict --format='%ad'`,
                { silent: true },
                (code, stdout, stderr) => {
                  /* This complexity arises because git cannot format the
                   * numstat lines for me, thus I have to build this ugliness
                   * to understand the info that git is giving me. */
                  let commitStat = arr(stdout);
                  const date = commitStat.shift();
                  const commit = new Commit(sha, date, commitStat, this);
                  this._commits.push(commit);
                  this._add += commit.additions;
                  this._del += commit.deletions;
                  /* console.log(`finished ${dir} ${sha}`); */
                  done();
                });
      }));
    }
    return queue.start();
  }

  toString() {
    return util.inspect(this, {depth: null, maxArrayLength: null});
  }
}
module.exports.Repo = Repo;

class Scanner {
  get repos() { return this._repos; }

  constructor() {
    this._repos = new Array();
  }

  scan(dir) {
    let dirs = fs.readdirSync(dir)
        .map((file => path.join(dir, file)))
        .filter((file) => fs.statSync(file).isDirectory());

    let queue = new OperationQueue(parallelism);

    dirs.forEach((d) => {
      queue.addOperation(new Operation((done) => {
        console.log(`starting ${d}`);
        let repo = new Repo(d);
        this._repos.push(repo);
        repo.scan()
          .then(() => {
            console.log(`finished ${d}`);
            done();
          });
      }));
    });

    return queue.start();
  }
}
module.exports.Scanner = Scanner;
