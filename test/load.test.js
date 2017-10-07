/* vim: set sw=4 et :*/
/* global describe, it */

var prepScript =
    'Please run `compliance-masonry get` in the test directory\n' +
    'in order to populate the opencontrols/ data store\n';

var expect = require('expect.js')
  , path = require('path')
  , fs = require('fs')
  , _ = require('underscore')
  , datadir = path.join(__dirname, 'opencontrols')
  , opencontrol         // system under test
  ;

// see freedonia-compliance repo
var expected = {
    controls: ['AU-1', 'AU-2', 'AU-2 (3)', 'PE-2', 'SC-1', 'SC-7', 'XX-1'],
    components: ['AU_policy', 'AWS_implementation', 'AWS_core']
};

before(function () {
    opencontrol = require('../lib/opencontrol');
});

describe("Loader", function () {
    var db;

    before(function (done) {
        fs.stat(datadir, function (err, stat) {
            if (err || !stat.isDirectory()) {
                done(new Error(err.message + '\n\n' + prepScript))
            } else {
                done();
            }
        });
    })

    it("should work", function (done) {
        opencontrol.load(datadir, function (err, _db) {
            db = _db;
            done(err, db);
        });
    });

    it("should return a database", function () {
        expect(db).to.be.ok();
        expect(db).to.be.an(opencontrol.Database);
    });

    it("should load all controls", function () {
        expected.controls.forEach(key =>
            expect(db.controls).to.have.property(key));
    });
    it("should not have any unexpected junk", function () {
        expect(_.keys(db.controls).length)
              .to.equal(expected.controls.length);
    });

    it("should load all components", function () {
        expected.components.forEach(key =>
            expect(db.components).to.have.property(key));
    });
    it("should not have any unexpected junk", function () {
        expect(_.keys(db.components).length)
              .to.equal(expected.components.length);
    });

});
