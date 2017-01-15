'use strict';

const _ = require('lodash');
const fs = require('fs');

const FlatDiff = require('../flat-diff').FlatDiff;
const Scanner = require('../repo').Scanner;

const statsFile = __dirname + '/stats.json';

class ScannerFlyweight {
  constructor() {
    this.flatDiffs = undefined;
  }

  get() {
    return new Promise((resolve, reject) => {
      if (this.flatDiffs) {
        resolve(this.flatDiffs);
      } else if (fs.existsSync(statsFile)) {
                this.flatDiffs = JSON
          .parse(fs.readFileSync(__dirname + '/stats.json') .toString())
          .map((j) => FlatDiff.fromJSON(j));
        resolve(this.flatDiffs);
      } else {
        const scanner = new Scanner();
        scanner.scan(process.env.HOME + '/repos/').then(() => {
          this.flatDiffs = _(scanner.repos)
            .map((r) => r.commits)
            .flatten()
            .map((c) => c.fileDiffs)
            .flatten()
            .filter((d) => d.file.classification != undefined)
            .map((d) => d.flatten())
            .value();
          fs.writeFileSync(statsFile, JSON.stringify(this.flatDiffs));
          resolve(this.flatDiffs);
        }).catch(() => {
          reject();
        });
      }
    });
  }
}
module.exports.ScannerFlyweight = new ScannerFlyweight();
