#!/usr/bin/env node
var DB = require('./db'),
    _ = require('underscore');

exports.exportData = function(opt, cb) {
  var fields = _.object(_.map(
    _.union(opt.keyPaths, opt.fieldPaths),
    function(item){return [item, 1];}
  ));

  var ret = {
    database: opt.database,
    collection: opt.collection,
    keyPaths: opt.keyPaths,
    fieldPaths: opt.fieldPaths
  };

  DB.connect(opt.database, opt.hostname, opt.port, function(err, db) {
    if (err) return cb(err);
    var collection = db.collection(opt.collection);
    collection.find({}, fields).toArray(function(err, docs) {
      if (err) return cb(err);
      ret.data = docs;
      cb(null, ret);
    });
  });
};