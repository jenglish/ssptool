
var program = require('commander')
  , package = require('./package.json')
  , opencontrol = require('./lib/opencontrol')
  , logger = console
  , commands =
    { list: require('./commands/list')
    , validate: require('./commands/validate')
    };

program.version(package.version);

program.option('--datadir <dir>','path to opencontrols data','./opencontrols');
program.option('--docdir <dir>','path to markdown documents','./markdowns');

/** Log an error
 * @param {Error} err
 */
function logError(err) { logger.error(err.message); }

function loadDatabase (cb) {
    opencontrol.load({ datadir: program.datadir, docdir: program.docdir },
        (err, db) => err ? logError(err) : cb(db));
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
    commands.validate(program.datadir);
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
  .command('*')
  .description('Show help')
  .action(function() { program.help(); })
  ;

program.parse(process.argv);
if (!program.args.length) { program.help(); }

