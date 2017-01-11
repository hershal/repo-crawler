'use strict';

const _ = require('lodash');

function render(flatDiffs) {
  return flatDiffs.map((f) => [f.date.value,
                               f.additions.value + f.deletions.value,
                               f.additions.value, f.deletions.value,
                               f.mergedCriteria, f.root.name,
                               f.file.map((f) => f.path).join(' '),
                               f.sha.join(' ')]).join('\n');
}
module.exports.render = render;
