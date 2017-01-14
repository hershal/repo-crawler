'use strict';

const _ = require('lodash');
const util = require('util');

const Constants = require('./constants');
const FileDiff = require('./repo');
const FileRef = require('./file-ref');
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
  get date() { return this._date; }
  get additions() { return this._add; }
  get deletions() { return this._del; }

  constructor(diffOrRoot, sha, file, date, add, del) {
    if (diffOrRoot instanceof FileDiff.FileDiff) {
      const diff = diffOrRoot;
      this._root = diff.commit.repo.dir;
      this._sha = _.uniq(_.flatten([diff.commit.sha]));
      this._file = _.flatten([diff.file]);

      /* mutable members */
      this._add = new ScalableNumber(diff.additions);
      this._del = new ScalableNumber(diff.deletions);
      this._date = new ScalableNumber(diff.commit.date.valueOf());
    } else if (diffOrRoot instanceof FileRef.FileRef) {
      if (Array.isArray(sha)) {
        this._sha = _.uniq(sha);
      } else if (typeof sha == 'string') {
        this._sha = [sha];
      } else {
        /* assume it's a Set; I couldn't google for this effectively */
        this._sha = sha;
      }
      this._root = diffOrRoot;
      this._file = file;
      this._add = this._toScalableNumber(add);
      this._del = this._toScalableNumber(del);
      this._date = this._toScalableNumber(date);
    } else {
      console.log('constructing FlatDiff from nothing!');
    }

    this.mergeCriteria = 'language';
    this.mergedCriteria = this.file[0].classification[this.mergeCriteria];
  }

  _toScalableNumber(a) {
    if (a instanceof ScalableNumber || !isNaN(a.value)) {
      return a;
    } else {
      return new ScalableNumber(a);
    }
  }

  static fromJSON(json) {
    return new FlatDiff(FileRef.FileRef.fromJSON(json._root),
                        json._sha,
                        json._file.map((f) => FileRef.FileRef.fromJSON(f)),
                        json._date._value, json._add._value, json._del._value);
  }

  canMerge(flatDiff) {
    if (this._date.value != flatDiff.date.value) { return false; }

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

  transformDate(fn) {
    return new FlatDiff(this.root, this.sha, this.file,
                        fn(this.date),
                        this.additions, this.deletions);
  }

  merged(flatDiff) {
    if (this.canMerge(flatDiff)) {
      let add = this.additions.translated(flatDiff.additions.value);
      let del = this.deletions.translated(flatDiff.deletions.value);
      let sha = this.sha.concat(flatDiff.sha);

      /* Make sure we don't have duplicates by extracting the first element of
       * each group of unique paths. FileRef guarantees that its derived data is
       * the same as another FileRef as long as the path it represents is the
       * same. */
      let file = _(this.file.concat(flatDiff.file))
          .groupBy((f) => f.path)
          .reduce((a, f) => a.concat(f[0]), []);

      let date = this._date;

      return new FlatDiff(this.root, sha, file, date, add, del);
    } else {
      return undefined;
    }
  }
}
module.exports.FlatDiff = FlatDiff;
