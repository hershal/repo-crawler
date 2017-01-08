'use strict';

const _ = require('lodash');

function render(repos) {
  const rows = generateRows(repos);
  let str = rows.map((r) => r.join(',')).join('\n');
  return str;
}
module.exports.render = render;

function generateRows(repos) {
  /* oh god */
  let rows = [];
  for (let repo of repos) {
    for (let commit of repo.commits) {
      let date = commit.date;
      let sha = commit.sha;
      for (let diff of commit.fileDiffs) {
        if (!diff.file.classification) { continue; }
        let row = [];
        row.push(date.valueOf());
        row.push(date.toString());
        row.push(sha);
        row.push(repo.dir.name);
        row.push(diff.additions);
        row.push(diff.deletions);
        row.push(diff.additions + diff.deletions);
        row.push(diff.file.path);
        row.push(diff.file.classification.language);
        row.push(diff.file.classification.category);
        rows.push(row);
      }
    }
  }
  return rows;
}
