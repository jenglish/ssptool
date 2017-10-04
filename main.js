#!/usr/bin/env node

var program = require('commander')
  , pkg = require('./package.json')
  , server = require('./commands/server')
  ;

program.version(pkg.version);

program
  .command('server')
  .description('Run preview server')
  .action(function (options) { server.run(options); })
  ;


program
  .command('*')
  .description('Show help')
  .action(function(env) { program.help(); })
  ;

program.parse(process.argv);
if (!program.args.length) { program.help(); }

