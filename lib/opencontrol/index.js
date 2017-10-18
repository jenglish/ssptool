/** @file
 */

const async = require('async');

const { Database } = require('./database');
const { Loader} = require('./loader');

/**
 *  Loads all OpenControl data and Markdown pages, creating a new Database.
 *
 *  @param {Object} options - dictionary of options
 *  @param {string} options.datadir - directory containing OpenControl data
 *  @param {string} options.docdir - directory containing Markdown files
 *  @param {function(?Error,Database)} cb - continuation
 */
var load = function (options, done) {
    var db = new Database();
    var loader = new Loader();

    options.datadir = options.datadir || './opencontrols';
    options.docdir = options.docdir || './markdowns';

    async.series(
        [ k => loader.loadStandards(options.datadir,
            file => db.addStandard(file.data), k)
        , k => loader.loadComponents(options.datadir,
            file => db.addComponent(file.data), k)
        , k => loader.loadCertifications(options.datadir,
            file => db.addCertification(file.data), k)

        , k => loader.loadMarkdown(options.docdir, '**/*.md',
                file => db.pages.add(file), k)
        ], (err) =>  done(err, db)
    );
};

exports.Database = Database;
exports.Loader = Loader;
exports.load = load;
