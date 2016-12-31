'use strict';

const _ = require('lodash');
const Repo = require('./repo').Repo;

const dir = process.argv[2];
let repo = new Repo();
repo.traverse(dir)
  .then(function () {
    console.log(repo.toString());
  });
