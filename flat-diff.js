'use strict';

const FileDiff = require('./repo');

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

  scale(fnOrNumber) {
    this._value = this._scale(fnOrNumber);
  }

  scaled(fnOrNumber) {
    return new ScalableNumber(this._scale(fnOrNumber));
  }

  _scale(fnOrNumber) {
    if (this.isFunction(fnOrNumber)) {
      return fnOrNumber(this.value);
    } else if (this.isNumber(fnOrNumber)) {
      return this.value * fnOrNumber;
    }

    console.log(`Could not rescale number ${this.value} by ${fnOrNumber}.`);
    return this.value;
  }
}
module.exports.ScalableNumber = ScalableNumber;


/* This class intentionally breaks the Law of Demeter. This is necesary to debug
 * the mathematical calculations I'm doing on the data later on. The alternative
 * is to carry around the FileDiff, Commit, and Repo baggage, but that makes it
 * harder to serialize the object (circular references, etc). Once the object is
 * flattened, we can forget about the rest of the world. */
class FlatDiff {
  get root() { return this._root; }
  get sha() { return this._sha; }
  get file() { return this._file; }

  constructor(diff) {
    if (diff instanceof FileDiff.FileDiff) {
      this._root = diff.commit.repo.dir;
      this._sha = diff.commit.sha;
      this._file = diff.file;

      /* mutable members */
      this.additions = new ScalableNumber(diff.additions);
      this.deletions = new ScalableNumber(diff.deletions);
      this.date = new ScalableNumber(diff.commit.date);
    }
  }
}
module.exports.FlatDiff = FlatDiff;
