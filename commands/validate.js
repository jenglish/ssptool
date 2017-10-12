
const { Loader } = require('../lib/opencontrol/loader')
  , validator = require('../lib/opencontrol/validator')
  , async = require('async')
  , logger = console
  , logError = err => logger.error(err.message)
  , debug = require('debug')('validate')
  ;

function reportErrors (file, errors) {
    logger.warn(file.relative);
    for (var error of errors) {
        logger.warn('\t' + error.dataPath + ': ' + error.message);
        debug(error);
    }
}

function validate_a (what) {
    return function (file) {
        debug('Checking ', file.relative);
        if (!validator.validate(what, file.yaml)) {
            reportErrors(file, validator.errors);
        }
    };
}

var alldone = (err, _unused) => { if (err) logError(err); logger.info('Done.'); };

function validate (datadir) {
    var loader = new Loader(datadir);
    async.series([
        k => loader.loadComponents(validate_a('component'), k),
        k => loader.loadStandards(validate_a('standard'), k),
        k => loader.loadCertifications(validate_a('certification'), k),
    ], alldone);
}

module.exports = validate;

