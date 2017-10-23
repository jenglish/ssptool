
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
        logger.warn('\t' + error.dataPath + ': ' + error.message);
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
      , loader = new Loader()
      ;

    if (config._errors) {
        reportErrors('config file', config._errors);
    }
    async.series([
        k => loader.loadComponents(datadir, validate_a('component'), k),
        k => loader.loadStandards(datadir, validate_a('standard'), k),
        k => loader.loadCertifications(datadir, validate_a('certification'), k),
    ], alldone);
}

module.exports = validate;

