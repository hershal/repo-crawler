'use strict';

const assert = require('power-assert');

const ScalableNumber = require('../scalable-number').ScalableNumber;

describe('ScalableNumber tests', function () {
  let number;
  let value = 10.0;

  beforeEach(function () {
    number = new ScalableNumber(value);
  });

  it('should have proper structures', function () {
    assert(number.value == value);
  });

  it('should scale a number', function () {
    assert(number.value == value);
    let scaled = number.scaled(0.5);
    assert(scaled.value == value * 0.5);
    assert(scaled.value != number.value);
  });

  it('should snap a number', function () {
    assert(number.value == value);
    let snapped = number.snapped(0.5);
    assert(snapped.value == value);

    const interval = 0.4;

    /* Addition causes roundoff errors which lead to an incorrect assertion even
     * though the numbers are *roughly* equal. Hence we use a multiplier. */
    let multiplier = 0;
    while (((multiplier + 1) * interval) < value) { multiplier++; }

    snapped = number.snapped(interval);
    assert(snapped.value == (interval * multiplier));
  });

  it('should round a number', function () {
    const interval = 1/6;
    let rounded = number.scaled(interval).rounded();
    assert(rounded.value != number.value);
    assert(rounded.value == Math.round(interval * value));
  });

  it('should floor a number', function () {
    const interval = 1/6;
    let floored = number.scaled(interval).floored();
    assert(floored.value != number.value);
    assert(floored.value == Math.floor(interval * value));
  });
});
