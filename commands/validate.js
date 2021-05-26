/** @file `ssptool validate` command
 */

const { Loader } = require('../lib/opencontrol/loader')
  , validator = require('../lib/opencontrol/validator')
  , async = require('async')
  , logger = console
  , logError = err => logger.error(err.message)
  , debug = require('debug')('validate')
  ;

function reportErrors (filename, errors) {
    logger.warn(filename);
    for (var error of errors) {
        var details = [];
        for (var k in error.params) {
            details.push(k + '=' + error.params[k].toString());
        }
        logger.warn('\t' + error.dataPath + ': ' + error.message);
        if (details.length) {
            logger.warn('\t' + '(' + details.join(',') + ')');
        }
        debug(error);
    }
}

function validate_a (what) {
    return function (file) {
        debug('Checking ', file.relative);
        if (!validator.validate(what, file.data)) {
            reportErrors(file.relative, validator.errors);
        }
    };
}

var alldone = (err, _unused) => { if (err) logError(err); logger.info('Done.'); };

function validate (config) {
    var datadir = config.datadir
      , docdir = config.docdir
      , loader = new Loader()
      ;

    if (config._errors) {
        reportErrors(config._configfile || 'configuration', config._errors);
    }
    async.series([
        k => loader.loadComponents(datadir, validate_a('component'), k),
        k => loader.loadStandards(datadir, validate_a('standard'), k),
        k => loader.loadCertifications(datadir, validate_a('certification'), k),
        k => loader.loadMarkdown(docdir, '**/*.md', validate_a('page'), k),
    ], alldone);
}

module.exports = validate;

