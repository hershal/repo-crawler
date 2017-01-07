'use strict';

const util = require('util');

const Constants = require('./constants.json');

function render(width, height, flatDiffs) {
  flatDiffs = flatDiffs.slice(0);

  let str = `<svg width="${width}px" height="${height}px">\n`;

  /* filter out the diffs which we could not categorize */
  flatDiffs = flatDiffs.filter((d) => d.file.classification);

  /* quantize to day */
  flatDiffs.forEach((d) => d.date.scale(1.0/Constants.msPerDay).round());

  /* sort */
  /* oldest commit is the first now */
  flatDiffs = flatDiffs.sort((a, b) => a.date.value - b.date.value );

  /* rescale */
  const dist = flatDiffs[0].date.value;
  flatDiffs.forEach((d) => d.date.translate(-dist));

  /* merge */
  flatDiffs = flatDiffs.reduce((a, d) => {
    let last = a[a.length-1];
    if (!last || !last.merge(d)) {
      a.push(d);
    }
    return a;
  }, new Array());

  flatDiffs.sort((a, b) => a.additions.value - b.additions.value).reverse();
  console.log(util.inspect(flatDiffs[0], {depth: null, maxArrayLength: null}));
  /* console.log(util.inspect(flatDiffs.map((d) => d.additions.value + d.deletions.value), {depth: null, maxArrayLength: null})); */

  str += '</svg>\n';
  return str;
}

module.exports.render = render;
