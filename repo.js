'use strict';

const shell = require('shelljs');
const util = require('util');
const _ = require('lodash');
const {Operation,OperationQueue} = require('limitable-operation-queue');

const FileRef = require('./file-ref').FileRef;

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

  constructor(diffstat, commit) {
    const d = diffstat.replace(/\s+/g, ' ').trim().split(' ');
    this._add = Number.parseInt(d[0]);
    this._del = Number.parseInt(d[1]);
    this._file = new FileRef(d[2]);
    this._commit = commit;
  }

  toString(){
    return `FileDiff: (${this.filepath}: ${this.additions}+ ${this.deletions}-)`;
  };
}
module.exports.FileDiff = FileDiff;

class Commit {
  get sha() { return this._sha; }
  get date() { return this._date; }
  get fileDiffs() { return this._fileDiffs; }
  get additions() { return this._add; }
  get deletions() { return this._del; }

  constructor(sha, date, commitstat) {
    this._sha = sha;
    this._date = new Date(date);
    this._fileDiffs = new Array();
    this._add = 0;
    this._del = 0;
    if (Array.isArray(commitstat)) {
      this._traverse(commitstat);
    } else {
      /* just give up */
      console.log(`commitstat not an array:\n${commitstat}`);
      process.exit(1);
    }
  }

  /* where commitStats is an array of commit info */
  _traverse(commitstats) {
    for (let stat of commitstats) {
      let filediff = new FileDiff(stat, this.sha);
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
  get commits() { return this._commits; }
  get additions() { return this._add; }
  get deletions() { return this._del; }

  constructor() {
    this._commits = new Array();
    this._add = 0;
    this._del = 0;
  }

  traverse(dir) {
    if (Array.isArray(dir)) {
      return dir.forEach((d) => this._traverse(dir));
    } else {
      return this._traverse(dir);
    }
  }

  _traverse(dir) {
    let gitCommand = shell.exec(`git -C ${dir} log --author hershal --format='%H'`,
                                {silent: true});
    let commitLines = arr(gitCommand.stdout);

    let queue = new OperationQueue(10);

    for (let line of commitLines) {
      queue.addOperation(new Operation((done) => {
        const sha = line;
        shell
          .exec(`git -C ${dir} show -w --numstat --diff-filter=ADM ${sha} --date=iso-strict --format='%ad'`,
                { silent: true },
                (code, stdout, stderr) => {
                  /* This complexity arises because git cannot format the
                   * numstat lines for me, thus I have to build this ugliness
                   * to understand the info that git is giving me. */
                  let commitStat = arr(stdout);
                  const date = commitStat.shift();
                  commitStat.shift(); /* remove the newline */
                  const commit = new Commit(sha, date, commitStat);
                  this._commits.push(commit);
                  this._add += commit.additions;
                  this._del += commit.deletions;
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
