/**
 * @file
 */
const path = require('path')
  , templateDir = path.join(__dirname, '..', 'views')
  , logger = console
  , debug = require('debug')('document')
  ;

const { Renderer, build } = require('../lib/document');

function notfound (what, name) {
    throw new Error(what + ' ' + name + ' not found');
}

const { linkto } = require('../lib/routes'); // TOFIX

function document (config, db, docid) {
    try {
        let spec = config.documents && config.documents[docid]
            || notfound('document', docid);

        debug('generating...');
        let document = build(db, spec);

        debug('rendering...');
        let renderer = new Renderer({
            templateDir: templateDir,
            templatePrefix: 'doc-',
            stream: process.stdout,
            globals: {
                linkto: linkto,
                document: document
            }
        });
        renderer.doctype();
        renderer.render('head', {});
        document.render(renderer);

        debug('done.');
    } catch (err) {
        logger.error(err.message);
        debug(err);
    }
}

module.exports = document;
