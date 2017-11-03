/**
 * @file
 */
const logger = console
  , debug = require('debug')('document')
  ;

const { build, print } = require('../lib/document');

function notfound (what, name) {
    throw new Error(what + ' ' + name + ' not found');
}

module.exports = function (config, db, docid) {
    try {
        let spec = config.documents && config.documents[docid]
            || notfound('document', docid);

        debug('generating...');
        let doc = build(db, spec);

        debug('rendering...');
        print (doc, process.stdout);

        debug('done.');
    } catch (err) {
        logger.error(err.message);
        debug(err);
    }
};
