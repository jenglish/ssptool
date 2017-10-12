/**
 * Mock data for testing
 */

var path = require('path')
  , fs = require('fs')
  , basedir = path.join(__dirname, 'examples')
  , datadir = path.join(basedir, 'opencontrols')
  ;

var prepScript =
    'Please run `compliance-masonry get`\n' +
    'in ' + basedir +' \n' +
    'in order to populate the opencontrols/ data store\n';

/**
 * Preflight check for test scripts.
 * Usage (in mocha):
 *      before (function (done) { preflight(done); });
 */
function preflight (done) {
    fs.stat(datadir, function (err, stat) {
        if (err || !stat.isDirectory()) {
            done(new Error(err.message + '\n\n' + prepScript));
        } else {
            done();
        }
    });
}

exports.preflight = preflight;
exports.datadir = datadir;
exports.expected = { // see freedonia-compliance repo
    controls: ['AU-1', 'AU-2', 'AU-2 (3)', 'PE-2', 'SC-1', 'SC-7', 'XX-1'],
    components: ['AU_policy', 'AWS_implementation', 'AWS_core']
};
