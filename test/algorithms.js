'use strict';

const _ = require('lodash');
const fs = require('fs');
const util = require('util');

const Scanner = require('../repo').Scanner;
const FlatDiffsAlgorithms = require('../flat-diffs-algorithms');
const FlatDiff = require('../flat-diff').FlatDiff;
const Utils = require('../utils');

describe('Algorithms', function () {
  let flatDiffs, beforeStats;

  beforeEach(function () {
    flatDiffs = JSON.parse(fs.readFileSync(__dirname + '/stats.json').toString())
      .map((j) => FlatDiff.fromJSON(j));
    beforeStats = calculateStats();
  });

  for (let i of [1, 2, 3]) {
    it(`${i} std deviation(s)`, function () {
      flatDiffs = flatDiffs.filter((f) => {
        let changes = f.additions.value + f.deletions.value;
        return Math.abs(changes - beforeStats.mean) < beforeStats.standardDeviation * i;
      });
    });
  }

  afterEach(function () {
    console.log('before:  ' + formatStats(beforeStats));
    console.log('after:   ' + formatStats(calculateStats()));
  });

  function formatStats(stats) {
    let {mean, min, max, variance, standardDeviation} = stats;
    let str = '';
    str += `m: ${mean.toFixed(2)}  `;
    str += `mi: ${min.toFixed(2)}  `;
    str += `ma: ${max.toFixed(2)}  `;
    str += `v: ${variance.toFixed(2)}  `;
    str += `s: ${standardDeviation.toFixed(2)}`;
    return str;
  }

  function calculateStats() {
    const values = flatDiffs.map((c) => c.additions.value + c.deletions.value);
    const min = values.reduce((a, c) => Math.min(a, c), Number.MAX_SAFE_INTEGER);
    const max = values.reduce((a, c) => Math.max(a, c), 0);
    const mean = values.reduce((a, c) => a + c, 0) / values.length;
    const variance = values.reduce((a, c) => a + Math.pow(c - mean, 2), 0) / values.length;
    const standardDeviation = Math.sqrt(variance);
    return {mean, min, max, variance, standardDeviation};
  }
});
