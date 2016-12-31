'use strict';

const shell = require('shelljs');
const util = require('util');
const _ = require('lodash');

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

  constructor(diffstat) {
    const d = diffstat.replace(/\s+/g, ' ').trim().split(' ');
    this._add = Number.parseInt(d[0]);
    this._del = Number.parseInt(d[1]);
    this._file = new FileRef(d[2]);
  }

  toString(){
    return `FileDiff: (${this.filepath}: ${this.additions}+ ${this.deletions}-)`;
  };
}
module.exports.FileDiff = FileDiff;

class Commit {
  get sha() { return this._sha; }
  get fileDiffs() { return this._fileDiffs; }
  get additions() { return this._add; }
  get deletions() { return this._del; }

  constructor(sha, commitstat) {
    this._sha = sha;
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
      let filediff = new FileDiff(stat);
      this._fileDiffs.push(filediff);
      this._add += filediff.additions;
      this._del += filediff.deletions;
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

  constructor(dir) {
    this._commits = new Array();
    this._add = 0;
    this._del = 0;
    this._dir = dir;
  }

  traverse() {
    let gitCommand = shell.exec(`git -C ${this._dir} log --author hershal --format='%H'`, {silent: true});
    let shas = arr(gitCommand.stdout);
    let promises = new Array();
    for (let sha of shas) {
      promises.push(new Promise(
        (resolve, reject) => {
        shell
          .exec(`git -C ${this._dir} diff-tree -w --numstat --diff-filter=ADM ${sha}`,
                { silent: true },
                (code, stdout, stderr) => {
                  let commitStat = arr(stdout);
                  const sha = commitStat.shift();
                  const commit = new Commit(sha, commitStat);
                  this._commits.push(commit);
                  this._add += commit.additions;
                  this._del += commit.deletions;
                  resolve();
                });
        }
      ));
    }
    return Promise.all(promises);
  }

  toString() {
    return util.inspect(this, {depth: null, maxArrayLength: null});
  }
}
module.exports.Repo = Repo;
