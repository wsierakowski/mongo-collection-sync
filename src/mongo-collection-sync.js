var ObjectId = require('mongodb').ObjectID,
    DB = require('./db'),
    _ = require('underscore');

exports.exportData = function(opt, cb) {

  // Get keyPaths and fieldPath keys as fields object:
  // {key1: 1, key2: 1} to return fields back from the db.
  var fields = _.object(_.map(
    _.union(opt.keyPaths, opt.fieldPaths),
    function(item){return [item, 1];}
  ));

  // Return object
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
  //console.log('Starting import...', opt);
  DB.connect(opt.database, opt.hostname, opt.port, function(err, db) {
    if (err) return cb(err);
    var collection = db.collection(opt.collection);

    var i = 0, totalErrors = 0, totalSuccess = 0, log = '';

    // Doing async by calling internal function with iterator
    updateRecord(i);

    function updateRecord(i) {
      // If iterator reached all elements finish by returning callback with log.
      if (i === opt.data.length) {
        log += '\n ** Completed ' + opt.data.length + ' records. ' + totalSuccess +
                ' record(s) updated and ' + totalErrors + ' record(s) not found.';
        return cb(null, log);
      }

      //console.log('updating record: ', i, ':', opt.data[i]);

      var whereObj = {},
          setObj = {};

      // Creating object for filtering and for setting new values by combining key or field paths
      // with the values from the input data array.
      opt.keyPaths.forEach(function(key) {
        // To prevent from the following error where ObjectId is invalid (non hex in example with letter outside of a-f)
        // Error: Argument passed in must be a single String of 12 bytes or a string of 24 hex characters
        var checkForHexRegExp = new RegExp("^[0-9a-fA-F]{24}$");
        if(!checkForHexRegExp.test(opt.data[i][key])) {
          return ('Invalid ObjectId ' + opt.data[i][key] + '.');
        }

        whereObj[key] = key === '_id' ? new ObjectId(opt.data[i][key]) : opt.data[i][key];
      });

      opt.fieldPaths.forEach(function(field) {
        setObj[field] = opt.data[i][field];
      });

      collection.findOneAndUpdate(whereObj, {$set: setObj}, function(err, doc) {
        if (err) cb(err);
        //console.log('2. where: ', whereObj, 'set: ', setObj, 'doc.hits: ', doc.value.hits);

        if (doc.value) {
          totalSuccess++;
          log += '[' + i + '] Document with key(s): ' + JSON.stringify(whereObj) + ' found and updated from: ' +
                  JSON.stringify(_.pick(doc.value, _.keys(setObj))) + ' to: ' + JSON.stringify(setObj) + '.\n';
        } else {
          totalErrors++;
          log += '[' + i + '] Error: Document with key(s): ' + JSON.stringify(whereObj) + ' not found.\n';
        }

        updateRecord(++i);
      });
    }
  });
};