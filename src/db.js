exports.connect = function(dbname, hostname, port, cb) {
  var MongoClient = require('mongodb').MongoClient;

  hostname = hostname != null ? hostname : 'localhost';
  port = port != null ? port : 27017;

  var url = 'mongodb://' + hostname + ':' + port + '/' + dbname;
  
  MongoClient.connect(url, cb);
};