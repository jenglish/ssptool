/**
 */

var yaml = require('js-yaml')
  , vfs = require('vinyl-fs')
  , through = require('through2')
  , path = require('path')
  , async = require('async')
  , exhaust = require('stream-exhaust')
  , end = require('stream-end')
  , debug = require('debug')('opencontrol')
  , logger = console
  , logError = err => logger.error(err.message)
  , debug = require('debug')('opencontrol.loader')
  , _ = require('lodash')
  , Database = require('./database').Database
  ;


/** Create transform stream from file callback.
 */
var fileCallback = function (handler) {
    return through.obj(function (file, _unused, cb) {
        try {
            handler(file);
        } catch (err) {
            logError(err);
            return cb();
        }
        return cb(null, file);
    });
}

/** file callback: parse contents as YAML and add 'yaml' property.
 */
var parseYAML = function (file) {
    let fn = file.relative, contents = file.contents.toString();
    file.yaml = yaml.safeLoad(contents, { filename: fn});
}

/** file callback: adds 'key' property.
 *
 *  For components (which are always named "component.yaml"),
 *  this is taken from the yaml.key property if present,
 *  defaulting to the directory name otherwise.
 *
 *  For other artefacts, use the the basename of the file minus .yaml extension.
 */
var addKey = function (file) {
    if (file.basename === "component.yaml") {
        var dir = file.dirname.split('/')
          , key = dir[dir.length - 1];
        file.key = file.yaml.key = file.yaml.key || key;
    } else {
        file.key = file.stem;
    }
}

/** Helper class.
 */
class Loader {
    constructor (datadir) {
        this.datadir = datadir;
    }

    runPipe (pattern, cb, done) {
        debug("Scanning %s", pattern);
        var finished = (err, ans) => {
            debug("Scanned  %s", pattern);
            done(err, ans);
        }
        exhaust(
            vfs.src(pattern, { cwd: this.datadir })
                .pipe(fileCallback(parseYAML))
                .pipe(fileCallback(addKey))
                .pipe(fileCallback(cb))
                .pipe(end(finished))
        )
    };

    loadStandards (cb, done) {
        this.runPipe('standards/*.yaml', cb, done);
    }
    loadComponents (cb, done) {
        this.runPipe('components/**/component.yaml', cb, done);
    }
    loadCertifications (cb, done) {
        this.runPipe('certifications/*.yaml', cb, done);
    }
};

/** Loads all of the OpenControl data in the specified directory
 *  (typically `./opencontrols/`) into a new {@link opencontrol.Database}.
 *
 *  @param cb - callback function (err, db)
 */
var load = function (datadir, done) {
    var db = new Database(), loader = new Loader(datadir);
    async.series(
        [ k => loader.loadStandards(file => db.addStandard(file.yaml), k)
        , k => loader.loadComponents(file => db.addComponent(file.yaml), k)
        , k => loader.loadCertifications(file => db.addCertification(file.yaml), k)
        ], (err, _unused) =>  done(err, db)
    );
};

exports.load = load;
exports.Loader = Loader;

