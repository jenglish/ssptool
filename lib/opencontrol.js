/*! vim: set et sw=4 :*/

var yaml = require('js-yaml')
  , vfs = require('vinyl-fs')
  , through = require('through2')
  , path = require('path')
  , async = require('async')
  , exhaust = require('stream-exhaust')
  , debug = require('debug')('opencontrol')
  , logger = console
  , _ = require('lodash')
  ;

var logError = function (err) { logger.error(err.message); }

/**
 * Holding bucket for OpenControl data.
 */
class Database {

    constructor() {
        this._standards = {};
        this._certifications = {};
        this._components = {};

        this._controls = {};
    };

    get standards()             { return this._standards; }
    get certifications()        { return this._certifications; }
    get components()            { return this._components; }
    get controls()              { return this._controls; }

    addStandard (standard) {
        debug("Found standard: %s", standard.name);
        this.standards[standard.name] = standard;
        delete standard.name;
        _.forEach(standard, (value, key) => this.addControl(key, value))
    }

    addControl (key, control) {
        debug(" ... Found control: %s", key);
        this.controls[key] = control;
    }

    addComponent (component) {
        debug("... Found component: %s", component.key);
        this.components[component.key] = component;
    }

    addCertification (certification) {
        debug("... Found certification: %s", certification.name);
        this.certifications[certification.name] = certification;
    }
}

/**
 */
var parseYAML = function (file) {
    var fn = file.relative
      , contents = file.contents.toString()
      ;
    file.yaml = yaml.safeLoad(contents, { filename: fn});
}

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

/** file callback: adds key property.
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

/** Loads all of the OpenControl data in the specified directory
 *  (typically `./opencontrols/`) into a new {@link opencontrol.Database}.
 *
 *  @param cb - callback function (err, db)
 */
var load = function (dir, done) {
    var db = new Database();
    var loadSection = function(pattern, handler) {
        var subdir = path.join(dir, pattern);
        debug("Scanning %s", subdir);
        return function (k) {
            exhaust(vfs.src(subdir)
                .pipe(fileCallback(parseYAML))
                .pipe(fileCallback(addKey))
                .pipe(fileCallback(file => handler(file.yaml)))
                .on('finish', k)
            );
        }
    }
    async.parallel(
       [ loadSection('standards/*.yaml', db.addStandard.bind(db))
       , loadSection('components/*/*.yaml', db.addComponent.bind(db))
       , loadSection('certifications/*.yaml', db.addCertification.bind(db))
       ], function (err, _unused) { done(err, db); });
};

exports.load = load;
exports.Database = Database;

