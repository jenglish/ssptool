/**
 * @file Loads YAML and Markdown files.
 */

var yaml = require('js-yaml')
  , grayMatter = require('gulp-gray-matter')
  , mdparser = require('./mdparser')
  , vfs = require('vinyl-fs')
  , through = require('through2')
  , exhaust = require('stream-exhaust')
  , end = require('stream-end')
  , logger = console
  , logError = err => logger.error(err.message)
  , debug = require('debug')('opencontrol.loader')
  ;

/**
 * @callback fileCallback
 * @param {File} file - Vinyl virtual file object
 */

/** Create transform stream from file callback.
 *  Exceptions thrown from the handler are logged.
 *  @param {fileCallback} handler
 *  @return transform stream
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
};

/**
 * file callback: parse contents as YAML, add 'data' property.
 */
var parseYAML = function (file) {
    let fn = file.relative, contents = file.contents.toString();
    file.data = yaml.load(contents, { filename: fn, schema: yaml.CORE_SCHEMA });
};

/**
 * file callback: parse contents as Markdown, add 'html' property.
 */
var parseMarkdown = function (file) {
    file.html = mdparser.parse(file.contents.toString());
};

/** file callback: adds 'key' property.
 *
 *  For components (which are always named "component.yaml"),
 *  this is taken from the yaml.key property if present,
 *  defaulting to the directory name otherwise.
 *
 *  For other artefacts, use the the basename of the file minus .yaml extension.
 */
var addKey = function (file) {
    if (file.basename === 'component.yaml') {
        var dir = file.dirname.split('/')
          , key = dir[dir.length - 1];
        file.key = file.data.key = file.data.key || key;
    } else {
        file.key = file.stem;
    }
};

/** Loads YAML and Markdown files.
 */
class Loader {
    constructor () { }

    /**
     * Load all YAML files under directory matching pattern
     * passing them to specified callback.
     * @param {string} dir - starting directory
     * @param {string} pattern - glob pattern
     * @param {fileCallback} cb
     * @param {function} done - continuation
     */
    loadYAML (dir, pattern, cb, done) {
        debug('Scanning %s', pattern);
        var finished = (err, ans) => {
            debug('Scanned  %s', pattern);
            done(err, ans);
        };
        exhaust(
            vfs.src(pattern, { cwd: dir, follow: true })
                .pipe(fileCallback(parseYAML))
                .pipe(fileCallback(addKey))
                .pipe(fileCallback(cb))
                .pipe(end(finished))
        );
    }

    /**
     * Load all Markdown files under directory matching pattern,
     * passing them to specified callback.
     * @param {string} dir - starting directory
     * @param {string} pattern - glob pattern
     * @param {fileCallback} cb
     * @param {Function} done - continuation
     */
    loadMarkdown (dir, pattern, cb, done) {
        debug('Scanning %s', pattern);
        var finished = (err, ans) => {
            debug('Scanned  %s', pattern);
            done(err, ans);
        };
        var yamlopts = { schema: yaml.CORE_SCHEMA };
        exhaust(
            vfs.src(pattern, { cwd: dir, follow: true })
                .pipe(grayMatter({ parser: fm => yaml.load(fm, yamlopts) }))
                .pipe(fileCallback(parseMarkdown))
                .pipe(fileCallback(cb))
                .pipe(end(finished))
        );
    }

    // convenience routines:
    // look in standard compliance-masonry paths for various artefact types.
    loadStandards (datadir, cb, done) {
        this.loadYAML(datadir, 'standards/*.yaml', cb, done);
    }
    loadComponents (datadir, cb, done) {
        this.loadYAML(datadir, 'components/**/component.yaml', cb, done);
    }
    loadCertifications (datadir, cb, done) {
        this.loadYAML(datadir, 'certifications/*.yaml', cb, done);
    }
}

exports.Loader = Loader;
