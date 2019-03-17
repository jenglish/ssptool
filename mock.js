/**
 * Mock data for testing
 */

var path = require('path')
  , fs = require('fs')
  , basedir = path.join(__dirname, 'examples/test')
  , datadir = path.join(basedir, 'opencontrols')
  , docdir = path.join(basedir, 'markdowns')
  , assetsdir = path.join(basedir, 'assets')
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

exports.config = { datadir: datadir, docdir: docdir, assetsdir: assetsdir };
exports.preflight = preflight;
exports.expected = { // see freedonia-compliance repo
    standard: 'FRIST-800-53',
    controls: ['AU-1', 'AU-2', 'AU-2 (3)', 'PE-2', 'SC-1', 'SC-7', 'XX-1'],
    components: ['AU_policy', 'AWS_implementation', 'AWS_core', 'BAD-1', 'moda', 'modb'],
    certification: 'FredRAMP-low',
    certified: ['AU-1', 'AU-2', 'PE-2', 'SC-1', 'SC-7'],
};

exports.config.documents = {
    doc1: {
        title: 'test document',
        contents:
            [ { title: 'test controls generator', generate: 'controls' }
            , { title: 'test components generator', generate: 'components' }
            ]
    }
};
