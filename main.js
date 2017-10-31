/**
 * @file ssptool CLI main entry point.
 */

var program = require('commander')
  , package = require('./package.json')
  , fs = require('fs')
  , config = require('./lib/config')
  , opencontrol = require('./lib/opencontrol')
  , logger = console
  , commands =
    { list: require('./commands/list')
    , validate: require('./commands/validate')
    , refcheck: require('./commands/refcheck')
    , document: require('./commands/document')
    };

program.version(package.version);

program.option('-c, --config <file>','path to configuration file');
program.option('-d, --datadir <dir>','path to opencontrols data','./opencontrols');
program.option('-m, --docdir <dir>','path to markdown documents','./markdowns');

/** Log an error.
 * @param {Error} err
 */
function logError(err) { logger.error(err.message); }

/**
 * Load configuration from file if --config specified or ssptool.yaml exists,
 * or from command-line arguments / program defaults otherwise.
 */
function loadConfig (cb) {
    var defaultFile = 'ssptool.yaml'
      , defaultConfig = { datadir: program.datadir, docdir: program.docdir }
      ;
    if (program.config) {
        config.load(program.config, cb);
    } else {
        fs.access(defaultFile, fs.constants.R_OK, err =>
            err ? cb(null, defaultConfig) : config.load(defaultFile, cb));
    }
}

function loadDatabase (cb) {
    var done = (err, db) => err ? logError(err) : cb(db);
    loadConfig ((err, config) =>
        err ? done(err) : opencontrol.load(config, done));
}

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

    logger.info('Loading opencontrol data...');
    loadDatabase(db => {
      logger.info('Initializing...');
      app.initialize(db);
      logger.info('Listening on http://localhost:%d', options.port);
      server.listen(options.port, () => logger.info('Ready.'));
    });
  });

program
  .command('list').alias('ls')
  .description('List all OpenControl artefacts')
  .action(function () {
    loadDatabase(db => commands.list.run(db));
  });

program
  .command('validate')
  .description('Validate all OpenControl artefacts')
  .action(function () {
    loadConfig ((err, config) =>
      err ? logError(err) : commands.validate(config));
  });

program
  .command('refcheck')
  .description('Referential integrity check')
  .action(function () {
    loadDatabase(db => commands.refcheck(db));
  });

program
  .command('report [reportid]')
  .description('Generate report')
  .action(function (reportid) {
    const reports = require('./lib/reports');
    const report = reports[reportid];
    if (reportid && !report) {
        logger.error('Report %s not defined', reportid);
    }
    if (!reportid || !report) {
        logger.info('\nAvailable reports:\n');
        for (reportid in reports) {
            logger.info('   %s - %s', reportid, reports[reportid].title);
        }
        logger.info('\n');
    } else {
        loadDatabase(db => {
            process.stdout.write(
                JSON.stringify(report.run(db), null, ' '));
        });
    }
  });

program
  .command('document <docid>')
  .description('Generate document')
  .action(function (docid) {
    loadConfig ((err, config) =>
      err ? logError(err) : opencontrol.load(config, (err, db) =>
        err ? logError(err) : commands.document(config, db, docid)));
  });

program
  .command('*')
  .description('Show help')
  .action(function() { program.help(); })
  ;

program.parse(process.argv);
if (!program.args.length) { program.help(); }

