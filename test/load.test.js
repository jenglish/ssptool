/* vim: set sw=4 et :*/
/* global describe, it */

var expect = require('expect.js')
  , mock = require('../mock')
  , expected = mock.expected
  , _ = require('underscore')
  , opencontrol         // system under test
  ;

before(function () {
    opencontrol = require('../lib/opencontrol');
});

describe("Loader", function () {
    var db;

    before(function (done) { mock.preflight(done); });

    it("should work", function (done) {
        opencontrol.load(mock.datadir, function (err, _db) {
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
    it("should add 'key' and 'standard_key' properties", function () {
        expected.controls.forEach(key => {
	    let control = db.controls[key];
            expect(control).to.have.property('standard_key');
            expect(control).to.have.property('key');
            expect(control.key).to.equal(key);
	})
    });
    it("should not have any unexpected junk", function () {
        expect(_.keys(db.controls).length)
              .to.equal(expected.controls.length);
    });

    it("should load all components", function () {
        expected.components.forEach(key =>
            expect(db.components).to.have.property(key));
    });
    it("should add 'key' property to all components", function () {
        expected.components.forEach(key =>
            expect(db.components[key].key).to.equal(key));
    });
    it("should not have any unexpected junk", function () {
        expect(_.keys(db.components).length)
              .to.equal(expected.components.length);
    });
});
