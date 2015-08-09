#!/usr/bin/env node

var program = require('commander'),
    path = require('path'),
    pkg = require( path.join(__dirname, 'package.json') ),

    sync = require('./src/mongo-collection-sync.js');

function list(val) {
  return val.split(',');
}

program
  .version(pkg.version)
  .option('-h, --hostname [value]', 'MongoDB hostname, default localhost.')
  .option('-p, --port <n>', 'MongoDB port, default 27017.')
  .option('-i, --import', 'Import sync data.')
  .option('-e, --export', 'Export sync data.')
  .option('-d, --database [value]',
    'Database name. Required for export, optional for import (overrides import data value).')
  .option('-c, --collection [value]',
    'Collection name. Required for export, optional for import (overrides import data value).')
  .option('-k, --keys <items>',
    'List of key fields to reference data on import. Required for export, optional for import (overrides import feed value).', list)
  .option('-f, --fields <items>',
    'List of fields to export. Required for export, optional for import (overrides import feed value).', list)
  .on('--help', function() {
    console.log('  Examples:\n');
    console.log('    $ mongo-collection-sync --export --database sigman-pl --collection posts --keys _id --fields hits > out.json;');
    console.log('    $ mongo-collection-sync --export --database sigman-pl --collection posts --keys _id,slug --fields hits,title > out.json;');
    console.log('');
  })
  .parse(process.argv);

if (!program.import && !program.export || program.import && program.export) {
  console.log("error: are you going to import or export?");
  program.help();
  return process.exit(1);
}

if (program.import) {
  doImport();
} else if (program.export) {
  doExport();
}

//module.exports = require('./src/mongo-collection-sync');

function doImport() {

  // Source stdin
  var stdin = process.stdin,
      stdout = process.stdout,
      inputChunks = [],
      inputJoined, inputObj;

  stdin.setEncoding('utf8');
  stdin.resume();
  stdin.on('data', function(data) {
    inputChunks.push(data);
  });

  stdin.on('end', function() {
    inputJoined = inputChunks.join();
    inputObj = JSON.parse(inputJoined);
    parseInput(inputObj);
  });

  function parseInput(inputObj) {
    var input = {};
    
    if (!inputObj.database && !(program.database && program.database.length)) {
      console.log("error: database name is required for import.");
      program.help();
      return process.exit(1);
    }
    input.database = program.database || inputObj.database;

    if (!inputObj.collection && !(program.collection && program.collection.length)) {
      console.log("error: collection name is required for import.");
      program.help();
      return process.exit(1);
    }
    input.collection = program.collection || inputObj.collection;

    if (!inputObj.keyPaths && !(program.keys && program.keys.length)) {
      console.log("error: keys are required for import.");
      program.help();
      return process.exit(1);
    }
    input.keys = program.keys || inputObj.keyPaths;

    if (!inputObj.fieldPaths && !(program.fields && program.fields.length)) {
      console.log("error: fields are required for import.");
      program.help();
      return process.exit(1);
    }
    input.fields = program.fields || inputObj.fieldPaths;

    if (!inputObj.data) {
      console.log("error: missing the data in the input feed.");
      return process.exit(1);
    }
    input.data = inputObj.data;

    // validate if data has all keys and fields specified
    var keysTest = input.keys.every(function(ikey) {
      return input.data.every(function(dkey) {
        return dkey[ikey] !== undefined && dkey[ikey] !== null;
      });
    });

    if (!keysTest) {
      console.log("error: missing keys in the data in the input feed.");
      return process.exit(1);
    }

    var fieldsTest = input.fields.every(function(ifield) {
      return input.data.every(function(dfield) {
        return dfield[ifield] !== undefined && dfield[ifield] !== null;
      });
    });

    if (!fieldsTest) {
      console.log("error: missing fields in the data in the input feed.");
      return process.exit(1);
    }

    sync.importData({
      hostname: process.hostname,
      port: process.port,
      database: input.database,
      collection: input.collection,
      keyPaths: input.keys,
      fieldPaths: input.fields,
      data: input.data
    }, function(err, log){
      if (err) return console.log('DB error:', err);
      console.log(log);
      process.exit(0);
    });
  }

  // console.log('Starting exporting process for database "%s" for collection "%s" for the key values: "%s" and export fields: "%s".',
  //  program.database, program.collection, program.keys.join(', '), program.fields.join(', '));
}

function doExport() {
  if (!program.database && !program.database.length) {
    console.log("error: database name is required for export.");
    program.help();
    return process.exit(1);
  }

  if (!program.collection && !program.collection.length) {
    console.log("error: collection name is required for export.");
    program.help();
    return process.exit(1);
  }

  if (!program.keys && !program.keys.length) {
    console.log("error: keys are required for export.");
    program.help();
    return process.exit(1);
  }

  if (!program.fields && !program.fields.length) {
    console.log("error: fields are required for export.");
    program.help();
    return process.exit(1);
  }

  // console.log('Starting exporting process for database "%s" for collection "%s" for the key values: "%s" and export fields: "%s".',
  //  program.database, program.collection, program.keys.join(', '), program.fields.join(', '));

  sync.exportData({
    hostname: program.hostname,
    port: program.port,
    database: program.database,
    collection: program.collection,
    keyPaths: program.keys,
    fieldPaths: program.fields
  }, function(err, data){
    if (err) return console.log('DB error:', err);
    console.log(JSON.stringify(data, null, 4));
    process.exit(0);
  });
}