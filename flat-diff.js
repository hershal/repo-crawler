'use strict';

const _ = require('lodash');
const util = require('util');

const Constants = require('./constants');
const FileDiff = require('./repo');
const ScalableNumber = require('./scalable-number').ScalableNumber;

/* This class intentionally breaks the Law of Demeter. This is necesary to debug
 * the mathematical calculations I'm doing on the data later on. The alternative
 * is to carry around the FileDiff, Commit, and Repo baggage, but that makes it
 * harder to serialize the object (circular references, etc). Once the object is
 * flattened, we can forget about the rest of the world. */
class FlatDiff {
  get root() { return this._root; }
  get sha() { return this._sha; }
  get file() { return this._file; }
  get additions() { return this._add; }
  get deletions() { return this._del; }

  constructor(diff) {
    this.mergeCriteria = 'language';

    if (diff instanceof FileDiff.FileDiff) {
      this._root = diff.commit.repo.dir;
      this._sha = [diff.commit.sha];
      this._file = [diff.file];

      /* mutable members */
      this._add = new ScalableNumber(diff.additions);
      this._del = new ScalableNumber(diff.deletions);
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
      this._add = this.additions.translated(flatDiff.additions.value);
      this._del = this.deletions.translated(flatDiff.deletions.value);
      this._sha = this._sha.concat(flatDiff.sha);

      /* Make sure we don't have duplicates by extracting the first element of
       * each group of unique paths. FileRef guarantees that its derived data is
       * the same as another FileRef as long as the path it represents is the
       * same. */
      this._file = _(this.file.concat(flatDiff.file))
        .groupBy((f) => f.path)
        .reduce((a, f) => a.concat(f[0]), []);

      return true;
    } else {
      return false;
    }
  }
}
module.exports.FlatDiff = FlatDiff;
