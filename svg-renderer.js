'use strict';

const beautify = require('js-beautify').html;
const util = require('util');

function render(width, height, objs) {
  let str = `<svg viewBox="0 0 ${width} ${height}">\n`;
  str += objs.map((o) => `  <circle cx="${o.x}" cy="${o.y}" r="5"/>`).join('\n');
  str += '\n</svg>\n';
  return str;
}

module.exports.render = render;
