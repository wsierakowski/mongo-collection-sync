#!/usr/bin/env node
var ObjectId = require('mongodb').ObjectID,
    DB = require('./db'),
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

exports.importData = function(opt, cb) {
  var log = '';
  console.log('Starting import...', opt);
  DB.connect(opt.database, opt.hostname, opt.port, function(err, db) {
    if (err) return cb(err);
    var collection = db.collection(opt.collection);
    // todo set async loop
      var i = 0;
      var whereObj = {},
          setObj = {};

      opt.keyPaths.forEach(function(key) {
        whereObj[key] = key === '_id' ? new ObjectId(opt.data[i][key]) : opt.data[i][key];
      });

      opt.fieldPaths.forEach(function(field) {
        setObj[field] = opt.data[i][field];
      });

      collection.findOne(whereObj, function(err, doc) {
        if (err) cb(err);
        //console.log('2. where: ', whereObj, 'set: ', setObj, 'doc.hits: ', doc[0].hits);
        if (doc) {
          log += 'Found document for ' + whereObj.toString() + ', and it currently has these hits: ' + doc.hits + '\n';
        } else {
          log += 'Not found document for ' + whereObj.toString() + '.\n';
        }
        
        cb(null, log);
      });
      // collection.findAndModify(whereObj, null, {$set: setObj}, {new: false}, function(err, doc) {
      //   if (err) cb(err);

      // });
    
    
  });
};