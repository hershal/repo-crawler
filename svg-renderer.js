'use strict';

const beautify = require('js-beautify').html;
const util = require('util');

function render(width, height, objs) {
  let str = `<svg viewBox="0 0 ${width} ${height}">\n`;
  const rx = 5;

  str += objs.map((o) => {
    const y = o.y.linearInterpolated(0, 1.0, rx, height-rx).value;
    const x = o.x.linearInterpolated(0, 1.0, rx, width-rx).value;
    return `  <circle cx="${x}" cy="${y}" r="${rx}"/>`;
  }).join('\n');
  str += '\n</svg>\n';
  return str;
}

module.exports.render = render;
