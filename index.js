'use strict';

const _ = require('lodash');
const shell = require('shelljs');
const util = require('util');

function arr(output) {
  return _(output.split('\n'))
    .map((i) => i.trim())
    .filter((i) => i.length > 0)
    .value();
};

class FileDiff {
  get additions() { return this._add; }
  get deletions() { return this._del; }
  get filename() { return this._filepath.split('/').slice(-1).pop(); }
  get filepath() { return this._filepath; }

  constructor(diffstat) {
    const d = diffstat.replace(/\s+/g, ' ').trim().split(' ');
    this._add = d[0];
    this._del = d[1];
    this._filepath = d[2];
  }

  toString(){
    return `FileDiff: (${this.filepath}: ${this.additions}+ ${this.deletions}-)`;
  };
}
module.exports.FileDiff = FileDiff;

class Commit {
  constructor(sha, commitstat) {
    this._sha = sha;
    this._fileDiffs = new Array();
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
      this._fileDiffs.push(new FileDiff(stat));
    }
  }

  toString() {
    return this._fileDiffs.map((d) => d.toString()).join('\n');
  }
}

class Repo {
  get commits() { return this._commits; }

  constructor() {
    this._commits = new Array();
  }

  traverse(dir, callback) {
    let shas = arr(shell.exec(`git -C ${dir} log --author hershal --format='%H'`, {silent: true}));
    for (let sha of shas) {
      shell
        .exec(`git -C ${dir} diff-tree -w --numstat --diff-filter=ADM ${sha}`,
              { silent: true },
              (code, stdout, stderr) => {
                let commitStat = arr(stdout);
                const sha = commitStat.shift();
                const commit = new Commit(sha, commitStat);
                this._commits.push(commit);
                if (this._commits.length == shas.length) {
                  !callback || callback();
                }
              });
    }
  }

  toString() {
    return util.inspect(this, {depth: null, maxArrayLength: null});
  }
}

const dir = process.argv[2];
let repo = new Repo();
repo.traverse(dir, () => console.log(repo.toString()));
