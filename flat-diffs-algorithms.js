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
        let d = diffs.reduce((a, d) => {
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

        /* keep the time labels in the mapped array */
        let obj = new Object(null);
        obj[time] = d;
        return obj;
      })
      .value();
  },
  scaledDates: function (flatDiffs) {
    const minDate = flatDiffs.reduce(
      (a, d) => a > d.date.value ? d.date.value : a, Number.MAX_SAFE_INTEGER);
    return flatDiffs.map(
      (d) => d.scaledDate(
        (d) => d
          .translated(-minDate)
          .scaled(1.0/Constants.msPerDay)
          .floored())
    );
  }
};
