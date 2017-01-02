'use strict';

const _ = require('lodash');

function render(commits) {
  const rows = generateRows(commits, 'file.classification.language');

  let str = '';
  for (let row of rows) {
    str += row.join(',') + '\n';
  }

  return str;
}
module.exports.render = render;

function generateRows(commits, keypath) {
  const uniqueKeys = unionCommitsByKeypath(commits, keypath);

  let rows = new Array();

  /* this is ugly */
  let firstline = commits.map((c) => c.date.valueOf());
  firstline.unshift(keypath);
  /* end ugliness */

  rows.push(firstline);

  for (let key of uniqueKeys) {
    let row = commits.map((c) => {
      return c.fileDiffs
        .filter((d) => _.get(d, keypath) == key)
        .reduce((a, d) => a + d.additions + d.deletions, 0);
    });
    row.unshift(key);
    rows.push(row);
  }

  return rows;
}

function unionCommitsByKeypath(commits, keypath) {
  return commits.reduce((ac, c) => {
    return _.union(ac, c.fileDiffs.reduce((ad, d) => {
      return _.union(ad, [_.get(d, keypath)]);
    }, new Array()));
  }, new Array());
}
