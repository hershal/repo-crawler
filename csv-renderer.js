'use strict';

const _ = require('lodash');

function render(repos) {
  const rows = generateRows(repos);
  console.log(rows);;
}
module.exports.render = render;

function generateRows(repos) {
  /* oh god */
  let rows = new Array();
  for (let repo of repos) {
    for (let commit of repo.commits) {
      let date = commit.date;
      let sha = commit.sha;
      for (let diff of commit.fileDiffs) {
        let row = new Array();
        row.push(date.valueOf());
        row.push(date.toString());
        row.push(sha);
        row.push(diff.additions);
        row.push(diff.deletions);
        row.push(diff.additions + diff.deletions);
        row.push(diff.file.path);
        row.push(diff.file.classification ? diff.file.classification.category : 'unknown');
        row.push(diff.file.classification ? diff.file.classification.language : 'unknown');
        rows.push(row);
      }
    }
  }
  return rows;
}
