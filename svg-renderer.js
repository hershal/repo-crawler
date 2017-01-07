'use strict';

const util = require('util');

const Constants = require('./constants.json');

function render(width, height, flatDiffs) {
  flatDiffs = flatDiffs.slice(0);

  let str = `<svg width="${width}px" height="${height}px">\n`;

  /* filter out the diffs which we could not categorize */
  flatDiffs = flatDiffs.filter((d) => d.file.reduce((a, f) => f.classification ? true : false), false);

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

  flatDiffs.sort((a, b) => a.date - b.date).reverse();
  /* console.log(util.inspect(flatDiffs[0], {depth: null, maxArrayLength: null})); */
  /* console.log(util.inspect(flatDiffs.map((d) => { return {file: d.file, date: d.date}; }), */
                           /* {depth: null, maxArrayLength: null})); */
  /* console.log(util.inspect(flatDiffs, {depth: null, maxArrayLength: null})); */
  /* console.log(flatDiffs.length); */

  str += '</svg>\n';
  return str;
}

module.exports.render = render;
