'use strict';

const _ = require('lodash');
const util = require('util');

const Constants = require('./constants');
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
    return this;
  }

  round() {
    this._value = Math.round(this.value);
    return this;
  }

  floor() {
    this._value = Math.floor(this.value);
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
    this.mergeCriteria = 'language';

    if (diff instanceof FileDiff.FileDiff) {
      this._root = diff.commit.repo.dir;
      this._sha = [diff.commit.sha];
      this._file = [diff.file];

      /* mutable members */
      this.additions = new ScalableNumber(diff.additions);
      this.deletions = new ScalableNumber(diff.deletions);
      this.date = new ScalableNumber(diff.commit.date.valueOf());
    } else {
      console.log('constructing FlatDiff from nothing!');
    }
  }

  canMerge(flatDiff) {
    if (this.date.value != flatDiff.date.value) { return false; }

    const getClassifications = (files) => {
      return files.map((f) => f.classification[this.mergeCriteria])
        .reduce((a, f) => a.add(f), new Set());
    };

    let ourClassifications = getClassifications(this.file);
    let theirClassifications = getClassifications(flatDiff.file);

    if (ourClassifications.values().length > 1) {
      console.log('too many items in flatdiff: ' + this);
      console.log(ourClassifications);
    }

    if (theirClassifications.values().length > 1) {
      console.log('too many items in flatdiff: ' + flatDiff);
      console.log(theirClassifications);
    }

    return _.isEqual(ourClassifications, theirClassifications);
  }

  merge(flatDiff) {
    if (this.canMerge(flatDiff)) {
      this.additions.translate(flatDiff.additions.value);
      this.deletions.translate(flatDiff.deletions.value);
      this._sha = this._sha.concat(flatDiff.sha);
      this._file = this._file.concat(flatDiff.file);
      return true;
    } else {
      return false;
    }
  }
}
module.exports.FlatDiff = FlatDiff;
