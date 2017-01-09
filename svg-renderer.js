'use strict';

const _ = require('lodash');
const util = require('util');

function render(width, height, flatDiffs) {

  let str = `<svg width="${width}px" height="${height}px">\n`;


  /* console.log(util.inspect(flatDiffs[0], {depth: null, maxArrayLength: null})); */
  /* console.log(util.inspect(flatDiffs.map((d) => { return {file: d.file, date: d.date}; }), */
                           /* {depth: null, maxArrayLength: null})); */
  /* console.log(util.inspect(flatDiffs, {depth: null, maxArrayLength: null})); */
  /* console.log(flatDiffs.length); */

  /* TODO: render */

  str += '</svg>\n';
  return str;
}

module.exports.render = render;
