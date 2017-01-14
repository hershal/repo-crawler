'use strict';

const _ = require('lodash');

const Constants = require('./constants.json');

module.exports = {
  merged: function (flatDiffs) {
    return _(flatDiffs)
    /* group by date */
      .groupBy((d) => d.date.value)
    /* map through the grouped values */
      .map((diffs, time) => {
        /* merge the mergable FlatDiffs */
        return diffs.reduce((a, d) => {
          /* find the index of a mergable diff to merge this diff into */
          for (let index in a) {
            let merged = a[index].merged(d);
            /* replace the mergeable diff element of the reduction array with
             * the merged diff and return */
            if (merged) { a[index] = merged; return a; }
          }
          /* if we couldn't merge, then push the new element on the reduction
           * array and return */
          a.push(d); return a;
        }, []);
      })
      .value();
  },
  scaledDates: function (flatDiffs) {
    const minDate = flatDiffs.reduce(
      (a, d) => a > d.date.value ? d.date.value : a, Number.MAX_SAFE_INTEGER);
    return flatDiffs.map(
      (d) => d.transformDate(
        (d) => d
          .translated(-minDate)
          .scaled(1.0/Constants.msPerDay)
          .floored())
    );
  },
  /* spits out key-value pairs in the form {'language': [{x, y, title, description}]} */
  normalized: function (flatDiffs) {
    const maxY = flatDiffs.reduce((a, f) =>
                                  Math.max(a, f.additions
                                           .translated(f.deletions)
                                           .value), 0);
    const minY = flatDiffs.reduce((a, f) =>
                                  Math.min(a, f.additions
                                           .translated(f.deletions)
                                           .value), Number.MAX_SAFE_INTEGER);

    const maxX = flatDiffs.reduce((a, f) => Math.max(a, f.date.value), 0);
    const minX = flatDiffs.reduce((a, f) => Math.min(a, f.date.value), Number.MAX_SAFE_INTEGER);

    let what = _(flatDiffs)
        .groupBy((el) => el.mergedCriteria)
        .mapValues((values, key) =>
                   _.map(values, (el) => {
                     /* create new objects */
                     return { x: el.date.linearInterpolated(minX, maxX, 0, 1.0),
                              y: (el.additions
                                  .translated(el.deletions)
                                  .linearInterpolated(minY, maxY, 0, 1.0)
                                  .inverted(1)),
                              title: ``,
                              description: `${el.sha} ${el.additions.value + el.deletions.value}` };
                   }))
        .value();
    return what;
  },
  /* removes diffs whose additions and deletions are three standard deviations
   * away from the mean */
  trimmed: function (flatDiffs) {
    const values = flatDiffs.map((c) => c.additions.value + c.deletions.value);
    const mean = values.reduce((a, c) => a + c, 0) / values.length;
    const vari = values.reduce((a, c) => a + Math.pow(c - mean, 2), 0) / values.length;
    const stdd = Math.sqrt(vari);
    return flatDiffs.filter((f) => {
      let changes = f.additions.value + f.deletions.value;
      return Math.abs(changes - mean) < stdd * 3;
    });
  }
};
