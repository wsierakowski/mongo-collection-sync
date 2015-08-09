#!/usr/bin/env node

/*
Export values:
db name: sigman-pl
collection name: posts
field(s) to be exported: hits
key field(s) to be referenced: _id

exported:
{
  db: ‘sigman-pl’,
  collection: ‘posts’,
  data: [{ref: {_id: ‘abc’}, data: {hits: 123}}]
}
 */

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
  return program.help();
}

if (program.import) {
  console.log('Starting importing process...');
} else if (program.export) {

  if (!program.database || !program.database.length) {
    console.log("error: database name is required for export.");
    return program.help();
  }

  if (!program.collection || !program.collection.length) {
    console.log("error: collection name is required for export.");
    return program.help();
  }

  if (!program.keys || !program.keys.length) {
    console.log("error: keys are required for export.");
    return program.help();
  }

  if (!program.fields || !program.fields.length) {
    console.log("error: fields are required for export.");
    return program.help();
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
    console.log(JSON.stringify(data));
    process.exit(0);
  });
}

//module.exports = require('./src/mongo-collection-sync');
