'use strict';

const _ = require('lodash');

const Constants = require('./constants.json');

module.exports = {
  merge: function (flatDiffs) {
    return _(flatDiffs.slice(0))
      .groupBy((d) => d.date.value)
      .map((diffs, time) => {
        return diffs.reduce((a, d) => {
          for (let ad of a) {
            if (ad.merge(d)) { return a; }
          }
          a.push(d);
          return a;
        }, new Array());
      })
      .value();
  },

  scaleDates: function (flatDiffs) {
    flatDiffs = flatDiffs.slice(0);

    const minDate = flatDiffs.reduce(
      (a, d) => a > d.date.value ? d.date.value : a, Number.MAX_SAFE_INTEGER);

    flatDiffs
      .forEach((d) => d.date
               .translate(-minDate)
               .scale(1.0/Constants.msPerDay)
               .floor());
    return flatDiffs;
  }
};
