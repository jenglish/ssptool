/*! vim: set et sw=4 :*/

var program = require('commander')
  , package = require('./package.json')
  , opencontrol = require('./lib/opencontrol')
  , logger = console
  , commands = 
    { list: require('./commands/list') };

program.version(package.version);

program.option('-d, --dir <dir>', 'Path to opencontrols data', './opencontrols')

/** Log an Error
 * @param err (Error) 
 */
function logError(err) { logger.error(err.message); }

/** Load opencontrols data and pass System to callback if successful.
 */
var loadControls = function (cb) {
    opencontrol.load(program.dir, function (err, db) {
        return err ? logError(err) : cb(db);
    });
};

/** Launch HTTP server
 */
program
  .command('server')
  .option('-p --port <port>', 'Server port', 3000, parseInt)
  .description('Run preview server')
  .action(function (options) {
    var app = require('./app')
      , http = require('http')
      , server = http.createServer(app)
      ;
    server.on('error', logError);

    loadControls(function (db) {
      app.set('db', db);
      server.listen(options.port, () =>
	logger.info('listening on http://localhost:%d', options.port));
    });
  });

program
  .command('list').alias('ls')
  .description('List all OpenControl artefacts')
  .action(function () {
    loadControls(db => commands.list.run(db));
  });

program
  .command('*')
  .description('Show help')
  .action(function(env) { program.help(); })
  ;

program.parse(process.argv);
if (!program.args.length) { program.help(); }

