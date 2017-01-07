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
    if (this.isFunction(fnOrNumber)) {
      this._value = fnOrNumber(this.value);
    } else if (this.isNumber(fnOrNumber)) {
      this._value = this.value * fnOrNumber;
    } else {
      console.log(`Could not rescale number ${this.value} by ${fnOrNumber}.`);
    }

    return this;
  }

  translate(num) {
    this._value = this.value + num;
  }

  round() {
    this._value = Math.round(this.value);
    return this;
  }

  /* Snap to the lowest value within a the next highest and next lowest multiple
   * of the interval. */
  snap(interval) {
    this._value -= this._value % interval;
    return this;
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
    this.mergeClassificationCriteria = 'language';

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

  canMerge(flatDiff) {

  }

  merge(flatDiff) {
    if (this.canMerge(flatDiff)) {
      this.additions.translate(flatDiff.additions.value);
      this.deletions.translate(flatDiff.deletions.value);
      this._sha = `${this.sha} + ${flatDiff.sha}`;

      if (Array.isArray(this.file)) {
        this._file.push(flatDiff.file);
      } else {
        let file = new Array();
        file.push(this._file);
        file.push(flatDiff.file);
        this._file = file;
      }
      return true;
    } else {
      return false;
    }
  }
}
module.exports.FlatDiff = FlatDiff;
