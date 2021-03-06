'use strict';

/* Objects model behaviors, not data */
class ScalableNumber {
  get value() { return this._value; }

  constructor(value) {
    this._value = value;
  }

  isFunction(fn) {
    var getType = {};
    return fn && getType.toString.call(fn) === '[object Function]';
  }

  isNumber(a) {
    return typeof(a) == 'number';
  }

  scaled(fnOrNumber) {
    if (this.isFunction(fnOrNumber)) {
      return new ScalableNumber(fnOrNumber(this.value));
    } else if (this.isNumber(fnOrNumber)) {
      return new ScalableNumber(this.value * fnOrNumber);
    } else {
      console.log(`Could not rescale number ${this.value} by ${fnOrNumber}.`);
      return new ScalableNumber(this.value);
    }
  }

  translated(num) {
    num = num.value != undefined ? num.value : num;
    return new ScalableNumber(this.value + num);
  }

  rounded() {
    return new ScalableNumber(Math.round(this.value));
  }

  floored() {
    return new ScalableNumber(Math.floor(this.value));
  }

  /* Snap to the lowest value within a the next highest and next lowest multiple
   * of the interval. */
  snapped(interval) {
    return new ScalableNumber(this.value - this.value % interval);
  }

  linearInterpolated(xMin, xMax, yMin, yMax) {
    const x = this.value;
    if (x > xMax) { return yMax; }
    else if (x < xMin) { return yMin; }
    const interpolated = yMin + ((yMax - yMin)*(x - xMin))/((xMax - xMin));
    return new ScalableNumber(interpolated);
  }

  inverted(origin) {
    origin = origin ? origin : 0;
    origin = origin.value != undefined ? origin.value : origin;
    return new ScalableNumber(origin - this.value);
  }
}
module.exports.ScalableNumber = ScalableNumber;
