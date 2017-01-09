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
          for (let ad of a) {
            let merged = ad.merged(d);
            if (merged) { a.push(merged); return a; }
          }
          a.push(d);
          return a;
        }, []);
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
