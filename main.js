/*! vim: set et sw=4 :*/

var program = require('commander')
  , package = require('./package.json')
  , opencontrol = require('./lib/opencontrol')
  , logger = console
  , commands = {
      server: require('./commands/server')
    , list: require('./commands/list')
  };

program.version(package.version);

program.option('-d, --dir <dir>', 'Path to opencontrols data', './opencontrols')

/** Load opencontrols data and pass System to callback if successful.
 */
var loadControls = function (cb) {
    opencontrol.load(program.dir, function (err, sys) {
        return err ? logger.error(err) : cb(sys);
    });
};

program
  .command('server')
  .description('Run preview server')
  .action(function (options) { commands.server.run(options); })
  ;

program
  .command('list').alias('ls')
  .description('List all OpenControl artefacts')
  .action(function (options) {
    loadControls(sys => commands.list.run(sys));
  });

program
  .command('*')
  .description('Show help')
  .action(function(env) { program.help(); })
  ;

program.parse(process.argv);
if (!program.args.length) { program.help(); }

