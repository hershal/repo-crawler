'use strict';

const _ = require('lodash');
const fs = require('fs');
const assert = require('power-assert');
const util = require('util');

const FlatDiffsAlgorithms = require('../flat-diffs-algorithms');
const FlatDiff = require('../flat-diff').FlatDiff;
const ScannerFlyweight = require('./scanner-flyweight').ScannerFlyweight;

const CSVRender = require('../csv-renderer');
const SVGRender = require('../svg-renderer');

const Utils = require('../utils');

describe('FlatDiffs Renderers', function () {
  let flatDiffs;

  beforeEach(function (done) {
    this.timeout(10000);
    flatDiffs = ScannerFlyweight.get().then((diffs) => {
      flatDiffs = diffs;
      done();
    });
  });

  it('should render to CSV', function () {
    this.timeout(10000);

    const scaled = FlatDiffsAlgorithms.scaledDates(flatDiffs);
    const merged = FlatDiffsAlgorithms.merged(scaled);
    const flattened = _.flatten(merged);

    let rendered = CSVRender.render(flattened);
    fs.writeFileSync('rendered-full.csv', rendered);
  });

  it('should render into svg', function () {
    this.timeout(10000);
    const scaled = FlatDiffsAlgorithms.scaledDates(flatDiffs);
    const merged = FlatDiffsAlgorithms.merged(scaled);
    const flattened = _.flatten(merged);
    const normalized = FlatDiffsAlgorithms.normalized(flattened);
    let rendered = _.mapValues(normalized, (v, k) => SVGRender.render(800, 600, v));

    /* console.log(util.inspect(_.groupBy(flattened, (el) => el.mergedCriteria)['Ruby'], {depth: null})); */

    let one = 'JavaScript';
    /* _.forIn(rendered, (v, k) => { */
    /*   fs.writeFileSync(`../../repos/hershal.com/about/skills/lang-${Utils.slugify(k)}.svg`, v); */
    /* }); */
  });

  it('render repo commits to CSV', function () {
    this.timeout(10000);
    const scaled = FlatDiffsAlgorithms.scaledDates(flatDiffs);
    const merged = FlatDiffsAlgorithms.merged(scaled);
    const flattened = _.flatten(merged);

    const rendered = CSVRender.render(flattened);
    fs.writeFileSync('rendered.csv', rendered);
  });

  it('should render SVG', function () {
    this.timeout(10000);

    const scaled = FlatDiffsAlgorithms.scaledDates(flatDiffs);
    const merged = FlatDiffsAlgorithms.merged(scaled);
    const flattened = _.flatten(merged);
    const trimmed = FlatDiffsAlgorithms.trimmed(flattened);
    const normalized = FlatDiffsAlgorithms.normalized(trimmed);

    /* console.log(normalized); */

    let rendered = _.mapValues(normalized, (v, k) => SVGRender.render(800, 600, v));

    let one = 'JavaScript';
    _.forIn(rendered, (v, k) => {
      fs.writeFileSync(`../../repos/hershal.com/about/skills/lang-${Utils.slugify(k)}.svg`, v);
    });
    /* fs.writeFileSync(`../../repos/hershal.com/about/skills/lang-${Utils.slugify(one)}.svg`, rendered[one]); */
  });
});
