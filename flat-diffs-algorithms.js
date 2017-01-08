'use strict';

const _ = require('lodash');

const Constants = require('./constants.json');

module.exports = {
  merged: function (flatDiffs) {
    return _(flatDiffs)
      .groupBy((d) => d.date.value)
      .map((diffs, time) => {
        return diffs.reduce((a, d) => {
          for (let ad of a) {
            if (ad.merge(d)) { return a; }
          }
          a.push(d);
          return a;
        }, []);
      })
      .value();
  },
  scaledDates: function (flatDiffs) {
    const minDate = flatDiffs.reduce(
      (a, d) => a > d.date.value ? d.date.value : a, Number.MAX_SAFE_INTEGER);

    return flatDiffs.map((d) => {
      d.date = d.date
        .translated(-minDate)
        .scaled(1.0/Constants.msPerDay)
        .floored();
      return d;
    });
  }
};
